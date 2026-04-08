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
                // Single shape drag — each shape is independent
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
              const isScaled = Math.abs(sx - 1) > 0.001 || Math.abs(sy - 1) > 0.001;
              const isRotated = Math.abs(rot) > 0.1;
              const gx = group.x();
              const gy = group.y();

              // Reset this group's transform
              group.scaleX(1);
              group.scaleY(1);
              group.rotation(0);
              group.position({ x: cx, y: cy });

              // If multi-selected, apply the same transform to ALL selected siblings
              // Each sibling got its own transform from the Transformer, so we read
              // their individual positions and reset them too.
              if (selected.size > 1 && selected.has(asset.id)) {
                const batch: Array<{ id: string; changes: Record<string, unknown> }> = [];

                for (const sibId of selected) {
                  const sibGroup = groupRefs.current.get(sibId);
                  const sibState = states.get(sibId);
                  const sibAsset = assets.find((a) => a.id === sibId);
                  if (!sibGroup || !sibState || !sibAsset) continue;

                  const sibSx = sibGroup.scaleX();
                  const sibSy = sibGroup.scaleY();
                  const sibRot = sibGroup.rotation();
                  const sibRad = sibRot * Math.PI / 180;
                  const sibGx = sibGroup.x();
                  const sibGy = sibGroup.y();
                  const sibIsScaled = Math.abs(sibSx - 1) > 0.001 || Math.abs(sibSy - 1) > 0.001;
                  const sibIsRotated = Math.abs(sibRot) > 0.1;
                  const { cx: sibCx, cy: sibCy } = getShapeCenter(sibState, sibAsset.type);
                  const sibIsArrow = sibAsset.type === "arrow" || sibAsset.type === "line";

                  // Reset sibling transform
                  sibGroup.scaleX(1);
                  sibGroup.scaleY(1);
                  sibGroup.rotation(0);
                  sibGroup.position({ x: sibCx, y: sibCy });

                  if (sibIsArrow && sibState.points) {
                    const pts = sibState.points;
                    const newPts: number[] = [];
                    const tCx = sibIsScaled ? sibGx : sibCx;
                    const tCy = sibIsScaled ? sibGy : sibCy;
                    for (let i = 0; i < pts.length; i += 2) {
                      let lx = (pts[i] - sibCx) * sibSx;
                      let ly = (pts[i + 1] - sibCy) * sibSy;
                      if (sibIsRotated) {
                        const rx = lx, ry = ly;
                        lx = rx * Math.cos(sibRad) - ry * Math.sin(sibRad);
                        ly = rx * Math.sin(sibRad) + ry * Math.cos(sibRad);
                      }
                      newPts.push(Math.round(tCx + lx), Math.round(tCy + ly));
                    }
                    batch.push({ id: sibId, changes: { points: newPts } });
                  } else {
                    const changes: Record<string, unknown> = {};
                    if (sibState.width !== undefined) changes.width = Math.round(Math.abs(sibState.width * sibSx));
                    if (sibState.height !== undefined) changes.height = Math.round(Math.abs(sibState.height * sibSy));
                    if (sibState.radius !== undefined) changes.radius = Math.round(Math.abs(sibState.radius * Math.max(Math.abs(sibSx), Math.abs(sibSy))));
                    if (sibState.fontSize !== undefined && sibIsScaled) {
                      changes.fontSize = Math.round(Math.abs(sibState.fontSize * Math.max(Math.abs(sibSx), Math.abs(sibSy))));
                    }
                    if (sibIsRotated) {
                      changes.rotation = Math.round(sibRot * 10) / 10;
                    }
                    changes.x = Math.round(sibIsScaled ? sibGx : sibCx);
                    changes.y = Math.round(sibIsScaled ? sibGy : sibCy);
                    batch.push({ id: sibId, changes });
                  }
                }
                onBatchEditChange?.(batch);
                return;
              }

              // Single shape transform
              if (isArrow && state.points) {
                const pts = state.points;
                const newPts: number[] = [];
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
                  // rot from Transformer already includes the Group's initial rotation
                  // (Group starts with rotation={state.rotation}, Transformer adds to it)
                  // So rot IS the final rotation, not a delta — use it directly
                  changes.rotation = Math.round(rot * 10) / 10;
                }
                const newShapeX = Math.round(isScaled ? gx : cx);
                const newShapeY = Math.round(isScaled ? gy : cy);
                changes.x = newShapeX;
                changes.y = newShapeY;
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
