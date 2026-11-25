import type { DigitTemplate, Stroke, StrokePoint } from '../core/types';

function makeStroke(pts: Array<[number, number]>): Stroke {
  return pts.map(([x, y], idx) => ({ x, y, t: idx * 20 }));
}

function arc(cx: number, cy: number, rx: number, ry: number, startDeg: number, endDeg: number, steps = 12): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    const deg = startDeg + ((endDeg - startDeg) * i) / steps;
    const rad = (deg * Math.PI) / 180;
    out.push([cx + rx * Math.cos(rad), cy + ry * Math.sin(rad)]);
  }
  return out;
}

function line(x0: number, y0: number, x1: number, y1: number, steps = 8): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    out.push([x0 + (x1 - x0) * f, y0 + (y1 - y0) * f]);
  }
  return out;
}

function figureEight(dir: 1 | -1, startPhase = 0, steps = 32): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    const theta = startPhase + (i / steps) * Math.PI * 2;
    const x = 0.5 + dir * 0.24 * Math.sin(2 * theta);
    const y = 0.5 - 0.39 * Math.cos(theta);
    out.push([x, y]);
  }
  return out;
}

export const BUILTIN_TEMPLATES: DigitTemplate[] = [
  // 0: Counter-clockwise and clockwise ovals
  {
    id: 'builtin_0_ccw',
    digit: 0,
    source: 'builtin',
    createdAt: 0,
    strokes: [makeStroke(arc(0.5, 0.5, 0.28, 0.40, -90, -450, 24))],
  },
  {
    id: 'builtin_0_cw',
    digit: 0,
    source: 'builtin',
    createdAt: 0,
    strokes: [makeStroke(arc(0.5, 0.5, 0.28, 0.40, -90, 270, 24))],
  },
  {
    id: 'builtin_0_left',
    digit: 0,
    source: 'builtin',
    createdAt: 0,
    strokes: [makeStroke(arc(0.5, 0.5, 0.26, 0.40, 180, -180, 24))],
  },

  // 1: German flag-1, simple vertical, slanted, and base-serif 1
  {
    id: 'builtin_1_flag',
    digit: 1,
    source: 'builtin',
    createdAt: 0,
    strokes: [makeStroke([...line(0.32, 0.30, 0.55, 0.10, 5), ...line(0.55, 0.10, 0.55, 0.90, 12)])],
  },
  {
    id: 'builtin_1_simple',
    digit: 1,
    source: 'builtin',
    createdAt: 0,
    strokes: [makeStroke(line(0.51, 0.10, 0.49, 0.90, 14))],
  },
  {
    id: 'builtin_1_slanted',
    digit: 1,
    source: 'builtin',
    createdAt: 0,
    strokes: [makeStroke(line(0.56, 0.10, 0.44, 0.90, 14))],
  },
  {
    id: 'builtin_1_base',
    digit: 1,
    source: 'builtin',
    createdAt: 0,
    strokes: [
      makeStroke([...line(0.32, 0.28, 0.52, 0.10, 5), ...line(0.52, 0.10, 0.52, 0.90, 10)]),
      makeStroke(line(0.32, 0.90, 0.72, 0.90, 6)),
    ],
  },

  // 2: Classic arched 2
  {
    id: 'builtin_2_classic',
    digit: 2,
    source: 'builtin',
    createdAt: 0,
    strokes: [
      makeStroke([
        ...arc(0.50, 0.30, 0.24, 0.20, -165, 25, 12),
        ...line(0.72, 0.38, 0.22, 0.88, 10),
        ...line(0.22, 0.88, 0.80, 0.88, 8),
      ]),
    ],
  },
  {
    id: 'builtin_2_wide',
    digit: 2,
    source: 'builtin',
    createdAt: 0,
    strokes: [
      makeStroke([
        ...arc(0.48, 0.26, 0.26, 0.16, -150, 35, 11),
        ...line(0.68, 0.36, 0.22, 0.86, 9),
        ...line(0.22, 0.86, 0.78, 0.84, 8),
      ]),
    ],
  },

  // 3: Double arch 3
  {
    id: 'builtin_3_classic',
    digit: 3,
    source: 'builtin',
    createdAt: 0,
    strokes: [
      makeStroke([
        ...arc(0.46, 0.29, 0.24, 0.19, -145, 95, 12),
        ...arc(0.48, 0.69, 0.26, 0.21, -95, 145, 12),
      ]),
    ],
  },
  {
    id: 'builtin_3_flat_top',
    digit: 3,
    source: 'builtin',
    createdAt: 0,
    strokes: [
      makeStroke([
        ...line(0.24, 0.14, 0.74, 0.14, 6),
        ...line(0.74, 0.14, 0.44, 0.46, 7),
        ...arc(0.48, 0.68, 0.26, 0.22, -90, 145, 12),
      ]),
    ],
  },

  // 4: Open & closed variants (1 and 2 strokes)
  {
    id: 'builtin_4_open_2s',
    digit: 4,
    source: 'builtin',
    createdAt: 0,
    strokes: [
      makeStroke([...line(0.32, 0.12, 0.22, 0.60, 8), ...line(0.22, 0.60, 0.82, 0.60, 8)]),
      makeStroke(line(0.64, 0.14, 0.64, 0.90, 10)),
    ],
  },
  {
    id: 'builtin_4_closed_2s',
    digit: 4,
    source: 'builtin',
    createdAt: 0,
    strokes: [
      makeStroke([...line(0.62, 0.12, 0.20, 0.62, 9), ...line(0.20, 0.62, 0.82, 0.62, 8)]),
      makeStroke(line(0.62, 0.12, 0.62, 0.90, 10)),
    ],
  },
  {
    id: 'builtin_4_open_1s',
    digit: 4,
    source: 'builtin',
    createdAt: 0,
    strokes: [
      makeStroke([
        ...line(0.32, 0.12, 0.22, 0.60, 7),
        ...line(0.22, 0.60, 0.80, 0.60, 7),
        ...line(0.80, 0.60, 0.64, 0.16, 5),
        ...line(0.64, 0.16, 0.64, 0.90, 9),
      ]),
    ],
  },
  {
    id: 'builtin_4_closed_1s',
    digit: 4,
    source: 'builtin',
    createdAt: 0,
    strokes: [
      makeStroke([
        ...line(0.62, 0.12, 0.20, 0.62, 8),
        ...line(0.20, 0.62, 0.80, 0.62, 8),
        ...line(0.62, 0.18, 0.62, 0.90, 9),
      ]),
    ],
  },

  // 5: 2-stroke German school 5 and 1-stroke 5
  {
    id: 'builtin_5_2s',
    digit: 5,
    source: 'builtin',
    createdAt: 0,
    strokes: [
      makeStroke([...line(0.32, 0.12, 0.28, 0.46, 6), ...arc(0.48, 0.66, 0.26, 0.23, -120, 145, 14)]),
      makeStroke(line(0.32, 0.12, 0.78, 0.12, 7)),
    ],
  },
  {
    id: 'builtin_5_1s',
    digit: 5,
    source: 'builtin',
    createdAt: 0,
    strokes: [
      makeStroke([
        ...line(0.78, 0.12, 0.30, 0.12, 7),
        ...line(0.30, 0.12, 0.28, 0.46, 6),
        ...arc(0.48, 0.66, 0.26, 0.23, -120, 145, 14),
      ]),
    ],
  },

  // 6: Classic top-down loop
  {
    id: 'builtin_6_classic',
    digit: 6,
    source: 'builtin',
    createdAt: 0,
    strokes: [
      makeStroke([
        ...arc(0.64, 0.48, 0.38, 0.38, -75, -190, 10),
        ...arc(0.50, 0.68, 0.24, 0.21, 175, -170, 16),
      ]),
    ],
  },
  {
    id: 'builtin_6_straight',
    digit: 6,
    source: 'builtin',
    createdAt: 0,
    strokes: [
      makeStroke([
        ...line(0.62, 0.10, 0.26, 0.64, 9),
        ...arc(0.50, 0.68, 0.24, 0.21, 180, -170, 16),
      ]),
    ],
  },

  // 7: With crossbar and without crossbar
  {
    id: 'builtin_7_crossbar',
    digit: 7,
    source: 'builtin',
    createdAt: 0,
    strokes: [
      makeStroke([...line(0.22, 0.14, 0.78, 0.14, 7), ...line(0.78, 0.14, 0.36, 0.90, 12)]),
      makeStroke(line(0.34, 0.52, 0.70, 0.52, 6)),
    ],
  },
  {
    id: 'builtin_7_simple',
    digit: 7,
    source: 'builtin',
    createdAt: 0,
    strokes: [
      makeStroke([...line(0.22, 0.14, 0.78, 0.14, 7), ...line(0.78, 0.14, 0.36, 0.90, 12)]),
    ],
  },
  {
    id: 'builtin_7_serif_crossbar',
    digit: 7,
    source: 'builtin',
    createdAt: 0,
    strokes: [
      makeStroke([
        ...line(0.22, 0.24, 0.22, 0.12, 3),
        ...line(0.22, 0.12, 0.78, 0.12, 7),
        ...line(0.78, 0.12, 0.36, 0.90, 12),
      ]),
      makeStroke(line(0.34, 0.52, 0.70, 0.52, 6)),
    ],
  },

  // 8: Smooth figure-8 in both directions, starting at top or middle, plus 2 stacked circles (CW & CCW)
  {
    id: 'builtin_8_fig_right',
    digit: 8,
    source: 'builtin',
    createdAt: 0,
    strokes: [makeStroke(figureEight(1, 0, 32))],
  },
  {
    id: 'builtin_8_fig_left',
    digit: 8,
    source: 'builtin',
    createdAt: 0,
    strokes: [makeStroke(figureEight(-1, 0, 32))],
  },
  {
    id: 'builtin_8_fig_mid',
    digit: 8,
    source: 'builtin',
    createdAt: 0,
    strokes: [makeStroke(figureEight(-1, Math.PI / 2, 32))],
  },
  {
    id: 'builtin_8_2circles_ccw',
    digit: 8,
    source: 'builtin',
    createdAt: 0,
    strokes: [
      makeStroke(arc(0.50, 0.29, 0.21, 0.19, -90, -450, 16)),
      makeStroke(arc(0.50, 0.69, 0.24, 0.21, -90, -450, 16)),
    ],
  },
  {
    id: 'builtin_8_2circles_cw',
    digit: 8,
    source: 'builtin',
    createdAt: 0,
    strokes: [
      makeStroke(arc(0.50, 0.29, 0.21, 0.19, -90, 270, 16)),
      makeStroke(arc(0.50, 0.69, 0.24, 0.21, -90, 270, 16)),
    ],
  },

  // 9: CCW & CW top loop, straight & curved stems, 1-stroke & 2-stroke, small & medium loops
  {
    id: 'builtin_9_ccw_straight',
    digit: 9,
    source: 'builtin',
    createdAt: 0,
    strokes: [
      makeStroke([
        ...arc(0.48, 0.30, 0.23, 0.19, 0, -355, 18),
        ...line(0.71, 0.30, 0.65, 0.90, 12),
      ]),
    ],
  },
  {
    id: 'builtin_9_top_ccw_straight',
    digit: 9,
    source: 'builtin',
    createdAt: 0,
    strokes: [
      makeStroke([
        ...arc(0.48, 0.30, 0.23, 0.19, -90, -450, 18),
        ...line(0.71, 0.28, 0.66, 0.90, 12),
      ]),
    ],
  },
  {
    id: 'builtin_9_cw_straight',
    digit: 9,
    source: 'builtin',
    createdAt: 0,
    strokes: [
      makeStroke([
        ...arc(0.48, 0.30, 0.23, 0.19, -90, 270, 18),
        ...arc(0.48, 0.30, 0.23, 0.19, -90, 0, 5),
        ...line(0.71, 0.30, 0.65, 0.90, 12),
      ]),
    ],
  },
  {
    id: 'builtin_9_curved',
    digit: 9,
    source: 'builtin',
    createdAt: 0,
    strokes: [
      makeStroke([
        ...arc(0.50, 0.29, 0.23, 0.18, 0, -355, 16),
        ...line(0.73, 0.29, 0.66, 0.72, 8),
        ...arc(0.48, 0.72, 0.20, 0.18, 0, 150, 8),
      ]),
    ],
  },
  {
    id: 'builtin_9_small_loop',
    digit: 9,
    source: 'builtin',
    createdAt: 0,
    strokes: [
      makeStroke([
        ...arc(0.47, 0.25, 0.20, 0.14, 0, -355, 16),
        ...line(0.67, 0.25, 0.62, 0.90, 12),
      ]),
    ],
  },
  {
    id: 'builtin_9_2s_ccw',
    digit: 9,
    source: 'builtin',
    createdAt: 0,
    strokes: [
      makeStroke(arc(0.48, 0.30, 0.23, 0.19, -90, -450, 16)),
      makeStroke(line(0.71, 0.24, 0.65, 0.90, 12)),
    ],
  },
  {
    id: 'builtin_9_2s_cw',
    digit: 9,
    source: 'builtin',
    createdAt: 0,
    strokes: [
      makeStroke(arc(0.48, 0.30, 0.23, 0.19, -90, 270, 16)),
      makeStroke(line(0.71, 0.24, 0.65, 0.90, 12)),
    ],
  },
];

export const DIGIT_SVG_GUIDES: Record<number, { paths: string[]; startDot: [number, number] }> = {
  0: { paths: ['M 50 14 C 24 14 22 86 50 86 C 78 86 76 14 50 14'], startDot: [50, 14] },
  1: { paths: ['M 30 34 L 54 14 L 54 86'], startDot: [30, 34] },
  2: { paths: ['M 26 30 C 28 12 72 12 72 32 C 72 52 24 86 24 86 L 78 86'], startDot: [26, 30] },
  3: { paths: ['M 28 24 C 44 10 72 16 70 34 C 68 46 46 48 44 48 C 68 48 76 62 72 74 C 68 88 34 88 26 78'], startDot: [28, 24] },
  4: { paths: ['M 34 14 L 22 60 L 80 60', 'M 64 16 L 64 86'], startDot: [34, 14] },
  5: { paths: ['M 34 14 L 30 46 C 50 38 76 48 74 68 C 72 86 40 88 26 78', 'M 34 14 L 76 14'], startDot: [34, 14] },
  6: { paths: ['M 64 14 C 32 18 24 52 26 70 C 28 88 74 88 74 66 C 74 48 34 48 26 64'], startDot: [64, 14] },
  7: { paths: ['M 22 16 L 76 16 L 36 86', 'M 32 52 L 68 52'], startDot: [22, 16] },
  8: { paths: ['M 50 14 C 26 14 28 46 50 48 C 72 50 76 86 50 86 C 24 86 26 50 50 48 C 72 46 72 14 50 14'], startDot: [50, 14] },
  9: { paths: ['M 70 32 C 70 12 28 12 28 32 C 28 50 70 50 70 32 L 64 86'], startDot: [70, 32] },
};

export function mirrorStrokePoints(strokes: Stroke[]): Stroke[] {
  return strokes.map((s) => s.map((pt): StrokePoint => ({ x: 1 - pt.x, y: pt.y, t: pt.t })));
}
