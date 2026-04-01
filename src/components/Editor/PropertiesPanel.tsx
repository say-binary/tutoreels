"use client";

import { useState } from "react";
import type { ComputedAssetState } from "@/engine/AnimationEngine";

const COLOR_PALETTE = [
  // Row 1: Primary
  "#4A90D9", "#2EC4B6", "#50C878", "#20B2AA",
  "#E6A817", "#F4D03F", "#E74C3C", "#FF6B6B",
  // Row 2: Accent
  "#9B59B6", "#E056A0", "#1ABC9C", "#3498DB",
  "#F39C12", "#E67E22", "#95A5A6", "#7F8C8D",
  // Row 3: Dark/Light
  "#1E2A3A", "#2C3E50", "#34495E", "#0f1729",
  "#FFFFFF", "#CCCCCC", "#B0BEC5", "#ECF0F1",
];

function ColorPicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (color: string) => void;
  label: string;
}) {
  const [showPalette, setShowPalette] = useState(false);

  return (
    <div>
      <label className="text-[10px] text-zinc-500 uppercase block mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowPalette(!showPalette)}
          className="w-7 h-7 rounded border-2 border-zinc-500 hover:border-zinc-300 transition-colors shrink-0"
          style={{ backgroundColor: value }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-xs text-white font-mono"
        />
      </div>
      {showPalette && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowPalette(false)} />
          <div className="relative z-50 mt-1.5 p-2 bg-zinc-700 border border-zinc-500 rounded-lg shadow-xl grid grid-cols-8 gap-1">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => {
                  onChange(c);
                  setShowPalette(false);
                }}
                className={`w-6 h-6 rounded-sm border transition-all hover:scale-110 ${
                  value === c ? "border-white ring-1 ring-white" : "border-zinc-600"
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
            {/* Native color picker as fallback */}
            <div className="col-span-8 mt-1 pt-1 border-t border-zinc-600">
              <input
                type="color"
                value={value}
                onChange={(e) => {
                  onChange(e.target.value);
                  setShowPalette(false);
                }}
                className="w-full h-6 cursor-pointer bg-transparent border-0"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface PropertiesPanelProps {
  assetId: string;
  assetType: string;
  state: ComputedAssetState;
  onPropertyChange: (assetId: string, key: string, value: string | number) => void;
}

export function PropertiesPanel({
  assetId,
  assetType,
  state,
  onPropertyChange,
}: PropertiesPanelProps) {
  const change = (key: string, value: string | number) =>
    onPropertyChange(assetId, key, value);

  return (
    <div className="absolute top-12 right-3 z-30 w-52 bg-zinc-800/95 border border-zinc-600 rounded-lg shadow-xl backdrop-blur-sm overflow-hidden">
      <div className="px-3 py-2 border-b border-zinc-700 bg-zinc-700/50">
        <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Properties</p>
        <p className="text-xs text-zinc-200 font-medium truncate">{assetId}</p>
        <p className="text-[10px] text-zinc-500">{assetType}</p>
      </div>

      <div className="px-3 py-2 space-y-2.5 max-h-80 overflow-y-auto">
        {/* Position */}
        <div>
          <label className="text-[10px] text-zinc-500 uppercase block mb-1">Position</label>
          <div className="flex gap-2">
            <div className="flex-1">
              <span className="text-[10px] text-zinc-500">X</span>
              <input
                type="number"
                value={Math.round(state.x ?? 0)}
                onChange={(e) => change("x", parseFloat(e.target.value) || 0)}
                className="w-full bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-xs text-white"
              />
            </div>
            <div className="flex-1">
              <span className="text-[10px] text-zinc-500">Y</span>
              <input
                type="number"
                value={Math.round(state.y ?? 0)}
                onChange={(e) => change("y", parseFloat(e.target.value) || 0)}
                className="w-full bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* Size — for shapes that have width/height */}
        {(assetType === "rect" || assetType === "roundedRect" || assetType === "textBox" || assetType === "container") && (
          <div>
            <label className="text-[10px] text-zinc-500 uppercase block mb-1">Size</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <span className="text-[10px] text-zinc-500">W</span>
                <input
                  type="number"
                  value={Math.round(state.width ?? 100)}
                  onChange={(e) => change("width", parseFloat(e.target.value) || 100)}
                  className="w-full bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-xs text-white"
                />
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-zinc-500">H</span>
                <input
                  type="number"
                  value={Math.round(state.height ?? 60)}
                  onChange={(e) => change("height", parseFloat(e.target.value) || 60)}
                  className="w-full bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-xs text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Radius — for circle */}
        {assetType === "circle" && (
          <div>
            <label className="text-[10px] text-zinc-500 uppercase block mb-1">Radius</label>
            <input
              type="number"
              value={Math.round(state.radius ?? 30)}
              onChange={(e) => change("radius", parseFloat(e.target.value) || 30)}
              className="w-full bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-xs text-white"
            />
          </div>
        )}

        {/* Fill color — palette */}
        {state.fill && (
          <ColorPicker
            value={state.fill}
            onChange={(c) => change("fill", c)}
            label="Fill"
          />
        )}

        {/* Stroke color — palette */}
        {state.stroke && (
          <ColorPicker
            value={state.stroke}
            onChange={(c) => change("stroke", c)}
            label="Stroke"
          />
        )}

        {/* Text content */}
        {state.text !== undefined && (
          <div>
            <label className="text-[10px] text-zinc-500 uppercase block mb-1">Text</label>
            <input
              type="text"
              value={state.text}
              onChange={(e) => change("text", e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-xs text-white"
            />
          </div>
        )}

        {/* Font size */}
        {state.fontSize !== undefined && (
          <div>
            <label className="text-[10px] text-zinc-500 uppercase block mb-1">Font Size</label>
            <input
              type="number"
              value={state.fontSize}
              onChange={(e) => change("fontSize", parseFloat(e.target.value) || 14)}
              className="w-full bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-xs text-white"
            />
          </div>
        )}

        {/* Opacity */}
        <div>
          <label className="text-[10px] text-zinc-500 uppercase block mb-1">
            Opacity ({Math.round((state.opacity ?? 1) * 100)}%)
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={state.opacity ?? 1}
            onChange={(e) => change("opacity", parseFloat(e.target.value))}
            className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Stroke width */}
        {state.strokeWidth !== undefined && (
          <div>
            <label className="text-[10px] text-zinc-500 uppercase block mb-1">
              Stroke Width ({state.strokeWidth}px)
            </label>
            <input
              type="range"
              min={0}
              max={8}
              step={0.5}
              value={state.strokeWidth}
              onChange={(e) => change("strokeWidth", parseFloat(e.target.value))}
              className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        )}
      </div>
    </div>
  );
}
