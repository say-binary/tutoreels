"use client";

import { useState } from "react";
import type { AssetType } from "@/types/sceneGraph";

const ADD_SHAPES: { type: AssetType; label: string }[] = [
  { type: "rect", label: "Rectangle" },
  { type: "roundedRect", label: "Rounded Rect" },
  { type: "circle", label: "Circle" },
  { type: "arrow", label: "Arrow" },
  { type: "line", label: "Line" },
  { type: "text", label: "Text" },
  { type: "textBox", label: "Text Box" },
];

interface EditToolbarProps {
  selectedCount: number;
  isBlinking?: boolean;
  onAddShape: (type: AssetType) => void;
  onDeleteSelected: () => void;
  onToggleBlink: () => void;
  onSaveCheckpoint: () => void;
  onExitEdit: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function EditToolbar({
  selectedCount,
  isBlinking,
  onAddShape,
  onDeleteSelected,
  onToggleBlink,
  onSaveCheckpoint,
  onExitEdit,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: EditToolbarProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-zinc-800/95 border border-blue-500/40 rounded-lg px-3 py-2 shadow-lg backdrop-blur-sm">
      <span className="text-[10px] text-blue-400 font-medium mr-1">EDIT</span>

      {/* Undo */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="p-1.5 text-zinc-300 hover:text-white disabled:opacity-25 disabled:hover:text-zinc-300 rounded hover:bg-zinc-700 transition-colors"
        title="Undo (Ctrl+Z)"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 2v5h5L5.05 5.05A5.5 5.5 0 0 1 13.5 8 5.5 5.5 0 1 1 2.05 6.23L.93 5.36A7 7 0 1 0 15 8a7 7 0 0 0-12.55-4.2L2 2z" />
        </svg>
      </button>

      {/* Redo */}
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className="p-1.5 text-zinc-300 hover:text-white disabled:opacity-25 disabled:hover:text-zinc-300 rounded hover:bg-zinc-700 transition-colors"
        title="Redo (Ctrl+Shift+Z)"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ transform: "scaleX(-1)" }}>
          <path d="M2 2v5h5L5.05 5.05A5.5 5.5 0 0 1 13.5 8 5.5 5.5 0 1 1 2.05 6.23L.93 5.36A7 7 0 1 0 15 8a7 7 0 0 0-12.55-4.2L2 2z" />
        </svg>
      </button>

      <div className="w-px h-5 bg-zinc-600 mx-0.5" />

      {/* Add shape */}
      <div className="relative">
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="flex items-center gap-1 px-2 py-1.5 text-xs bg-zinc-700 hover:bg-zinc-600 rounded text-zinc-200 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 2a.75.75 0 01.75.75v4.5h4.5a.75.75 0 010 1.5h-4.5v4.5a.75.75 0 01-1.5 0v-4.5h-4.5a.75.75 0 010-1.5h4.5v-4.5A.75.75 0 018 2z" />
          </svg>
          Add
        </button>
        {showAddMenu && (
          <>
            {/* Click-away overlay */}
            <div className="fixed inset-0 z-30" onClick={() => setShowAddMenu(false)} />
            <div className="absolute top-full left-0 mt-1 bg-zinc-800 border border-zinc-600 rounded-lg shadow-xl py-1 min-w-[140px] z-40">
              {ADD_SHAPES.map((s) => (
                <button
                  key={s.type}
                  onClick={() => {
                    onAddShape(s.type);
                    setShowAddMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Delete selected */}
      <button
        onClick={onDeleteSelected}
        disabled={selectedCount === 0}
        className="flex items-center gap-1 px-2 py-1.5 text-xs bg-zinc-700 hover:bg-red-600/80 disabled:opacity-30 disabled:hover:bg-zinc-700 rounded text-zinc-200 transition-colors"
        title="Delete selected"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z" />
          <path fillRule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
        </svg>
        Del
      </button>

      {/* Blink toggle */}
      <button
        onClick={onToggleBlink}
        disabled={selectedCount === 0}
        className={`flex items-center gap-1 px-2 py-1.5 text-xs rounded transition-colors ${
          isBlinking
            ? "bg-yellow-600/30 text-yellow-300 border border-yellow-500/50"
            : "bg-zinc-700 hover:bg-yellow-600/50 text-zinc-200 disabled:opacity-30 disabled:hover:bg-zinc-700"
        }`}
        title="Toggle blink on selected shapes"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1a.5.5 0 01.5.5v2a.5.5 0 01-1 0v-2A.5.5 0 018 1zm3.743 1.843a.5.5 0 01.014.7l-1.414 1.414a.5.5 0 01-.72-.698l1.414-1.414a.5.5 0 01.707-.002zM13.5 7.5a.5.5 0 010 1h-2a.5.5 0 010-1h2zm-1.843 3.743a.5.5 0 01-.7.014l-1.414-1.414a.5.5 0 01.698-.72l1.414 1.414a.5.5 0 01.002.707zM8 13a.5.5 0 01.5.5v2a.5.5 0 01-1 0v-2A.5.5 0 018 13zm-3.743-1.843a.5.5 0 01-.014-.7l1.414-1.414a.5.5 0 01.72.698l-1.414 1.414a.5.5 0 01-.707.002zM2.5 8.5a.5.5 0 010-1h2a.5.5 0 010 1h-2zm1.843-3.743a.5.5 0 01.7-.014l1.414 1.414a.5.5 0 01-.698.72L4.345 5.463a.5.5 0 01-.002-.707zM8 5a3 3 0 100 6 3 3 0 000-6z" />
        </svg>
        Blink
      </button>

      <div className="w-px h-5 bg-zinc-600 mx-0.5" />

      {/* Save checkpoint */}
      <button
        onClick={onSaveCheckpoint}
        className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 rounded text-white font-medium transition-colors"
      >
        Save
      </button>

      {/* Exit edit */}
      <button
        onClick={onExitEdit}
        className="flex items-center gap-1 px-2 py-1.5 text-xs bg-zinc-700 hover:bg-zinc-600 rounded text-zinc-300 transition-colors"
      >
        Exit
      </button>
    </div>
  );
}
