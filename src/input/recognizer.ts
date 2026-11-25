import { APP_CONFIG, type RecognitionThresholds } from '../content/config';
import type { DigitCandidate, DigitTemplate, RecognitionResult, Stroke, StrokePoint } from '../core/types';
import { BUILTIN_TEMPLATES } from './templates';

const RESAMPLE_N = 28;
const RASTER_SIZE = 16;
const ASYMMETRIC_DIGITS = new Set([1, 2, 3, 4, 5, 6, 7, 9]);

interface BBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
}

interface TopologyFeatures {
  topSpread: number;
  midSpread: number;
  botSpread: number;
  topLeftDensity: number;
  botLeftDensity: number;
  botRightDensity: number;
  topCrossings: number;
  botCrossings: number;
  midCenterRatio: number;
}

interface PreparedTemplate {
  digit: number;
  strokes: Array<Array<{ x: number; y: number; tx: number; ty: number }>>;
  merged: Array<{ x: number; y: number; tx: number; ty: number }>;
  raster: Float32Array;
  aspectRatio: number;
  isBuiltin: boolean;
}

function getBBox(strokes: Stroke[]): BBox {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const s of strokes) {
    for (const p of s) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
  }
  if (!Number.isFinite(minX)) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
  }
  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function strokeLength(pts: Array<{ x: number; y: number }>): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  return len;
}

function resamplePoints(pts: Array<{ x: number; y: number }>, n: number): Array<{ x: number; y: number }> {
  if (pts.length === 0) return [];
  if (pts.length === 1) {
    return Array.from({ length: n }, () => ({ x: pts[0].x, y: pts[0].y }));
  }
  const totalLen = strokeLength(pts);
  if (totalLen < 1e-6) {
    return Array.from({ length: n }, () => ({ x: pts[0].x, y: pts[0].y }));
  }

  const interval = totalLen / (n - 1);
  const out: Array<{ x: number; y: number }> = [{ x: pts[0].x, y: pts[0].y }];
  let accum = 0;
  let prev = pts[0];

  for (let i = 1; i < pts.length; i++) {
    const curr = pts[i];
    let segLen = Math.hypot(curr.x - prev.x, curr.y - prev.y);
    while (accum + segLen >= interval && out.length < n) {
      const ratio = (interval - accum) / Math.max(segLen, 1e-9);
      const nx = prev.x + ratio * (curr.x - prev.x);
      const ny = prev.y + ratio * (curr.y - prev.y);
      const newPt = { x: nx, y: ny };
      out.push(newPt);
      prev = newPt;
      segLen = Math.hypot(curr.x - prev.x, curr.y - prev.y);
      accum = 0;
    }
    accum += segLen;
    prev = curr;
  }

  while (out.length < n) {
    const last = pts[pts.length - 1];
    out.push({ x: last.x, y: last.y });
  }
  return out;
}

function attachTangents(pts: Array<{ x: number; y: number }>): Array<{ x: number; y: number; tx: number; ty: number }> {
  return pts.map((p, idx) => {
    const prev = pts[Math.max(0, idx - 1)];
    const next = pts[Math.min(pts.length - 1, idx + 1)];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const mag = Math.hypot(dx, dy) || 1;
    return { x: p.x, y: p.y, tx: dx / mag, ty: dy / mag };
  });
}

function normalizeStrokesAspectPreserving(strokes: Stroke[]): {
  strokes: Array<Array<{ x: number; y: number; tx: number; ty: number }>>;
  merged: Array<{ x: number; y: number; tx: number; ty: number }>;
  aspectRatio: number;
  bbox: BBox;
  totalLen: number;
} {
  const nonEmpty = strokes.filter((s) => s.length > 0);
  const bbox = getBBox(nonEmpty);
  const scale = Math.max(bbox.width, bbox.height, 1e-4);
  const cx = (bbox.minX + bbox.maxX) / 2;
  const cy = (bbox.minY + bbox.maxY) / 2;

  let rawLen = 0;
  for (const s of nonEmpty) {
    rawLen += strokeLength(s);
  }

  const normalized = nonEmpty.map((s) => {
    const mapped = s.map((p) => ({
      x: 0.5 + (p.x - cx) / scale,
      y: 0.5 + (p.y - cy) / scale,
    }));
    return attachTangents(resamplePoints(mapped, RESAMPLE_N));
  });

  const flatRaw: Array<{ x: number; y: number }> = [];
  for (const s of nonEmpty) {
    for (const p of s) {
      flatRaw.push({
        x: 0.5 + (p.x - cx) / scale,
        y: 0.5 + (p.y - cy) / scale,
      });
    }
  }
  const merged = attachTangents(resamplePoints(flatRaw, RESAMPLE_N));
  const aspectRatio = bbox.width / Math.max(bbox.height, 1e-4);

  return { strokes: normalized, merged, aspectRatio, bbox, totalLen: rawLen };
}

function countHorizontalCrossings(strokes: Array<Array<{ x: number; y: number }>>, yLevel: number): number {
  let count = 0;
  for (const s of strokes) {
    for (let i = 1; i < s.length; i++) {
      const y1 = s[i - 1].y;
      const y2 = s[i].y;
      if ((y1 <= yLevel && y2 > yLevel) || (y2 <= yLevel && y1 > yLevel)) {
        count++;
      }
    }
  }
  return count;
}

function extractTopology(strokes: Array<Array<{ x: number; y: number }>>): TopologyFeatures {
  const bandSpread = (yLo: number, yHi: number) => {
    let minX = Infinity;
    let maxX = -Infinity;
    let count = 0;
    let leftCount = 0;
    let rightCount = 0;
    for (const s of strokes) {
      for (const p of s) {
        if (p.y >= yLo && p.y <= yHi) {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          count++;
          if (p.x < 0.45) leftCount++;
          if (p.x > 0.55) rightCount++;
        }
      }
    }
    return {
      spread: Number.isFinite(minX) ? maxX - minX : 0,
      count,
      leftRatio: count > 0 ? leftCount / count : 0,
      rightRatio: count > 0 ? rightCount / count : 0,
    };
  };

  const top = bandSpread(0.08, 0.38);
  const mid = bandSpread(0.40, 0.60);
  const bot = bandSpread(0.62, 0.92);

  let midCenterPts = 0;
  let midTotalPts = 0;
  for (const s of strokes) {
    for (const p of s) {
      if (p.y >= 0.40 && p.y <= 0.60) {
        midTotalPts++;
        if (p.x >= 0.38 && p.x <= 0.62) midCenterPts++;
      }
    }
  }

  return {
    topSpread: top.spread,
    midSpread: mid.spread,
    botSpread: bot.spread,
    topLeftDensity: top.leftRatio,
    botLeftDensity: bot.leftRatio,
    botRightDensity: bot.rightRatio,
    topCrossings: countHorizontalCrossings(strokes, 0.28),
    botCrossings: countHorizontalCrossings(strokes, 0.72),
    midCenterRatio: midTotalPts > 0 ? midCenterPts / midTotalPts : 0,
  };
}

function rasterizeStrokes(strokes: Array<Array<{ x: number; y: number }>>): Float32Array {
  const grid = new Float32Array(RASTER_SIZE * RASTER_SIZE);
  const margin = 1.5;
  const span = RASTER_SIZE - 1 - 2 * margin;

  for (const s of strokes) {
    for (let i = 0; i < s.length; i++) {
      const gx = margin + s[i].x * span;
      const gy = margin + s[i].y * span;
      const ix = Math.round(gx);
      const iy = Math.round(gy);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const px = ix + dx;
          const py = iy + dy;
          if (px >= 0 && px < RASTER_SIZE && py >= 0 && py < RASTER_SIZE) {
            const dist = Math.hypot(px - gx, py - gy);
            const val = Math.exp(-(dist * dist) / 1.15);
            const idx = py * RASTER_SIZE + px;
            if (val > grid[idx]) grid[idx] = val;
          }
        }
      }
    }
  }

  let norm = 0;
  for (let i = 0; i < grid.length; i++) {
    norm += grid[i] * grid[i];
  }
  const denom = Math.sqrt(norm) || 1;
  for (let i = 0; i < grid.length; i++) {
    grid[i] /= denom;
  }
  return grid;
}

function cosineSim(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

function pathSimilarity(
  a: Array<{ x: number; y: number; tx: number; ty: number }>,
  b: Array<{ x: number; y: number; tx: number; ty: number }>
): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  let distSum = 0;
  let tanSum = 0;
  for (let i = 0; i < n; i++) {
    distSum += Math.hypot(a[i].x - b[i].x, a[i].y - b[i].y);
    tanSum += a[i].tx * b[i].tx + a[i].ty * b[i].ty;
  }
  const avgDist = distSum / n;
  const avgTan = tanSum / n;
  const posScore = Math.exp(-avgDist * 4.0);
  const tanScore = Math.max(0, (avgTan + 1) / 2);
  return 0.65 * posScore + 0.35 * tanScore;
}

// Direction- and start-point-invariant shape similarity (Chamfer distance on merged points)
function chamferShapeSimilarity(
  a: Array<{ x: number; y: number }>,
  b: Array<{ x: number; y: number }>
): number {
  if (a.length === 0 || b.length === 0) return 0;
  let sumA = 0;
  for (let i = 0; i < a.length; i++) {
    let minD = Infinity;
    for (let j = 0; j < b.length; j++) {
      const d = Math.hypot(a[i].x - b[j].x, a[i].y - b[j].y);
      if (d < minD) minD = d;
    }
    sumA += minD;
  }
  let sumB = 0;
  for (let j = 0; j < b.length; j++) {
    let minD = Infinity;
    for (let i = 0; i < a.length; i++) {
      const d = Math.hypot(a[i].x - b[j].x, a[i].y - b[j].y);
      if (d < minD) minD = d;
    }
    sumB += minD;
  }
  const avg = (sumA / a.length + sumB / b.length) / 2;
  return Math.exp(-avg * 7.0);
}

function prepareTemplate(t: DigitTemplate): PreparedTemplate {
  const norm = normalizeStrokesAspectPreserving(t.strokes);
  return {
    digit: t.digit,
    strokes: norm.strokes,
    merged: norm.merged,
    raster: rasterizeStrokes(norm.strokes),
    aspectRatio: norm.aspectRatio,
    isBuiltin: t.source === 'builtin',
  };
}

const PREPARED_BUILTIN: PreparedTemplate[] = BUILTIN_TEMPLATES.map(prepareTemplate);

function topologyFactor(digit: number, aspectRatio: number, topo: TopologyFeatures): number {
  let factor = 1.0;

  // Narrow vertical digits
  if (aspectRatio < 0.28 && digit !== 1 && digit !== 7) {
    factor *= 0.55;
  } else if (aspectRatio > 0.55 && digit === 1) {
    factor *= 0.72;
  }

  // Structural distinction for 8 (two loops + center crossing/pinch) vs 0/3/6/9
  if (topo.topCrossings >= 2 && topo.botCrossings >= 2) {
    if (topo.midCenterRatio >= 0.42) {
      // Strong waist / center crossing -> 8!
      if (digit === 8) factor *= 1.12;
      if (digit === 0) factor *= 0.80;
      if (digit === 3) factor *= 0.85;
    } else {
      // Wide open center -> 0!
      if (digit === 0) factor *= 1.08;
      if (digit === 8) factor *= 0.86;
    }
  }

  // Structural distinction for 9 (top loop >= 2 crossings, bottom single stem = 1 crossing on right)
  if (topo.topCrossings >= 2 && topo.botCrossings === 1 && topo.botSpread < 0.34) {
    if (digit === 9) factor *= 1.12;
    if (digit === 6) factor *= 0.75;
    if (digit === 0) factor *= 0.82;
    if (digit === 8) factor *= 0.82;
  }

  // Structural distinction for 6 (top single stem = 1 crossing, bottom loop >= 2 crossings)
  if (topo.topCrossings === 1 && topo.botCrossings >= 2 && topo.topSpread < 0.34) {
    if (digit === 6) factor *= 1.12;
    if (digit === 9) factor *= 0.75;
    if (digit === 0) factor *= 0.82;
    if (digit === 8) factor *= 0.82;
  }

  return factor;
}

function scoreAgainstTemplate(
  normStrokes: Array<Array<{ x: number; y: number; tx: number; ty: number }>>,
  merged: Array<{ x: number; y: number; tx: number; ty: number }>,
  raster: Float32Array,
  aspectRatio: number,
  topo: TopologyFeatures,
  tpl: PreparedTemplate
): number {
  const rasterSim = cosineSim(raster, tpl.raster);
  const shapeSim = chamferShapeSimilarity(merged, tpl.merged);
  let geomSim = 0;

  if (normStrokes.length === tpl.strokes.length) {
    if (normStrokes.length === 1) {
      geomSim = pathSimilarity(normStrokes[0], tpl.strokes[0]);
    } else if (normStrokes.length === 2) {
      const orderDirect =
        0.5 * (pathSimilarity(normStrokes[0], tpl.strokes[0]) + pathSimilarity(normStrokes[1], tpl.strokes[1]));
      const orderSwapped =
        0.5 * (pathSimilarity(normStrokes[0], tpl.strokes[1]) + pathSimilarity(normStrokes[1], tpl.strokes[0]));
      geomSim = Math.max(orderDirect, orderSwapped * 0.96);
    } else {
      geomSim = pathSimilarity(merged, tpl.merged) * 0.9;
    }
  } else {
    geomSim = pathSimilarity(merged, tpl.merged) * 0.86;
  }

  const tf = topologyFactor(tpl.digit, aspectRatio, topo);
  const learnedBoost = tpl.isBuiltin ? 1.0 : 1.05;
  // Blend directional path (0.38), direction-invariant Chamfer shape (0.32), and 16x16 raster (0.30)
  return (0.38 * geomSim + 0.32 * shapeSim + 0.30 * rasterSim) * tf * learnedBoost;
}

function mirrorRawStrokes(strokes: Stroke[]): Stroke[] {
  const bbox = getBBox(strokes);
  const cx = (bbox.minX + bbox.maxX) / 2;
  return strokes.map((s) =>
    s.map((p): StrokePoint => ({
      x: 2 * cx - p.x,
      y: p.y,
      t: p.t,
    }))
  );
}

function isInConfusionGroup(d1: number, d2: number): boolean {
  return APP_CONFIG.confusionGroups.some(
    ([a, b]) => (a === d1 && b === d2) || (a === d2 && b === d1)
  );
}

function scoresToProbabilities(bestByDigit: Map<number, number>): DigitCandidate[] {
  const temperature = 9.5;
  const entries = Array.from({ length: 10 }, (_, d) => ({
    digit: d,
    rawScore: bestByDigit.get(d) ?? 0,
  }));

  const maxRaw = Math.max(...entries.map((e) => e.rawScore));
  const exps = entries.map((e) => Math.exp((e.rawScore - maxRaw) * temperature));
  const sumExp = exps.reduce((a, b) => a + b, 0) || 1;

  return entries
    .map((e, idx) => ({
      digit: e.digit,
      rawScore: e.rawScore,
      probability: exps[idx] / sumExp,
    }))
    .sort((a, b) => b.probability - a.probability);
}

export function recognizeDigit(
  strokes: Stroke[],
  learnedTemplates: DigitTemplate[] = [],
  thresholds: RecognitionThresholds = APP_CONFIG.recognition
): RecognitionResult {
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const nonEmpty = strokes.filter((s) => s.length > 0);

  if (nonEmpty.length === 0) {
    return {
      status: 'unreadable',
      digit: null,
      candidates: [],
      mirrored: false,
      confidence: 0,
      durationMs: 0,
      strokesCount: 0,
    };
  }

  const norm = normalizeStrokesAspectPreserving(nonEmpty);

  const isTiny = Math.max(norm.bbox.width, norm.bbox.height) < 12 && norm.totalLen < 20;
  const totalPoints = nonEmpty.reduce((sum, s) => sum + s.length, 0);
  if (isTiny || totalPoints < 3 || nonEmpty.length > 4) {
    const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    return {
      status: 'unreadable',
      digit: null,
      candidates: [],
      mirrored: false,
      confidence: 0,
      durationMs: Math.max(0.1, t1 - t0),
      strokesCount: nonEmpty.length,
    };
  }

  const raster = rasterizeStrokes(norm.strokes);
  const topo = extractTopology(norm.strokes);
  const allTemplates = [...PREPARED_BUILTIN, ...learnedTemplates.map(prepareTemplate)];

  const bestByDigit = new Map<number, number>();
  for (const tpl of allTemplates) {
    const sc = scoreAgainstTemplate(norm.strokes, norm.merged, raster, norm.aspectRatio, topo, tpl);
    const prev = bestByDigit.get(tpl.digit) ?? 0;
    if (sc > prev) bestByDigit.set(tpl.digit, sc);
  }

  // Check mirrored strokes against asymmetric built-in templates
  const mirroredRaw = mirrorRawStrokes(nonEmpty);
  const normMirrored = normalizeStrokesAspectPreserving(mirroredRaw);
  const rasterMirrored = rasterizeStrokes(normMirrored.strokes);
  const topoMirrored = extractTopology(normMirrored.strokes);

  let bestMirroredDigit: number | null = null;
  let bestMirroredScore = 0;
  const bestMirroredByDigit = new Map<number, number>();

  for (const tpl of PREPARED_BUILTIN) {
    if (!ASYMMETRIC_DIGITS.has(tpl.digit)) continue;
    const sc = scoreAgainstTemplate(
      normMirrored.strokes,
      normMirrored.merged,
      rasterMirrored,
      normMirrored.aspectRatio,
      topoMirrored,
      tpl
    );
    const prev = bestMirroredByDigit.get(tpl.digit) ?? 0;
    if (sc > prev) bestMirroredByDigit.set(tpl.digit, sc);
    if (sc > bestMirroredScore) {
      bestMirroredScore = sc;
      bestMirroredDigit = tpl.digit;
    }
  }

  const bestNormalRaw = Math.max(...Array.from(bestByDigit.values()), 0);

  let isMirrored = false;
  let activeScores = bestByDigit;
  if (
    bestMirroredDigit !== null &&
    bestNormalRaw < 0.72 &&
    bestMirroredScore >= 0.72 &&
    bestMirroredScore - bestNormalRaw >= 0.14
  ) {
    isMirrored = true;
    activeScores = new Map(bestByDigit);
    for (const [d, sc] of bestMirroredByDigit.entries()) {
      activeScores.set(d, Math.max(activeScores.get(d) ?? 0, sc));
    }
  }

  const candidates = scoresToProbabilities(activeScores);
  const top1 = candidates[0];
  const top2 = candidates[1];
  const topRaw = top1 ? top1.rawScore : 0;
  const margin = top1 && top2 ? top1.probability - top2.probability : 1;

  const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const durationMs = Math.max(0.1, t1 - t0);

  if (!top1 || topRaw < 0.44 || top1.probability < thresholds.tau_lesbar) {
    return {
      status: 'unreadable',
      digit: null,
      candidates: candidates.slice(0, 3),
      mirrored: false,
      confidence: top1?.probability ?? 0,
      durationMs,
      strokesCount: nonEmpty.length,
    };
  }

  const inConfusion = top2 ? isInConfusionGroup(top1.digit, top2.digit) : false;
  const effectiveMarginThreshold = inConfusion ? thresholds.tau_verwechslung : thresholds.tau_abstand;

  if (top1.probability >= thresholds.tau_eindeutig && margin >= effectiveMarginThreshold) {
    return {
      status: 'clear',
      digit: top1.digit,
      candidates: candidates.slice(0, 3),
      mirrored: isMirrored,
      confidence: top1.probability,
      durationMs,
      strokesCount: nonEmpty.length,
    };
  }

  if (top1.probability >= thresholds.tau_rueckfrage && top2) {
    return {
      status: 'clarify',
      digit: top1.digit,
      candidates: candidates.slice(0, 3),
      clarifyPair: [top1.digit, top2.digit],
      mirrored: isMirrored,
      confidence: top1.probability,
      durationMs,
      strokesCount: nonEmpty.length,
    };
  }

  return {
    status: 'unreadable',
    digit: null,
    candidates: candidates.slice(0, 3),
    mirrored: false,
    confidence: top1.probability,
    durationMs,
    strokesCount: nonEmpty.length,
  };
}
