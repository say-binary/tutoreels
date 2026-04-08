"use client";

import { useCallback, useEffect, useRef } from "react";
import { Tldraw, createShapeId, toRichText, type Editor } from "tldraw";
import "tldraw/tldraw.css";
import type { AssetInstance, ShapeState } from "@/types/sceneGraph";
import type { ComputedAssetState } from "@/engine/AnimationEngine";

interface TldrawEditorProps {
  assets: AssetInstance[];
  states: Map<string, ComputedAssetState>;
  onSave: (updatedStates: Map<string, Partial<ShapeState>>) => void;
  onExit: () => void;
}

/**
 * Convert our scene graph assets to tldraw shapes and load them into the editor.
 */
function loadShapesIntoEditor(editor: Editor, assets: AssetInstance[], states: Map<string, ComputedAssetState>) {
  const shapesToCreate: Parameters<Editor["createShapes"]>[0] = [];

  for (const asset of assets) {
    const state = states.get(asset.id);
    if (!state) continue;
    if (!state.visible && (state.opacity === undefined || state.opacity <= 0)) continue;

    const id = createShapeId(asset.id);
    const isArrow = asset.type === "arrow" || asset.type === "line";

    if (isArrow && state.points && state.points.length >= 4) {
      // Convert arrow/line to tldraw arrow or line
      const pts = state.points;
      const x1 = pts[0], y1 = pts[1];
      const x2 = pts[pts.length - 2], y2 = pts[pts.length - 1];

      shapesToCreate.push({
        id,
        type: "arrow",
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        props: {
          start: { x: x1 - Math.min(x1, x2), y: y1 - Math.min(y1, y2) },
          end: { x: x2 - Math.min(x1, x2), y: y2 - Math.min(y1, y2) },
          color: strokeToTldrawColor(state.stroke),
          size: state.strokeWidth && state.strokeWidth > 2 ? "l" : "m",
          arrowheadEnd: asset.type === "arrow" ? "arrow" : "none",
          arrowheadStart: "none",
        },
      });
    } else if (asset.type === "text") {
      shapesToCreate.push({
        id,
        type: "text",
        x: state.x ?? 0,
        y: state.y ?? 0,
        rotation: (state.rotation ?? 0) * Math.PI / 180,
        props: {
          richText: toRichText(state.text ?? ""),
          size: fontSizeToTldrawSize(state.fontSize),
          color: fillToTldrawColor(state.fill),
          w: 200,
          autoSize: true,
        },
      });
    } else if (asset.type === "circle" || asset.type === "ellipse") {
      const r = state.radius ?? 30;
      const w = state.width ?? r * 2;
      const h = state.height ?? r * 2;
      shapesToCreate.push({
        id,
        type: "geo",
        x: (state.x ?? 0) - w / 2,
        y: (state.y ?? 0) - h / 2,
        rotation: (state.rotation ?? 0) * Math.PI / 180,
        props: {
          w, h,
          geo: "ellipse",
          color: fillToTldrawColor(state.fill),
          fill: state.fill ? "solid" : "none",
        },
      });
    } else {
      // rect, roundedRect, textBox, container, diamond, star, polygon → geo rectangle
      const w = state.width ?? 120;
      const h = state.height ?? 60;
      shapesToCreate.push({
        id,
        type: "geo",
        x: (state.x ?? 0) - w / 2,
        y: (state.y ?? 0) - h / 2,
        rotation: (state.rotation ?? 0) * Math.PI / 180,
        props: {
          w, h,
          geo: asset.type === "diamond" ? "diamond" : "rectangle",
          color: fillToTldrawColor(state.fill),
          fill: state.fill ? "solid" : "none",
          richText: state.text ? toRichText(state.text) : toRichText(""),
          size: fontSizeToTldrawSize(state.fontSize),
        },
      });
    }
  }

  if (shapesToCreate.length > 0) {
    editor.createShapes(shapesToCreate);
    editor.zoomToFit({ animation: { duration: 200 } });
  }
}

/**
 * Read tldraw shapes back and convert to our scene graph format.
 */
function readShapesFromEditor(editor: Editor, originalAssets: AssetInstance[]): Map<string, Partial<ShapeState>> {
  const updates = new Map<string, Partial<ShapeState>>();

  for (const asset of originalAssets) {
    const tldrawId = createShapeId(asset.id);
    const shape = editor.getShape(tldrawId);
    if (!shape) continue;

    const changes: Partial<ShapeState> = {};
    const isArrow = asset.type === "arrow" || asset.type === "line";

    if (isArrow && shape.type === "arrow") {
      const props = shape.props as { start?: { x: number; y: number }; end?: { x: number; y: number } };
      if (props.start && props.end) {
        const sx = (shape.x ?? 0) + (props.start.x ?? 0);
        const sy = (shape.y ?? 0) + (props.start.y ?? 0);
        const ex = (shape.x ?? 0) + (props.end.x ?? 0);
        const ey = (shape.y ?? 0) + (props.end.y ?? 0);
        changes.points = [Math.round(sx), Math.round(sy), Math.round(ex), Math.round(ey)];
      }
    } else if (asset.type === "text" && shape.type === "text") {
      changes.x = Math.round(shape.x ?? 0);
      changes.y = Math.round(shape.y ?? 0);
      changes.rotation = shape.rotation ? Math.round(shape.rotation * 180 / Math.PI * 10) / 10 : undefined;
      // tldraw v4 uses richText — extract plain text from it
      const props = shape.props as { richText?: { content?: Array<{ content?: Array<{ text?: string }> }> } };
      if (props.richText?.content) {
        const plainText = props.richText.content
          .flatMap((p) => p.content?.map((c) => c.text ?? "") ?? [])
          .join("");
        if (plainText) changes.text = plainText;
      }
    } else if (shape.type === "geo") {
      const props = shape.props as { w?: number; h?: number; text?: string };
      const w = props.w ?? 120;
      const h = props.h ?? 60;
      // tldraw geo shapes have (x,y) at top-left, we need center
      changes.x = Math.round((shape.x ?? 0) + w / 2);
      changes.y = Math.round((shape.y ?? 0) + h / 2);
      changes.width = Math.round(w);
      changes.height = Math.round(h);
      changes.rotation = shape.rotation ? Math.round(shape.rotation * 180 / Math.PI * 10) / 10 : undefined;
      if (asset.type === "circle" || asset.type === "ellipse") {
        changes.radius = Math.round(Math.max(w, h) / 2);
      }
      if (props.text !== undefined && props.text !== "") changes.text = props.text;
    }

    if (Object.keys(changes).length > 0) {
      updates.set(asset.id, changes);
    }
  }

  return updates;
}

// Color mapping helpers
type TldrawColor = "black" | "blue" | "green" | "grey" | "light-blue" | "light-green" | "light-red" | "light-violet" | "orange" | "red" | "violet" | "white" | "yellow";

function fillToTldrawColor(fill?: string): TldrawColor {
  if (!fill) return "black";
  const map: Record<string, TldrawColor> = {
    "#4A90D9": "blue", "#2EC4B6": "green", "#50C878": "green",
    "#E6A817": "orange", "#F4D03F": "yellow", "#9B59B6": "violet",
    "#E74C3C": "red", "#FF6B6B": "red", "#E056A0": "violet",
    "#FFFFFF": "white", "#CCCCCC": "grey", "#95A5A6": "grey",
    "#1E2A3A": "black", "#2C3E50": "black", "#0d1220": "black",
  };
  return map[fill] || "black";
}

function strokeToTldrawColor(stroke?: string): TldrawColor {
  return fillToTldrawColor(stroke);
}

function fontSizeToTldrawSize(fontSize?: number): "s" | "m" | "l" | "xl" {
  if (!fontSize || fontSize <= 12) return "s";
  if (fontSize <= 16) return "m";
  if (fontSize <= 24) return "l";
  return "xl";
}

export function TldrawEditor({ assets, states, onSave, onExit }: TldrawEditorProps) {
  const editorRef = useRef<Editor | null>(null);
  const assetsRef = useRef(assets);
  assetsRef.current = assets;

  const handleMount = useCallback((editor: Editor) => {
    editorRef.current = editor;
    // Load our shapes into tldraw
    loadShapesIntoEditor(editor, assets, states);
  }, [assets, states]);

  const handleSave = useCallback(() => {
    if (!editorRef.current) return;
    const updates = readShapesFromEditor(editorRef.current, assetsRef.current);
    onSave(updates);
  }, [onSave]);

  return (
    <div className="absolute inset-0 z-20">
      {/* Toolbar overlay */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-zinc-800/95 border border-blue-500/40 rounded-lg px-4 py-2 shadow-lg backdrop-blur-sm">
        <span className="text-[10px] text-blue-400 font-medium">EDIT MODE</span>
        <button
          onClick={handleSave}
          className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 rounded text-white font-medium transition-colors"
        >
          Save & Exit
        </button>
        <button
          onClick={onExit}
          className="px-3 py-1.5 text-xs bg-zinc-700 hover:bg-zinc-600 rounded text-zinc-300 transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* tldraw canvas */}
      <Tldraw
        onMount={handleMount}
        options={{ maxPages: 1 }}
      />
    </div>
  );
}
