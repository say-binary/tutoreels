"use client";

import { Group, Rect, Text } from "react-konva";
import type { ComputedAssetState } from "@/engine/AnimationEngine";
import { getShadowProps, getCommonProps } from "./renderHelpers";

interface ShapeProps {
  state: ComputedAssetState;
}

/**
 * Container: (x,y) = CENTER of the container. Offset by -w/2, -h/2.
 */
export function ContainerShape({ state }: ShapeProps) {
  const w = state.width ?? 200;
  const h = state.height ?? 150;
  return (
    <Group x={state.x - w / 2} y={state.y - h / 2} {...getCommonProps(state)}>
      <Rect
        width={w}
        height={h}
        fill={state.fill ?? "rgba(74, 144, 217, 0.08)"}
        stroke={state.stroke ?? "#4A90D9"}
        strokeWidth={state.strokeWidth ?? 2}
        cornerRadius={state.cornerRadius ?? 8}
        dash={state.dash ?? [8, 4]}
        {...getShadowProps(state, false)}
      />
      {state.text && (
        <Text
          x={8}
          y={-20}
          text={state.text}
          fontSize={state.fontSize ?? 12}
          fontFamily="Inter, system-ui, sans-serif"
          fill={state.stroke ?? "#4A90D9"}
          fontStyle="bold"
        />
      )}
    </Group>
  );
}
