"use client";

import { useState, useEffect, useCallback } from "react";
import type { SceneGraph } from "@/types/sceneGraph";
import { loadSaved, persistSaved } from "@/lib/savedStorage";
import type { SavedItem } from "@/lib/savedStorage";

interface SavedAnimationsProps {
  onLoad: (sg: SceneGraph) => void;
  refreshKey: number; // bumped by parent after save
}

export function SavedAnimations({ onLoad, refreshKey }: SavedAnimationsProps) {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [dialogItem, setDialogItem] = useState<SavedItem | null>(null);

  useEffect(() => {
    setItems(loadSaved());
  }, [refreshKey]);

  const handleDelete = useCallback(
    (id: string) => {
      const updated = items.filter((item) => item.id !== id);
      setItems(updated);
      persistSaved(updated);
    },
    [items]
  );

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {items.length === 0 ? (
        <div className="text-center py-8">
          <svg className="mx-auto mb-2 w-10 h-10 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          <p className="text-[11px] text-zinc-500">No saved animations yet</p>
          <p className="text-[10px] text-zinc-600 mt-1">
            Click Save on the canvas to keep an animation
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-1.5 p-2.5 bg-zinc-900/50 rounded-lg hover:bg-zinc-700/50 transition-colors border border-zinc-800 hover:border-zinc-600"
            >
              {/* Click to load */}
              <button
                onClick={() => onLoad(item.sceneGraph)}
                className="flex-1 text-left min-w-0"
              >
                <div className="text-xs text-zinc-200 truncate font-medium">
                  {item.title}
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  {formatDate(item.createdAt)}
                </div>
              </button>

              {/* Eye icon — opens description dialog */}
              <button
                onClick={() => setDialogItem(item)}
                className="p-1.5 text-zinc-500 hover:text-zinc-200 transition-colors"
                title="View details"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>

              {/* Delete */}
              <button
                onClick={() => handleDelete(item.id)}
                className="p-1.5 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                title="Delete"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Description dialog */}
      {dialogItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-zinc-800 border border-zinc-600 rounded-xl shadow-2xl w-80 max-w-[90vw] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
              <h3 className="text-sm font-medium text-white truncate pr-2">
                {dialogItem.title}
              </h3>
              <button
                onClick={() => setDialogItem(null)}
                className="p-1 text-zinc-400 hover:text-white transition-colors shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-4 py-3 space-y-3">
              {dialogItem.description && (
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Description</p>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {dialogItem.description}
                  </p>
                </div>
              )}
              {dialogItem.prompt && (
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Prompt</p>
                  <p className="text-xs text-zinc-400 italic leading-relaxed">
                    &quot;{dialogItem.prompt}&quot;
                  </p>
                </div>
              )}
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Saved</p>
                <p className="text-xs text-zinc-400">
                  {formatDate(dialogItem.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Stats</p>
                <p className="text-xs text-zinc-400">
                  {dialogItem.sceneGraph.assets.length} assets, {dialogItem.sceneGraph.timeline.length} steps, {dialogItem.sceneGraph.metadata.duration}s duration
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-zinc-700 flex gap-2">
              <button
                onClick={() => {
                  onLoad(dialogItem.sceneGraph);
                  setDialogItem(null);
                }}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-xs text-white font-medium transition-colors"
              >
                Load Animation
              </button>
              <button
                onClick={() => setDialogItem(null)}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-md text-xs text-zinc-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
