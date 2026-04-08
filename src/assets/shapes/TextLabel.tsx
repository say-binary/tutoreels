"use client";

import { Text, Group, Rect } from "react-konva";
import type { ComputedAssetState } from "@/engine/AnimationEngine";
import { getShadowProps, getFillProps, getCommonProps } from "./renderHelpers";

interface ShapeProps {
  state: ComputedAssetState;
}

/**
 * Text: (x,y) = top-left of text.
 * Rotation is applied via a wrapping Group centered on the text so it rotates around center.
 * TextBox: (x,y) = CENTER of the box.
 */

export function TextShape({ state }: ShapeProps) {
  const common = getCommonProps(state);
  // If rotated, we need to rotate around center, not top-left.
  // Estimate text dimensions for centering (rough approximation).
  const approxW = (state.text?.length ?? 5) * (state.fontSize ?? 16) * 0.55;
  const approxH = (state.fontSize ?? 16) * 1.3;

  if (common.rotation) {
    // Wrap in Group at text center, apply rotation there
    return (
      <Group
        x={(state.x ?? 0) + approxW / 2}
        y={(state.y ?? 0) + approxH / 2}
        rotation={common.rotation}
        opacity={common.opacity}
        scaleX={common.scaleX}
        scaleY={common.scaleY}
      >
        <Text
          x={-approxW / 2}
          y={-approxH / 2}
          text={state.text ?? ""}
          fontSize={state.fontSize ?? 16}
          fontStyle={state.fontStyle}
          fontFamily="Inter, system-ui, sans-serif"
          fill={state.fill ?? "#FFFFFF"}
          width={state.width}
          {...getShadowProps(state, false)}
        />
      </Group>
    );
  }

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
  const common = getCommonProps(state);

  // Center-based: (x,y) = visual center
  // If rotated, rotate around center (Group at center, children at -w/2, -h/2)
  if (common.rotation) {
    return (
      <Group
        x={state.x ?? 0}
        y={state.y ?? 0}
        rotation={common.rotation}
        opacity={common.opacity}
        scaleX={common.scaleX}
        scaleY={common.scaleY}
      >
        <Rect
          x={-w / 2}
          y={-h / 2}
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
          x={-w / 2 + padding}
          y={-h / 2 + padding}
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

  // No rotation — use original layout
  return (
    <Group x={(state.x ?? 0) - w / 2} y={(state.y ?? 0) - h / 2} {...common}>
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
