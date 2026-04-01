"use client";

import { Arrow } from "react-konva";
import type { ComputedAssetState } from "@/engine/AnimationEngine";
import { getShadowProps } from "./renderHelpers";

interface ShapeProps {
  state: ComputedAssetState;
}

export function ArrowShape({ state }: ShapeProps) {
  const points = state.points ?? [0, 0, 100, 0];
  return (
    <Arrow
      x={state.x}
      y={state.y}
      points={points}
      stroke={state.stroke ?? "#666666"}
      fill={state.stroke ?? "#666666"}
      strokeWidth={state.strokeWidth ?? 2}
      pointerLength={10}
      pointerWidth={10}
      hitStrokeWidth={20}
      opacity={state.opacity ?? 1}
      dash={state.dash}
      {...getShadowProps(state, false)}
    />
  );
}
