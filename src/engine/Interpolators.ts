import type { EasingType } from "@/types/sceneGraph";

type EasingFn = (t: number) => number;

const easings: Record<EasingType, EasingFn> = {
  linear: (t) => t,
  easeIn: (t) => t * t * t,
  easeOut: (t) => 1 - Math.pow(1 - t, 3),
  easeInOut: (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  backOut: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  bounceOut: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
  elastic: (t) => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
  },
};

export function getEasing(type: EasingType = "easeInOut"): EasingFn {
  return easings[type] ?? easings.easeInOut;
}

export function interpolateNumber(
  from: number,
  to: number,
  progress: number
): number {
  return from + (to - from) * progress;
}

export function interpolateColor(
  from: string,
  to: string,
  progress: number
): string {
  const f = parseColor(from);
  const t = parseColor(to);
  if (!f || !t) return progress < 0.5 ? from : to;
  const r = Math.round(interpolateNumber(f.r, t.r, progress));
  const g = Math.round(interpolateNumber(f.g, t.g, progress));
  const b = Math.round(interpolateNumber(f.b, t.b, progress));
  return `rgb(${r},${g},${b})`;
}

function parseColor(color: string): { r: number; g: number; b: number } | null {
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const full = hex.length === 3
      ? hex.split("").map((c) => c + c).join("")
      : hex;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
    };
  }
  const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (match) {
    return { r: +match[1], g: +match[2], b: +match[3] };
  }
  return null;
}
