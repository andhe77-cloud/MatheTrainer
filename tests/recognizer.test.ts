import assert from 'node:assert/strict';
import test from 'node:test';
import { recognizeDigit } from '../src/input/recognizer';
import { runSyntheticBenchmark } from '../src/input/syntheticBenchmark';

test('synthetic handwriting benchmark meets Spec 5.4 thresholds', () => {
  const metrics = runSyntheticBenchmark([]);
  console.log('Benchmark metrics:', JSON.stringify(metrics, null, 2));

  assert.ok(
    metrics.autoAcceptAccuracyPct >= 95,
    `Expected autoAcceptAccuracyPct >= 95%, got ${metrics.autoAcceptAccuracyPct.toFixed(2)}%`
  );
  assert.ok(
    metrics.clarificationRatePct <= 15,
    `Expected clarificationRatePct <= 15%, got ${metrics.clarificationRatePct.toFixed(2)}%`
  );
  assert.ok(
    metrics.falseAcceptRatePct <= 1,
    `Expected falseAcceptRatePct <= 1%, got ${metrics.falseAcceptRatePct.toFixed(2)}%`
  );
  assert.ok(
    metrics.avgDurationMs < 50,
    `Expected avgDurationMs < 50ms, got ${metrics.avgDurationMs.toFixed(2)}ms`
  );
  assert.ok(
    metrics.mirroredDetectedCount >= 4,
    `Expected >= 4 mirrored digits detected, got ${metrics.mirroredDetectedCount}/${metrics.mirroredTestedCount}`
  );
  assert.equal(metrics.scribblesRejectedCount, metrics.scribblesTestedCount);
});

test('ambiguous 1/7 triggers clarify or recognizes cleanly without silent misread', () => {
  // Borderline 1/7 stroke: wide top flag
  const borderline = [
    [
      { x: 25, y: 20, t: 0 },
      { x: 65, y: 18, t: 20 },
      { x: 45, y: 140, t: 60 },
    ],
  ];
  const res = recognizeDigit(borderline);
  assert.ok(res.status === 'clarify' || res.digit === 1 || res.digit === 7);
  if (res.status === 'clarify') {
    assert.ok(res.clarifyPair?.includes(1) && res.clarifyPair?.includes(7));
  }
});

test('recognizes diverse 8 and 9 handwriting styles cleanly', () => {
  const scalePts = (pts: Array<[number, number]>) =>
    pts.map(([x, y], i) => ({ x: x * 130, y: y * 164, t: i * 15 }));

  // 8 drawn top-center -> top-left -> bottom-right -> bottom-left -> top-right -> top-center
  const eightCCW = [
    scalePts([
      [0.5, 0.12], [0.3, 0.22], [0.32, 0.38], [0.5, 0.5], [0.7, 0.65],
      [0.72, 0.82], [0.5, 0.88], [0.28, 0.82], [0.3, 0.65], [0.5, 0.5],
      [0.68, 0.38], [0.7, 0.22], [0.52, 0.13],
    ]),
  ];
  const r8a = recognizeDigit(eightCCW);
  assert.equal(r8a.digit, 8, `Expected 8 (CCW), got ${r8a.digit} (${r8a.status})`);

  // 8 drawn as two separate circles (CW)
  const eightTwoCircles = [
    scalePts([[0.5, 0.12], [0.7, 0.24], [0.68, 0.40], [0.5, 0.46], [0.32, 0.40], [0.32, 0.24], [0.5, 0.13]]),
    scalePts([[0.5, 0.48], [0.74, 0.62], [0.72, 0.82], [0.5, 0.88], [0.28, 0.82], [0.28, 0.62], [0.5, 0.49]]),
  ];
  const r8b = recognizeDigit(eightTwoCircles);
  assert.equal(r8b.digit, 8, `Expected 8 (2 circles), got ${r8b.digit} (${r8b.status})`);

  // 9 drawn clockwise top loop + straight stem
  const nineCW = [
    scalePts([
      [0.5, 0.12], [0.7, 0.22], [0.68, 0.40], [0.48, 0.46], [0.28, 0.38],
      [0.3, 0.20], [0.52, 0.13], [0.72, 0.26], [0.7, 0.58], [0.68, 0.88],
    ]),
  ];
  const r9a = recognizeDigit(nineCW);
  assert.equal(r9a.digit, 9, `Expected 9 (CW), got ${r9a.digit} (${r9a.status})`);

  // 9 drawn counter-clockwise from right side + curved bottom hook
  const nineCCW = [
    scalePts([
      [0.7, 0.30], [0.55, 0.14], [0.32, 0.18], [0.28, 0.36], [0.48, 0.48],
      [0.7, 0.34], [0.7, 0.65], [0.62, 0.84], [0.40, 0.88],
    ]),
  ];
  const r9b = recognizeDigit(nineCCW);
  assert.equal(r9b.digit, 9, `Expected 9 (CCW curved), got ${r9b.digit} (${r9b.status})`);
});
