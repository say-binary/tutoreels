"use client";

import { Text, Group, Rect } from "react-konva";
import type { ComputedAssetState } from "@/engine/AnimationEngine";
import { getShadowProps, getFillProps, getCommonProps } from "./renderHelpers";

interface ShapeProps {
  state: ComputedAssetState;
}

/**
 * Text: (x,y) = top-left of text (kept as-is since text has no "center" concept the LLM can guess).
 * TextBox: (x,y) = CENTER of the box. Offset by -w/2, -h/2.
 */

export function TextShape({ state }: ShapeProps) {
  return (
    <Text
      x={state.x}
      y={state.y}
      text={state.text ?? ""}
      fontSize={state.fontSize ?? 16}
      fontStyle={state.fontStyle}
      fontFamily="Inter, system-ui, sans-serif"
      fill={state.fill ?? "#FFFFFF"}
      opacity={state.opacity ?? 1}
      width={state.width}
      {...getShadowProps(state, false)}
    />
  );
}

export function TextBoxShape({ state }: ShapeProps) {
  const padding = 12;
  const w = state.width ?? 120;
  const h = state.height ?? 40;
  // Center-based: offset so (x,y) in scene graph = visual center
  return (
    <Group x={state.x - w / 2} y={state.y - h / 2} {...getCommonProps(state)}>
      <Rect
        width={w}
        height={h}
        {...getFillProps(state, w, h, "#2C3E50")}
        stroke={state.stroke ?? "#4A90D9"}
        strokeWidth={state.strokeWidth ?? 1}
        cornerRadius={state.cornerRadius ?? 6}
        dash={state.dash}
        {...getShadowProps(state)}
      />
      <Text
        x={padding}
        y={padding}
        width={w - padding * 2}
        height={h - padding * 2}
        text={state.text ?? ""}
        fontSize={state.fontSize ?? 14}
        fontFamily="Inter, system-ui, sans-serif"
        fill={state.stroke ?? "#FFFFFF"}
        align="center"
        verticalAlign="middle"
      />
    </Group>
  );
}
