"use client";

import { Stage, Layer, Rect } from "react-konva";
import { SceneRenderer } from "./SceneRenderer";
import type { AssetInstance } from "@/types/sceneGraph";
import type { ComputedAssetState } from "@/engine/AnimationEngine";
import { useRef, useState, useEffect, useCallback } from "react";
import type Konva from "konva";

interface CanvasWorkspaceProps {
  assets: AssetInstance[];
  states: Map<string, ComputedAssetState>;
  backgroundColor?: string;
  canvasWidth?: number;
  canvasHeight?: number;
  editMode?: boolean;
  selectedAssetIds?: Set<string>;
  onSelectAsset?: (id: string | null, additive: boolean) => void;
  onEditChange?: (id: string, changes: Record<string, unknown>) => void;
  onBatchEditChange?: (batch: Array<{ id: string; changes: Record<string, unknown> }>) => void;
  onRubberBandSelect?: (ids: string[]) => void;
}

export function CanvasWorkspace({
  assets,
  states,
  backgroundColor = "#FFFFFF",
  canvasWidth = 1280,
  canvasHeight = 720,
  editMode = false,
  selectedAssetIds,
  onSelectAsset,
  onEditChange,
  onBatchEditChange,
  onRubberBandSelect,
}: CanvasWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
    baseScale: number;
  } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  // Rubber band selection state
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const isSelecting = useRef(false);
  const selectionStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function measure() {
      const rect = container!.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0 || h === 0) return;
      const scaleX = w / canvasWidth;
      const scaleY = h / canvasHeight;
      const s = Math.min(scaleX, scaleY, 1);
      setDimensions({ width: w, height: h, baseScale: s });
    }

    measure();
    const observer = new ResizeObserver(() => measure());
    observer.observe(container);
    return () => observer.disconnect();
  }, [canvasWidth, canvasHeight]);

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [assets]);

  const baseScale = dimensions?.baseScale ?? 1;
  const totalScale = baseScale * zoom;
  const stageWidth = dimensions?.width ?? 800;
  const stageHeight = dimensions?.height ?? 450;
  const contentWidth = canvasWidth * totalScale;
  const contentHeight = canvasHeight * totalScale;
  const centerOffsetX = (stageWidth - contentWidth) / 2 + pan.x;
  const centerOffsetY = (stageHeight - contentHeight) / 2 + pan.y;

  // Convert screen coords to canvas coords
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    return {
      x: (screenX - centerOffsetX) / totalScale,
      y: (screenY - centerOffsetY) / totalScale,
    };
  }, [centerOffsetX, centerOffsetY, totalScale]);

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const scaleBy = 1.08;
      const newZoom =
        e.evt.deltaY < 0
          ? Math.min(zoom * scaleBy, 5)
          : Math.max(zoom / scaleBy, 0.3);
      setZoom(newZoom);
    },
    [zoom]
  );

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // In edit mode: left click on empty area starts rubber band selection
      if (editMode && e.evt.button === 0) {
        // Check if click is on the background (not a shape)
        const target = e.target;
        const stage = stageRef.current;
        if (target === stage || target.getClassName() === "Rect" && target.getParent()?.getClassName() === "Layer") {
          const pointer = stage?.getPointerPosition();
          if (pointer) {
            const canvasPos = screenToCanvas(pointer.x, pointer.y);
            isSelecting.current = true;
            selectionStart.current = canvasPos;
            setSelectionRect({ x: canvasPos.x, y: canvasPos.y, width: 0, height: 0 });
            onSelectAsset?.(null, false); // deselect
          }
        }
        return;
      }

      // Pan with middle click
      if (e.evt.button === 1) {
        isPanning.current = true;
        lastPointer.current = { x: e.evt.clientX, y: e.evt.clientY };
        e.evt.preventDefault();
        return;
      }

      // Non-edit: alt+click to pan
      if (!editMode && e.evt.altKey) {
        isPanning.current = true;
        lastPointer.current = { x: e.evt.clientX, y: e.evt.clientY };
        e.evt.preventDefault();
      }
    },
    [editMode, screenToCanvas, onSelectAsset]
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (isPanning.current) {
        const dx = e.evt.clientX - lastPointer.current.x;
        const dy = e.evt.clientY - lastPointer.current.y;
        lastPointer.current = { x: e.evt.clientX, y: e.evt.clientY };
        setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        return;
      }

      // Rubber band selection
      if (isSelecting.current && editMode) {
        const stage = stageRef.current;
        const pointer = stage?.getPointerPosition();
        if (pointer) {
          const canvasPos = screenToCanvas(pointer.x, pointer.y);
          const sx = selectionStart.current.x;
          const sy = selectionStart.current.y;
          setSelectionRect({
            x: Math.min(sx, canvasPos.x),
            y: Math.min(sy, canvasPos.y),
            width: Math.abs(canvasPos.x - sx),
            height: Math.abs(canvasPos.y - sy),
          });
        }
      }
    },
    [editMode, screenToCanvas]
  );

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;

    // Finish rubber band selection
    if (isSelecting.current && selectionRect && editMode) {
      isSelecting.current = false;

      // Only select if the rectangle is big enough (not just a click)
      if (selectionRect.width > 10 && selectionRect.height > 10) {
        const rect = selectionRect;
        const selectedIds: string[] = [];

        for (const asset of assets) {
          const state = states.get(asset.id);
          if (!state || (!state.visible && (state.opacity === undefined || state.opacity <= 0))) continue;

          let cx: number, cy: number;
          if (asset.type === "arrow" || asset.type === "line") {
            const pts = state.points;
            if (pts && pts.length >= 4) {
              cx = (pts[0] + pts[pts.length - 2]) / 2;
              cy = (pts[1] + pts[pts.length - 1]) / 2;
            } else continue;
          } else {
            cx = state.x ?? 0;
            cy = state.y ?? 0;
          }

          if (
            cx >= rect.x &&
            cx <= rect.x + rect.width &&
            cy >= rect.y &&
            cy <= rect.y + rect.height
          ) {
            selectedIds.push(asset.id);
          }
        }

        if (selectedIds.length > 0) {
          onRubberBandSelect?.(selectedIds);
        }
      }

      setSelectionRect(null);
    }
  }, [editMode, selectionRect, assets, states, onRubberBandSelect]);

  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const ready = dimensions !== null;
  const isViewModified = zoom !== 1 || pan.x !== 0 || pan.y !== 0;

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", inset: 0 }}
      className={`bg-zinc-900 overflow-hidden ${editMode ? "ring-2 ring-blue-500/30 ring-inset" : ""}`}
    >
      {ready && (
        <>
          <Stage
            ref={stageRef}
            width={stageWidth}
            height={stageHeight}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: editMode ? (isSelecting.current ? "crosshair" : "default") : "default" }}
          >
            <Layer x={centerOffsetX} y={centerOffsetY} scaleX={totalScale} scaleY={totalScale}>
              <Rect
                x={0}
                y={0}
                width={canvasWidth}
                height={canvasHeight}
                fill={backgroundColor}
                cornerRadius={4}
              />
              <SceneRenderer
                assets={assets}
                states={states}
                editMode={editMode}
                selectedIds={selectedAssetIds}
                onSelect={onSelectAsset}
                onEditChange={onEditChange}
                onBatchEditChange={onBatchEditChange}
                selectionRect={selectionRect}
              />
            </Layer>
          </Stage>

          {/* Zoom indicator & reset */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 font-mono">
              {Math.round(zoom * 100)}%
            </span>
            {isViewModified && (
              <button
                onClick={handleResetView}
                className="text-[10px] text-zinc-400 hover:text-white bg-zinc-800/80 px-2 py-0.5 rounded transition-colors"
              >
                Reset view
              </button>
            )}
          </div>

          {/* Hints */}
          {!editMode && (
            <div className="absolute top-3 right-3 text-[10px] text-zinc-600 pointer-events-none">
              Scroll to zoom &middot; Alt+drag to pan
            </div>
          )}
          {editMode && (
            <div className="absolute top-3 right-3 text-[10px] text-zinc-600 pointer-events-none">
              Drag shapes to move &middot; Drag empty area to select &middot; Shift+click to multi-select
            </div>
          )}
        </>
      )}
    </div>
  );
}
