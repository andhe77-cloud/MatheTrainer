import React, { useCallback, useEffect, useRef } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { STRINGS_DE } from '../content/strings.de';
import type { Stroke, StrokePoint } from '../core/types';

export type PlaceRole = 'hundreds' | 'tens' | 'ones' | 'neutral';

interface DigitCanvasProps {
  role: PlaceRole;
  strokes: Stroke[];
  onStrokesChange: (strokes: Stroke[]) => void;
  onFirstStrokeTime?: () => void;
  guideDigit?: number | null;
  disabled?: boolean;
  width?: number;
  height?: number;
  leftHanded?: boolean;
  label?: string;
}

const ROLE_STYLES: Record<
  PlaceRole,
  { border: string; headerBg: string; headerText: string; ink: string; badgeText: string }
> = {
  hundreds: {
    border: 'border-emerald-600',
    headerBg: 'bg-emerald-600',
    headerText: 'text-white',
    ink: '#065F46',
    badgeText: STRINGS_DE.input.hundredsLabel,
  },
  tens: {
    border: 'border-blue-600',
    headerBg: 'bg-blue-600',
    headerText: 'text-white',
    ink: '#1E3A8A',
    badgeText: STRINGS_DE.input.tensLabel,
  },
  ones: {
    border: 'border-rose-600',
    headerBg: 'bg-rose-600',
    headerText: 'text-white',
    ink: '#881337',
    badgeText: STRINGS_DE.input.onesLabel,
  },
  neutral: {
    border: 'border-slate-400',
    headerBg: 'bg-slate-700',
    headerText: 'text-white',
    ink: '#0F172A',
    badgeText: 'Ziffer',
  },
};

export function renderStrokesToDataUrl(strokes: Stroke[], width = 120, height = 150, ink = '#1E293B'): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const stroke of strokes) {
    if (stroke.length === 0) continue;
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length; i++) {
      const prev = stroke[i - 1];
      const curr = stroke[i];
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
    }
    const last = stroke[stroke.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  }
  return canvas.toDataURL('image/png');
}

export const DigitCanvas: React.FC<DigitCanvasProps> = ({
  role,
  strokes,
  onStrokesChange,
  onFirstStrokeTime,
  disabled = false,
  width = 132,
  height = 164,
  leftHanded = false,
  label,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const lastPenTimeRef = useRef<number>(0);
  const currentStrokeRef = useRef<Stroke>([]);
  const strokesRef = useRef<Stroke[]>(strokes);
  strokesRef.current = strokes;

  const style = ROLE_STYLES[role];

  const drawCanvas = useCallback(
    (allStrokes: Stroke[], liveStroke: Stroke | null) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Subtle paper background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // School writing guide lines: midline & baseline
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(10, height * 0.5);
      ctx.lineTo(width - 10, height * 0.5);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(10, height * 0.84);
      ctx.lineTo(width - 10, height * 0.84);
      ctx.stroke();

      // Render strokes with smooth quadratic Bezier interpolation
      const combined = liveStroke && liveStroke.length > 0 ? [...allStrokes, liveStroke] : allStrokes;
      ctx.strokeStyle = style.ink;
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (const stroke of combined) {
        if (stroke.length === 0) continue;
        if (stroke.length === 1) {
          ctx.fillStyle = style.ink;
          ctx.beginPath();
          ctx.arc(stroke[0].x, stroke[0].y, 3.5, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }
        ctx.beginPath();
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let i = 1; i < stroke.length; i++) {
          const prev = stroke[i - 1];
          const curr = stroke[i];
          const midX = (prev.x + curr.x) / 2;
          const midY = (prev.y + curr.y) / 2;
          ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
        }
        const last = stroke[stroke.length - 1];
        ctx.lineTo(last.x, last.y);
        ctx.stroke();
      }

      ctx.restore();
    },
    [height, style.ink, width]
  );

  useEffect(() => {
    drawCanvas(strokes, null);
  }, [strokes, drawCanvas]);

  const getLocalCoords = (e: React.PointerEvent<HTMLCanvasElement>): StrokePoint => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rectW = rect.width || width;
    const rectH = rect.height || height;
    const scaleX = width / rectW;
    const scaleY = height / rectH;
    return {
      x: Math.max(0, Math.min(width, (e.clientX - rect.left) * scaleX)),
      y: Math.max(0, Math.min(height, (e.clientY - rect.top) * scaleY)),
      t: Date.now(),
    };
  };

  const shouldRejectPalm = (e: React.PointerEvent<HTMLCanvasElement>): boolean => {
    if (e.pointerType === 'pen') {
      lastPenTimeRef.current = Date.now();
      return false;
    }
    if (e.pointerType === 'touch') {
      // Ignore touch while stylus was used recently (600ms) or large palm contact area
      if (Date.now() - lastPenTimeRef.current < 600) {
        return true;
      }
      if (e.width > 28 || e.height > 28) {
        return true;
      }
      if (!e.isPrimary) {
        return true;
      }
    }
    return false;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    if (shouldRejectPalm(e)) return;
    if (activePointerIdRef.current !== null) return;

    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore synthetic/unsupported pointer capture errors on mobile browsers
    }
    activePointerIdRef.current = e.pointerId;
    if (strokesRef.current.length === 0 && onFirstStrokeTime) {
      onFirstStrokeTime();
    }
    const pt = getLocalCoords(e);
    currentStrokeRef.current = [pt];
    drawCanvas(strokesRef.current, currentStrokeRef.current);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled || activePointerIdRef.current !== e.pointerId) return;
    if (e.pointerType === 'pen') lastPenTimeRef.current = Date.now();
    e.preventDefault();
    const pt = getLocalCoords(e);
    const curr = currentStrokeRef.current;
    const last = curr[curr.length - 1];
    if (!last || Math.hypot(pt.x - last.x, pt.y - last.y) >= 2.2) {
      curr.push(pt);
      drawCanvas(strokesRef.current, curr);
    }
  };

  const finishStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    activePointerIdRef.current = null;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore release errors when pointer is already gone
    }
    const completed = currentStrokeRef.current;
    currentStrokeRef.current = [];
    if (completed.length > 0) {
      onStrokesChange([...strokesRef.current, completed]);
    }
  };

  const handleUndo = () => {
    if (disabled || strokes.length === 0) return;
    onStrokesChange(strokes.slice(0, -1));
  };

  const handleClear = () => {
    if (disabled || strokes.length === 0) return;
    onStrokesChange([]);
  };

  return (
    <div className="flex flex-col items-center gap-1.5 short:gap-1 select-none">
      {/* Place-value block frame */}
      <div
        className={`rounded-2xl border-2 ${style.border} bg-white shadow-[0_4px_0_rgba(148,163,184,0.45)] overflow-hidden`}
      >
        {/* Color + Shape coded header (never color alone) */}
        <div className={`${style.headerBg} ${style.headerText} px-2.5 py-1 short:py-0.5 flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-bold tracking-wide`}>
          {role === 'tens' && (
            <span className="inline-block w-2 h-3.5 rounded-sm bg-white/95 border border-blue-900/20" aria-hidden="true" />
          )}
          {role === 'ones' && (
            <span className="inline-block w-2.5 h-2.5 rounded-xs bg-white/95 border border-rose-900/20" aria-hidden="true" />
          )}
          {role === 'hundreds' && (
            <span className="inline-block w-3 h-3 rounded-xs bg-white/95 border border-emerald-900/20" aria-hidden="true" />
          )}
          <span>{label ?? style.badgeText}</span>
        </div>

        <canvas
          ref={canvasRef}
          style={{
            width: `${width}px`,
            height: `${height}px`,
            touchAction: 'none',
          }}
          className={`block cursor-crosshair select-none max-w-[104px] max-h-[128px] sm:max-w-none sm:max-h-none short:max-w-[92px] short:max-h-[114px] ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
        />
      </div>

      {/* Tactile Undo & Clear controls */}
      <div className={`flex items-center gap-2 ${leftHanded ? 'flex-row-reverse' : 'flex-row'}`}>
        <button
          type="button"
          onClick={handleUndo}
          disabled={disabled || strokes.length === 0}
          aria-label={STRINGS_DE.input.undo}
          className="min-h-[42px] min-w-[42px] short:min-h-[36px] short:min-w-[36px] px-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:translate-y-0.5 disabled:opacity-40 flex items-center justify-center shadow-[0_2px_0_#CBD5E1] transition-transform"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled || strokes.length === 0}
          aria-label={STRINGS_DE.input.clear}
          className="min-h-[42px] min-w-[42px] short:min-h-[36px] short:min-w-[36px] px-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:translate-y-0.5 disabled:opacity-40 flex items-center justify-center shadow-[0_2px_0_#CBD5E1] transition-transform"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
