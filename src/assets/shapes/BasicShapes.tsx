"use client";

import { Rect, Circle, Ellipse, Line } from "react-konva";
import type { ComputedAssetState } from "@/engine/AnimationEngine";
import { getShadowProps, getFillProps, getCommonProps } from "./renderHelpers";

interface ShapeProps {
  state: ComputedAssetState;
}

/**
 * All shapes use CENTER-based coordinates from the scene graph.
 * Rect/RoundedRect offset by -width/2, -height/2 so (x,y) = visual center.
 */

export function RectShape({ state }: ShapeProps) {
  const w = state.width ?? 100;
  const h = state.height ?? 60;
  return (
    <Rect
      x={state.x - w / 2}
      y={state.y - h / 2}
      width={w}
      height={h}
      {...getFillProps(state, w, h, "#4A90D9")}
      stroke={state.stroke}
      strokeWidth={state.strokeWidth}
      cornerRadius={state.cornerRadius}
      {...getCommonProps(state)}
      {...getShadowProps(state)}
    />
  );
}

export function RoundedRectShape({ state }: ShapeProps) {
  const w = state.width ?? 100;
  const h = state.height ?? 60;
  return (
    <Rect
      x={state.x - w / 2}
      y={state.y - h / 2}
      width={w}
      height={h}
      {...getFillProps(state, w, h, "#4A90D9")}
      stroke={state.stroke}
      strokeWidth={state.strokeWidth}
      cornerRadius={state.cornerRadius ?? 10}
      {...getCommonProps(state)}
      {...getShadowProps(state)}
    />
  );
}

export function CircleShape({ state }: ShapeProps) {
  const r = state.radius ?? 30;
  return (
    <Circle
      x={state.x}
      y={state.y}
      radius={r}
      {...getFillProps(state, r * 2, r * 2, "#50C878", true)}
      stroke={state.stroke}
      strokeWidth={state.strokeWidth}
      {...getCommonProps(state)}
      {...getShadowProps(state)}
    />
  );
}

export function EllipseShape({ state }: ShapeProps) {
  const rx = state.width ? state.width / 2 : 50;
  const ry = state.height ? state.height / 2 : 30;
  return (
    <Ellipse
      x={state.x}
      y={state.y}
      radiusX={rx}
      radiusY={ry}
      {...getFillProps(state, rx * 2, ry * 2, "#E6A817", true)}
      stroke={state.stroke}
      strokeWidth={state.strokeWidth}
      {...getCommonProps(state)}
      {...getShadowProps(state)}
    />
  );
}

export function LineShape({ state }: ShapeProps) {
  const points = state.points ?? [0, 0, 100, 0];
  return (
    <Line
      x={state.x}
      y={state.y}
      points={points}
      stroke={state.stroke ?? "#666666"}
      strokeWidth={state.strokeWidth ?? 2}
      opacity={state.opacity ?? 1}
      dash={state.dash}
      {...getShadowProps(state, false)}
    />
  );
}
