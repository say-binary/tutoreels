"use client";

import { useRef, useEffect, useCallback } from "react";
import { Transformer, Group, Rect as KonvaRect } from "react-konva";
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

export function SceneRenderer({
  assets,
  states,
  editMode = false,
  selectedIds,
  onSelect,
  onEditChange,
  onBatchEditChange,
  selectionRect,
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

  /**
   * Get the center point and size of a shape for Group positioning.
   * In edit mode, we position the Group at the shape's center so the
   * Transformer bounding box is correct.
   */
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
      return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
    }
    return { cx: state.x ?? 0, cy: state.y ?? 0 };
  }

  /**
   * Create a zeroed state for edit-mode rendering.
   * The Group is positioned at the shape center, so the shape renders at (0,0).
   */
  function zeroedState(state: ComputedAssetState, type: string): ComputedAssetState {
    if (type === "arrow" || type === "line") {
      const pts = state.points ?? [0, 0, 100, 0];
      const { cx, cy } = getShapeCenter(state, type);
      // Offset points relative to center
      const localPts = pts.map((v, i) => v - (i % 2 === 0 ? cx : cy));
      return { ...state, x: 0, y: 0, points: localPts };
    }
    // For center-based shapes: render at (0,0) — the shape components
    // render at (x - w/2, y - h/2), so setting x=0, y=0 means they
    // render at (-w/2, -h/2) which centers them in the Group
    return { ...state, x: 0, y: 0 };
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

        // Normal mode — render directly with state coordinates
        if (!editMode) {
          if (isBlink) {
            return <BlinkGroup key={asset.id} blink speed={state.blinkSpeed ?? 2}><Component state={state} /></BlinkGroup>;
          }
          return <Component key={asset.id} state={state} />;
        }

        // Edit mode — Group positioned at shape center, shape renders at (0,0)
        const { cx, cy } = getShapeCenter(state, asset.type);
        const localState = zeroedState(state, asset.type);
        const isArrow = asset.type === "arrow" || asset.type === "line";

        return (
          <Group
            key={asset.id}
            ref={(node: Konva.Group | null) => setGroupRef(asset.id, node)}
            x={cx}
            y={cy}
            draggable
            onClick={(e) => {
              e.cancelBubble = true;
              onSelect?.(asset.id, e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey);
            }}
            onTap={(e) => {
              e.cancelBubble = true;
              onSelect?.(asset.id, false);
            }}
            onDragEnd={(e) => {
              const group = e.target;
              const newCx = group.x();
              const newCy = group.y();

              // If the group was scaled/rotated (transform happened), skip drag handling
              // onTransformEnd handles it instead
              if (Math.abs(group.scaleX() - 1) > 0.001 || Math.abs(group.scaleY() - 1) > 0.001 || Math.abs(group.rotation()) > 0.01) {
                return;
              }

              // Multi-select: compute delta and move all
              if (selected.size > 1 && selected.has(asset.id)) {
                const dx = newCx - cx;
                const dy = newCy - cy;
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
                  // Reset sibling group positions to their new centers
                  // (they'll be re-positioned on next render from updated state)
                }
                onBatchEditChange?.(batch);
              } else {
                // Single drag
                if (isArrow && state.points) {
                  const dx = newCx - cx;
                  const dy = newCy - cy;
                  onEditChange?.(asset.id, { points: state.points.map((v, i) => Math.round(v + (i % 2 === 0 ? dx : dy))) });
                } else {
                  onEditChange?.(asset.id, { x: Math.round(newCx), y: Math.round(newCy) });
                }
              }
            }}
            onTransformEnd={() => {
              const group = groupRefs.current.get(asset.id);
              if (!group) return;

              const sx = group.scaleX();
              const sy = group.scaleY();
              const rot = group.rotation();
              const newCx = group.x();
              const newCy = group.y();

              // Reset immediately
              group.scaleX(1);
              group.scaleY(1);
              group.rotation(0);

              if (isArrow && state.points) {
                // Transform all points: scale and rotate around current center, then translate
                const pts = state.points;
                const rad = rot * Math.PI / 180;
                const newPts: number[] = [];
                for (let i = 0; i < pts.length; i += 2) {
                  // Offset from old center
                  let lx = (pts[i] - cx) * sx;
                  let ly = (pts[i + 1] - cy) * sy;
                  // Rotate
                  if (Math.abs(rad) > 0.001) {
                    const rx = lx, ry = ly;
                    lx = rx * Math.cos(rad) - ry * Math.sin(rad);
                    ly = rx * Math.sin(rad) + ry * Math.cos(rad);
                  }
                  newPts.push(Math.round(lx + newCx), Math.round(ly + newCy));
                }
                // Group will reposition on next render
                group.position({ x: 0, y: 0 });
                onEditChange?.(asset.id, { points: newPts });
              } else {
                // Regular shapes — compute new dimensions and center
                const changes: Record<string, unknown> = {};
                const newW = state.width !== undefined ? Math.round(Math.abs(state.width * sx)) : undefined;
                const newH = state.height !== undefined ? Math.round(Math.abs(state.height * sy)) : undefined;
                if (newW !== undefined) changes.width = newW;
                if (newH !== undefined) changes.height = newH;
                if (state.radius !== undefined) changes.radius = Math.round(Math.abs(state.radius * Math.max(Math.abs(sx), Math.abs(sy))));
                if (state.fontSize !== undefined && Math.abs(sx - 1) > 0.01) {
                  changes.fontSize = Math.round(Math.abs(state.fontSize * Math.max(Math.abs(sx), Math.abs(sy))));
                }

                // The Group was at (cx, cy) before transform.
                // Konva moved group.x/y to keep the opposite anchor fixed.
                // group.x() IS the correct new center position.
                changes.x = Math.round(newCx);
                changes.y = Math.round(newCy);

                group.position({ x: cx, y: cy }); // restore to original center so React re-render is smooth
                group.scaleX(1);
                group.scaleY(1);
                group.rotation(0);
                onEditChange?.(asset.id, changes);
              }
            }}
          >
            {isBlink ? (
              <BlinkGroup blink speed={state.blinkSpeed ?? 2}><Component state={localState} /></BlinkGroup>
            ) : (
              <Component state={localState} />
            )}
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
          borderStroke="#3b82f6"
          borderStrokeWidth={1.5}
          anchorStroke="#3b82f6"
          anchorFill="#1d4ed8"
          anchorSize={12}
          anchorCornerRadius={3}
          keepRatio={false}
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
}
