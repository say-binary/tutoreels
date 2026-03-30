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
}

export function CanvasWorkspace({
  assets,
  states,
  backgroundColor = "#FFFFFF",
  canvasWidth = 1280,
  canvasHeight = 720,
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

  // Reset pan/zoom when assets change (new scene graph loaded)
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [assets]);

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
      if (e.evt.button === 1 || e.evt.altKey) {
        // Middle click or Alt+click to pan
        isPanning.current = true;
        lastPointer.current = { x: e.evt.clientX, y: e.evt.clientY };
        e.evt.preventDefault();
      }
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isPanning.current) return;
      const dx = e.evt.clientX - lastPointer.current.x;
      const dy = e.evt.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.evt.clientX, y: e.evt.clientY };
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    },
    []
  );

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const ready = dimensions !== null;
  const baseScale = dimensions?.baseScale ?? 1;
  const totalScale = baseScale * zoom;
  const stageWidth = dimensions?.width ?? 800;
  const stageHeight = dimensions?.height ?? 450;

  // Center the canvas in the viewport
  const contentWidth = canvasWidth * totalScale;
  const contentHeight = canvasHeight * totalScale;
  const centerOffsetX = (stageWidth - contentWidth) / 2 + pan.x;
  const centerOffsetY = (stageHeight - contentHeight) / 2 + pan.y;

  const isViewModified = zoom !== 1 || pan.x !== 0 || pan.y !== 0;

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", inset: 0 }}
      className="bg-zinc-900 overflow-hidden"
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
            style={{ cursor: isPanning.current ? "grabbing" : "default" }}
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
              <SceneRenderer assets={assets} states={states} />
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

          {/* Pan/zoom hint */}
          <div className="absolute top-3 right-3 text-[10px] text-zinc-600 pointer-events-none">
            Scroll to zoom &middot; Alt+drag to pan
          </div>
        </>
      )}
    </div>
  );
}
