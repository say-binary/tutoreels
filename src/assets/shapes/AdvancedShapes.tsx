"use client";

import { Star, RegularPolygon, Line } from "react-konva";
import type { ComputedAssetState } from "@/engine/AnimationEngine";
import { getShadowProps, getFillProps, getCommonProps } from "./renderHelpers";

interface ShapeProps {
  state: ComputedAssetState;
}

export function StarShape({ state }: ShapeProps) {
  const outerRadius = state.radius ?? 30;
  const innerR = state.innerRadius ?? outerRadius * 0.45;
  const numPts = state.numPoints ?? 5;
  return (
    <Star
      x={state.x}
      y={state.y}
      numPoints={numPts}
      innerRadius={innerR}
      outerRadius={outerRadius}
      {...getFillProps(state, outerRadius * 2, outerRadius * 2, "#E6A817", true)}
      stroke={state.stroke}
      strokeWidth={state.strokeWidth}
      {...getCommonProps(state)}
      {...getShadowProps(state)}
    />
  );
}

export function PolygonShape({ state }: ShapeProps) {
  const r = state.radius ?? 35;
  const sides = state.numPoints ?? 6;
  return (
    <RegularPolygon
      x={state.x}
      y={state.y}
      sides={sides}
      radius={r}
      {...getFillProps(state, r * 2, r * 2, "#9B59B6", true)}
      stroke={state.stroke}
      strokeWidth={state.strokeWidth}
      {...getCommonProps(state)}
      {...getShadowProps(state)}
    />
  );
}

export function DiamondShape({ state }: ShapeProps) {
  const w = state.width ?? 60;
  const h = state.height ?? 60;
  // Draw a diamond as a closed polygon: top, right, bottom, left
  const points = [0, -h / 2, w / 2, 0, 0, h / 2, -w / 2, 0];
  return (
    <Line
      x={state.x}
      y={state.y}
      points={points}
      closed
      {...getFillProps(state, w, h, "#E74C3C")}
      stroke={state.stroke}
      strokeWidth={state.strokeWidth}
      {...getCommonProps(state)}
      {...getShadowProps(state)}
    />
  );
}
