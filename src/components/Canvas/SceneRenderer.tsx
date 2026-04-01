"use client";

import { useRef, useEffect, useCallback } from "react";
import { Transformer, Group, Rect as KonvaRect, Circle as KonvaCircle } from "react-konva";
import type { AssetInstance } from "@/types/sceneGraph";
import type { ComputedAssetState } from "@/engine/AnimationEngine";
import { assetRegistry } from "@/assets/registry";
import { BlinkGroup } from "./BlinkWrapper";
import type Konva from "konva";

interface SceneRendererProps {
  assets: AssetInstance[];
  states: Map<string, ComputedAssetState>;
  editMode?: boolean;
  selectedIds?: Set<string>;
  onSelect?: (id: string | null, additive: boolean) => void;
  onEditChange?: (id: string, changes: Record<string, unknown>) => void;
  onBatchEditChange?: (batch: Array<{ id: string; changes: Record<string, unknown> }>) => void;
  selectionRect?: { x: number; y: number; width: number; height: number } | null;
}

// Min padding around arrow bounding box so Transformer handles are visible
const ARROW_MIN_PADDING = 15;

export function SceneRenderer({
  assets, states, editMode = false, selectedIds, onSelect, onEditChange, onBatchEditChange, selectionRect,
}: SceneRendererProps) {
  const groupRefs = useRef<Map<string, Konva.Group>>(new Map());
  const trRef = useRef<Konva.Transformer>(null);
  const selected = selectedIds ?? new Set<string>();

  // Sync Transformer
  useEffect(() => {
    if (!editMode || !trRef.current) return;
    const nodes: Konva.Node[] = [];
    for (const id of selected) {
      const g = groupRefs.current.get(id);
      if (g) nodes.push(g);
    }
    trRef.current.nodes(nodes);
    trRef.current.getLayer()?.batchDraw();
  });

  const setGroupRef = useCallback((id: string, node: Konva.Group | null) => {
    if (node) groupRefs.current.set(id, node);
    else groupRefs.current.delete(id);
  }, []);

  function getShapeCenter(state: ComputedAssetState, type: string) {
    if (type === "arrow" || type === "line") {
      const pts = state.points ?? [0, 0, 100, 0];
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (let i = 0; i < pts.length; i += 2) {
        minX = Math.min(minX, pts[i]);
        maxX = Math.max(maxX, pts[i]);
        minY = Math.min(minY, pts[i + 1]);
        maxY = Math.max(maxY, pts[i + 1]);
      }
      return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, w: maxX - minX, h: maxY - minY };
    }
    return { cx: state.x ?? 0, cy: state.y ?? 0, w: state.width ?? (state.radius ? state.radius * 2 : 100), h: state.height ?? (state.radius ? state.radius * 2 : 60) };
  }

  function zeroedState(state: ComputedAssetState, type: string): ComputedAssetState {
    if (type === "arrow" || type === "line") {
      const pts = state.points ?? [0, 0, 100, 0];
      const { cx, cy } = getShapeCenter(state, type);
      const localPts = pts.map((v, i) => v - (i % 2 === 0 ? cx : cy));
      return { ...state, x: 0, y: 0, points: localPts };
    }
    // Strip rotation — it's applied at Group level in edit mode
    return { ...state, x: 0, y: 0, rotation: 0 };
  }

  return (
    <>
      {assets.map((asset) => {
        const state = states.get(asset.id);
        if (!state) return null;
        if (!state.visible && (state.opacity === undefined || state.opacity <= 0)) return null;

        const def = assetRegistry.get(asset.type);
        if (!def) return null;
        const Component = def.component;
        const isBlink = !!state.blink;

        if (!editMode) {
          if (isBlink) return <BlinkGroup key={asset.id} blink speed={state.blinkSpeed ?? 2}><Component state={state} /></BlinkGroup>;
          return <Component key={asset.id} state={state} />;
        }

        const { cx, cy, w, h } = getShapeCenter(state, asset.type);
        const localState = zeroedState(state, asset.type);
        const isArrow = asset.type === "arrow" || asset.type === "line";
        const isSelected = selected.has(asset.id);

        return (
          <Group
            key={asset.id}
            ref={(node: Konva.Group | null) => setGroupRef(asset.id, node)}
            x={cx}
            y={cy}
            rotation={(!isArrow && state.rotation) ? state.rotation : 0}
            draggable
            onClick={(e) => { e.cancelBubble = true; onSelect?.(asset.id, e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey); }}
            onTap={(e) => { e.cancelBubble = true; onSelect?.(asset.id, false); }}
            onDblClick={(e) => {
              e.cancelBubble = true;
              if (state.text !== undefined) {
                // Use setTimeout to escape Konva's event context so prompt() works
                setTimeout(() => {
                  const newText = prompt("Edit text:", state.text ?? "");
                  if (newText !== null) {
                    onEditChange?.(asset.id, { text: newText });
                  }
                }, 0);
              }
            }}
            onDblTap={(e) => {
              e.cancelBubble = true;
              if (state.text !== undefined) {
                setTimeout(() => {
                  const newText = prompt("Edit text:", state.text ?? "");
                  if (newText !== null) {
                    onEditChange?.(asset.id, { text: newText });
                  }
                }, 0);
              }
            }}
            onDragEnd={(e) => {
              const group = e.target;
              const newCx = group.x();
              const newCy = group.y();
              // Skip if transform happened (scaleX/scaleY changed or rotation changed)
              if (Math.abs(group.scaleX() - 1) > 0.001 || Math.abs(group.scaleY() - 1) > 0.001 || Math.abs(group.rotation()) > 0.01) return;

              if (selected.size > 1 && selected.has(asset.id)) {
                const dx = newCx - cx, dy = newCy - cy;
                const batch: Array<{ id: string; changes: Record<string, unknown> }> = [];
                for (const sibId of selected) {
                  const sibState = states.get(sibId);
                  const sibAsset = assets.find((a) => a.id === sibId);
                  if (!sibState || !sibAsset) continue;
                  const sibIsArrow = sibAsset.type === "arrow" || sibAsset.type === "line";
                  if (sibIsArrow && sibState.points) {
                    batch.push({ id: sibId, changes: { points: sibState.points.map((v, i) => Math.round(v + (i % 2 === 0 ? dx : dy))) } });
                  } else {
                    batch.push({ id: sibId, changes: { x: Math.round((sibState.x ?? 0) + dx), y: Math.round((sibState.y ?? 0) + dy) } });
                  }
                }
                onBatchEditChange?.(batch);
              } else if (isArrow && state.points) {
                const dx = newCx - cx, dy = newCy - cy;
                onEditChange?.(asset.id, { points: state.points.map((v, i) => Math.round(v + (i % 2 === 0 ? dx : dy))) });
              } else {
                onEditChange?.(asset.id, { x: Math.round(newCx), y: Math.round(newCy) });
              }
            }}
            onTransformEnd={() => {
              const group = groupRefs.current.get(asset.id);
              if (!group) return;

              const sx = group.scaleX();
              const sy = group.scaleY();
              const rot = group.rotation();
              const rad = rot * Math.PI / 180;

              // The Transformer moves group.x/y when scaling from edges.
              // For resize: the position shift is intentional (keeps anchor edge fixed).
              // For rotation: position should NOT change — only the shape rotates.
              //
              // Strategy: compute the center of the transformed bounding box.
              // The Group's visual center after transform = group position +
              // the group's local center (0,0) transformed by the group's matrix.
              // Since our shapes are centered at (0,0) in the group, the visual
              // center is simply the group's absolute position.
              //
              // But Konva's Transformer shifts group.x/y to keep anchors fixed.
              // So group.x() IS the new visual center for resize operations.
              // For rotation-only, group.x/y also shifts but shouldn't.
              //
              // Fix: use the transform matrix to find the actual center.
              // Determine if this is scale-only, rotation-only, or both
              const isScaled = Math.abs(sx - 1) > 0.001 || Math.abs(sy - 1) > 0.001;
              const isRotated = Math.abs(rot) > 0.1;

              // For scale operations, Konva shifts group.x/y to keep anchor edge fixed.
              // For rotation, we want center to stay put.
              // Strategy: use group.x/y for the position delta from scaling,
              // but for pure rotation keep the original center.
              const gx = group.x();
              const gy = group.y();

              // Reset group transform
              group.scaleX(1);
              group.scaleY(1);
              group.rotation(0);
              group.position({ x: cx, y: cy });

              if (isArrow && state.points) {
                const pts = state.points;
                const newPts: number[] = [];
                // For rotation-only: keep original center. For scale: use Konva's adjusted center.
                const targetCx = isScaled ? gx : cx;
                const targetCy = isScaled ? gy : cy;
                for (let i = 0; i < pts.length; i += 2) {
                  let lx = (pts[i] - cx) * sx;
                  let ly = (pts[i + 1] - cy) * sy;
                  if (isRotated) {
                    const rx = lx, ry = ly;
                    lx = rx * Math.cos(rad) - ry * Math.sin(rad);
                    ly = rx * Math.sin(rad) + ry * Math.cos(rad);
                  }
                  newPts.push(Math.round(targetCx + lx), Math.round(targetCy + ly));
                }
                onEditChange?.(asset.id, { points: newPts });
              } else {
                const changes: Record<string, unknown> = {};
                if (state.width !== undefined) changes.width = Math.round(Math.abs(state.width * sx));
                if (state.height !== undefined) changes.height = Math.round(Math.abs(state.height * sy));
                if (state.radius !== undefined) changes.radius = Math.round(Math.abs(state.radius * Math.max(Math.abs(sx), Math.abs(sy))));
                if (state.fontSize !== undefined && isScaled) {
                  changes.fontSize = Math.round(Math.abs(state.fontSize * Math.max(Math.abs(sx), Math.abs(sy))));
                }
                if (isRotated) {
                  changes.rotation = Math.round(((state.rotation ?? 0) + rot) * 10) / 10;
                }
                // For scale: use Konva's adjusted position. For rotation-only: keep original.
                changes.x = Math.round(isScaled ? gx : cx);
                changes.y = Math.round(isScaled ? gy : cy);
                onEditChange?.(asset.id, changes);
              }
            }}
          >
            {/* The actual shape */}
            {isBlink ? (
              <BlinkGroup blink speed={state.blinkSpeed ?? 2}><Component state={localState} /></BlinkGroup>
            ) : (
              <Component state={localState} />
            )}

            {/* For arrows/lines: invisible wider hit area so they're easy to click */}
            {isArrow && localState.points && localState.points.length >= 4 && (
              <KonvaRect
                x={-w / 2 - ARROW_MIN_PADDING}
                y={-Math.max(h, 30) / 2 - ARROW_MIN_PADDING}
                width={w + ARROW_MIN_PADDING * 2}
                height={Math.max(h, 30) + ARROW_MIN_PADDING * 2}
                fill="transparent"
                listening={true}
              />
            )}

            {/* Grab handle — visible move indicator at center */}
            <KonvaCircle
              x={0}
              y={0}
              radius={isSelected ? 6 : 4}
              fill={isSelected ? "#3b82f6" : "rgba(255,255,255,0.3)"}
              stroke={isSelected ? "#93c5fd" : "rgba(255,255,255,0.15)"}
              strokeWidth={1}
              listening={false}
            />
          </Group>
        );
      })}

      {/* Rubber band */}
      {editMode && selectionRect && (
        <KonvaRect
          x={selectionRect.x} y={selectionRect.y}
          width={selectionRect.width} height={selectionRect.height}
          fill="rgba(59,130,246,0.08)" stroke="#3b82f6" strokeWidth={1} dash={[6, 3]} listening={false}
        />
      )}

      {/* Transformer */}
      {editMode && (
        <Transformer
          ref={trRef}
          rotateEnabled
          rotateAnchorOffset={25}
          rotateAnchorCursor="grab"
          borderStroke="#3b82f6"
          borderStrokeWidth={1.5}
          anchorStroke="#3b82f6"
          anchorFill="#1d4ed8"
          anchorSize={12}
          anchorCornerRadius={3}
          keepRatio={false}
          padding={isArrowSelected() ? ARROW_MIN_PADDING : 0}
          enabledAnchors={[
            "top-left", "top-right", "bottom-left", "bottom-right",
            "middle-left", "middle-right", "top-center", "bottom-center",
          ]}
          boundBoxFunc={(_old, newBox) => {
            if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) return _old;
            return newBox;
          }}
        />
      )}
    </>
  );

  function isArrowSelected(): boolean {
    if (selected.size !== 1) return false;
    const id = [...selected][0];
    const asset = assets.find((a) => a.id === id);
    return asset?.type === "arrow" || asset?.type === "line" || false;
  }
}
