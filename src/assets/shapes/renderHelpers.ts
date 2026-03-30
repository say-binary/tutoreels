import type { ComputedAssetState } from "@/engine/AnimationEngine";

/**
 * Extract Konva shadow props from state.
 * Applies smart defaults: subtle shadow when shape has a fill but no explicit shadow.
 */
export function getShadowProps(state: ComputedAssetState, applyDefaults = true) {
  const hasShadow = state.shadowBlur !== undefined || state.shadowColor !== undefined;

  if (hasShadow) {
    return {
      shadowColor: state.shadowColor ?? "#000000",
      shadowBlur: state.shadowBlur ?? 10,
      shadowOffsetX: state.shadowOffsetX ?? 2,
      shadowOffsetY: state.shadowOffsetY ?? 2,
      shadowOpacity: state.shadowOpacity ?? 0.3,
      shadowEnabled: true,
    };
  }

  // Smart defaults: add subtle shadow for filled shapes
  if (applyDefaults && state.fill) {
    return {
      shadowColor: "#000000",
      shadowBlur: 8,
      shadowOffsetX: 2,
      shadowOffsetY: 3,
      shadowOpacity: 0.2,
      shadowEnabled: true,
    };
  }

  return { shadowEnabled: false };
}

/**
 * Convert compact gradient spec into Konva linear gradient props.
 * Returns undefined if no gradient is specified (caller should use fill instead).
 */
/**
 * Convert compact gradient spec into Konva linear gradient props.
 * @param centered - true for shapes where (0,0) is the center (Circle, Ellipse, Star, Polygon).
 *                   false for shapes where (0,0) is top-left (Rect, RoundedRect).
 */
export function getGradientProps(
  state: ComputedAssetState,
  width: number,
  height: number,
  centered = false
) {
  if (!state.gradient) return undefined;

  const { startColor, endColor, angle = 0 } = state.gradient;
  const rad = (angle * Math.PI) / 180;

  const len = Math.max(width, height);
  const dx = Math.cos(rad) * len;
  const dy = Math.sin(rad) * len;

  // For centered shapes (Circle, Ellipse, etc.), origin is at center (0,0)
  // For rect shapes, origin is top-left, so offset to center
  const cx = centered ? 0 : width / 2;
  const cy = centered ? 0 : height / 2;

  return {
    fillLinearGradientStartPoint: { x: cx - dx / 2, y: cy - dy / 2 },
    fillLinearGradientEndPoint: { x: cx + dx / 2, y: cy + dy / 2 },
    fillLinearGradientColorStops: [0, startColor, 1, endColor],
    fill: undefined as string | undefined,
  };
}

/**
 * Get fill or gradient props for a shape.
 * Returns gradient props if gradient is set, otherwise returns fill.
 */
export function getFillProps(
  state: ComputedAssetState,
  width: number,
  height: number,
  defaultFill = "#4A90D9",
  centered = false
) {
  const gradientProps = getGradientProps(state, width, height, centered);
  if (gradientProps) {
    return gradientProps;
  }
  return { fill: state.fill ?? defaultFill };
}

/**
 * Get common shape props shared by most shapes.
 */
export function getCommonProps(state: ComputedAssetState) {
  return {
    opacity: state.opacity ?? 1,
    rotation: state.rotation,
    scaleX: state.scaleX,
    scaleY: state.scaleY,
    dash: state.dash,
  };
}
