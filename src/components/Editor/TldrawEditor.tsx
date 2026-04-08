"use client";

import { useCallback, useRef } from "react";
import { Tldraw, createShapeId, toRichText, type Editor } from "tldraw";
import "tldraw/tldraw.css";
import type { AssetInstance, ShapeState } from "@/types/sceneGraph";
import type { ComputedAssetState } from "@/engine/AnimationEngine";

export interface TldrawSaveResult {
  /** Updated states for existing assets (keyed by asset.id) */
  updates: Map<string, Partial<ShapeState>>;
  /** Brand new assets added in tldraw */
  newAssets: AssetInstance[];
}

interface TldrawEditorProps {
  assets: AssetInstance[];
  states: Map<string, ComputedAssetState>;
  canvasWidth: number;
  canvasHeight: number;
  onSave: (result: TldrawSaveResult) => void;
  onExit: () => void;
}

// Map of our asset IDs to tldraw shape IDs
const assetToTldraw = (id: string) => createShapeId(id);

/**
 * Load our scene graph assets into the tldraw editor.
 * Positions shapes in the same coordinate space as our 1280x720 canvas.
 */
function loadShapesIntoEditor(
  editor: Editor,
  assets: AssetInstance[],
  states: Map<string, ComputedAssetState>,
  canvasWidth: number,
  canvasHeight: number,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shapesToCreate: any[] = [];

  for (const asset of assets) {
    const state = states.get(asset.id);
    if (!state) continue;
    if (!state.visible && (state.opacity === undefined || state.opacity <= 0)) continue;

    const id = assetToTldraw(asset.id);
    const isArrow = asset.type === "arrow" || asset.type === "line";

    if (isArrow && state.points && state.points.length >= 4) {
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
          color: mapColor(state.stroke),
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
          color: mapColor(state.fill),
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
          color: mapColor(state.fill),
          fill: state.fill ? "solid" : "none",
        },
      });
    } else {
      // rect, roundedRect, textBox, container, diamond, star, polygon
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
          color: mapColor(state.fill),
          fill: state.fill ? "solid" : "none",
          richText: state.text ? toRichText(state.text) : toRichText(""),
          size: fontSizeToTldrawSize(state.fontSize),
        },
      });
    }
  }

  if (shapesToCreate.length > 0) {
    editor.createShapes(shapesToCreate);
  }

  // Set camera to show the full canvas area
  editor.setCamera({
    x: -canvasWidth * 0.05,
    y: -canvasHeight * 0.05,
    z: Math.min(
      (editor.getViewportScreenBounds().width) / (canvasWidth * 1.1),
      (editor.getViewportScreenBounds().height) / (canvasHeight * 1.1),
    ),
  });
}

/**
 * Extract rich text to plain text.
 */
function richTextToPlain(richText: unknown): string {
  if (!richText || typeof richText !== "object") return "";
  const rt = richText as { content?: Array<{ content?: Array<{ text?: string }> }> };
  if (!rt.content) return "";
  return rt.content
    .flatMap((p) => p.content?.map((c) => c.text ?? "") ?? [])
    .join("");
}

/**
 * Read ALL tldraw shapes and convert to scene graph updates + new assets.
 */
function readShapesFromEditor(
  editor: Editor,
  originalAssets: AssetInstance[],
): TldrawSaveResult {
  const updates = new Map<string, Partial<ShapeState>>();
  const newAssets: AssetInstance[] = [];
  const knownIds = new Set(originalAssets.map((a) => assetToTldraw(a.id).toString()));

  // Process existing assets
  for (const asset of originalAssets) {
    const tldrawId = assetToTldraw(asset.id);
    const shape = editor.getShape(tldrawId);
    if (!shape) continue;

    const changes = extractShapeState(shape, asset.type);
    if (Object.keys(changes).length > 0) {
      updates.set(asset.id, changes);
    }
  }

  // Process NEW shapes (added by user in tldraw)
  const allShapes = editor.getCurrentPageShapes();
  for (const shape of allShapes) {
    if (knownIds.has(shape.id.toString())) continue;

    // This is a new shape — convert to our asset format
    const id = `tldraw_${shape.type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newAsset = tldrawShapeToAsset(shape, id);
    if (newAsset) {
      newAssets.push(newAsset);
    }
  }

  return { updates, newAssets };
}

/**
 * Extract position/size/rotation/text from a tldraw shape.
 */
function extractShapeState(shape: ReturnType<Editor["getShape"]>, assetType: string): Partial<ShapeState> {
  if (!shape) return {};
  const changes: Partial<ShapeState> = {};

  if (assetType === "arrow" || assetType === "line") {
    if (shape.type === "arrow") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const props = shape.props as any;
      if (props.start && props.end) {
        const sx = (shape.x ?? 0) + (props.start.x ?? 0);
        const sy = (shape.y ?? 0) + (props.start.y ?? 0);
        const ex = (shape.x ?? 0) + (props.end.x ?? 0);
        const ey = (shape.y ?? 0) + (props.end.y ?? 0);
        changes.points = [Math.round(sx), Math.round(sy), Math.round(ex), Math.round(ey)];
      }
    }
  } else if (assetType === "text") {
    changes.x = Math.round(shape.x ?? 0);
    changes.y = Math.round(shape.y ?? 0);
    if (shape.rotation) changes.rotation = Math.round(shape.rotation * 180 / Math.PI * 10) / 10;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const text = richTextToPlain((shape.props as any)?.richText);
    if (text) changes.text = text;
  } else if (shape.type === "geo") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const props = shape.props as any;
    const w = props.w ?? 120;
    const h = props.h ?? 60;
    changes.x = Math.round((shape.x ?? 0) + w / 2);
    changes.y = Math.round((shape.y ?? 0) + h / 2);
    changes.width = Math.round(w);
    changes.height = Math.round(h);
    if (shape.rotation) changes.rotation = Math.round(shape.rotation * 180 / Math.PI * 10) / 10;
    if (assetType === "circle" || assetType === "ellipse") {
      changes.radius = Math.round(Math.max(w, h) / 2);
    }
    const text = richTextToPlain(props.richText);
    if (text) changes.text = text;
  } else if (shape.type === "text") {
    changes.x = Math.round(shape.x ?? 0);
    changes.y = Math.round(shape.y ?? 0);
    if (shape.rotation) changes.rotation = Math.round(shape.rotation * 180 / Math.PI * 10) / 10;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const text = richTextToPlain((shape.props as any)?.richText);
    if (text) changes.text = text;
  }

  return changes;
}

/**
 * Convert a brand new tldraw shape to our AssetInstance format.
 */
function tldrawShapeToAsset(shape: ReturnType<Editor["getCurrentPageShapes"]>[0], id: string): AssetInstance | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props = shape.props as any;

  if (shape.type === "geo") {
    const w = props.w ?? 120;
    const h = props.h ?? 60;
    const geo = props.geo ?? "rectangle";
    const text = richTextToPlain(props.richText);
    const type = geo === "ellipse" ? "circle" as const : geo === "diamond" ? "diamond" as const : "rect" as const;
    return {
      id,
      type,
      initialState: {
        x: Math.round((shape.x ?? 0) + w / 2),
        y: Math.round((shape.y ?? 0) + h / 2),
        width: Math.round(w),
        height: Math.round(h),
        radius: type === "circle" ? Math.round(Math.max(w, h) / 2) : undefined,
        fill: "#4A90D9",
        stroke: "#FFFFFF",
        strokeWidth: 2,
        text: text || undefined,
        rotation: shape.rotation ? Math.round(shape.rotation * 180 / Math.PI * 10) / 10 : undefined,
      },
      visible: true,
    };
  } else if (shape.type === "text") {
    const text = richTextToPlain(props.richText);
    return {
      id,
      type: "text",
      initialState: {
        x: Math.round(shape.x ?? 0),
        y: Math.round(shape.y ?? 0),
        text: text || "Text",
        fontSize: 16,
        fill: "#FFFFFF",
        rotation: shape.rotation ? Math.round(shape.rotation * 180 / Math.PI * 10) / 10 : undefined,
      },
      visible: true,
    };
  } else if (shape.type === "arrow") {
    const start = props.start;
    const end = props.end;
    if (start && end) {
      return {
        id,
        type: "arrow",
        initialState: {
          x: 0,
          y: 0,
          points: [
            Math.round((shape.x ?? 0) + (start.x ?? 0)),
            Math.round((shape.y ?? 0) + (start.y ?? 0)),
            Math.round((shape.x ?? 0) + (end.x ?? 0)),
            Math.round((shape.y ?? 0) + (end.y ?? 0)),
          ],
          stroke: "#E6A817",
          strokeWidth: 2,
        },
        visible: true,
      };
    }
  }

  return null;
}

// Color mapping
type TldrawColor = "black" | "blue" | "green" | "grey" | "light-blue" | "light-green" | "light-red" | "light-violet" | "orange" | "red" | "violet" | "white" | "yellow";

function mapColor(color?: string): TldrawColor {
  if (!color) return "black";
  const map: Record<string, TldrawColor> = {
    "#4A90D9": "blue", "#2EC4B6": "light-green", "#50C878": "green",
    "#E6A817": "orange", "#F4D03F": "yellow", "#9B59B6": "violet",
    "#E74C3C": "red", "#FF6B6B": "light-red", "#E056A0": "violet",
    "#FFFFFF": "white", "#CCCCCC": "grey", "#95A5A6": "grey",
    "#1E2A3A": "black", "#2C3E50": "black", "#0d1220": "black",
    "#20B2AA": "light-green",
  };
  return map[color] || "black";
}

function fontSizeToTldrawSize(fontSize?: number): "s" | "m" | "l" | "xl" {
  if (!fontSize || fontSize <= 12) return "s";
  if (fontSize <= 16) return "m";
  if (fontSize <= 24) return "l";
  return "xl";
}

export function TldrawEditor({ assets, states, canvasWidth, canvasHeight, onSave, onExit }: TldrawEditorProps) {
  const editorRef = useRef<Editor | null>(null);
  const assetsRef = useRef(assets);
  assetsRef.current = assets;

  const handleMount = useCallback((editor: Editor) => {
    editorRef.current = editor;
    loadShapesIntoEditor(editor, assets, states, canvasWidth, canvasHeight);
  }, [assets, states, canvasWidth, canvasHeight]);

  const handleSave = useCallback(() => {
    if (!editorRef.current) return;
    const result = readShapesFromEditor(editorRef.current, assetsRef.current);
    onSave(result);
  }, [onSave]);

  return (
    <div className="absolute inset-0 z-20 flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-blue-500/40 z-30">
        <span className="text-xs text-blue-400 font-medium">EDIT MODE — tldraw</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 rounded text-white font-medium transition-colors"
          >
            Save & Exit
          </button>
          <button
            onClick={onExit}
            className="px-4 py-1.5 text-xs bg-zinc-700 hover:bg-zinc-600 rounded text-zinc-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* tldraw canvas */}
      <div className="flex-1 relative">
        <Tldraw
          onMount={handleMount}
          options={{ maxPages: 1 }}
        />
      </div>
    </div>
  );
}
