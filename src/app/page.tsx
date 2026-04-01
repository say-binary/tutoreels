"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { TextInputPanel } from "@/components/Input/TextInputPanel";
import { PlaybackControls } from "@/components/Controls/PlaybackControls";
import { EditToolbar } from "@/components/Editor/EditToolbar";
import { PropertiesPanel } from "@/components/Editor/PropertiesPanel";
import { useAnimationEngine } from "@/hooks/useAnimationEngine";
import { useEditHistory } from "@/hooks/useEditHistory";
import type { SceneGraph, AssetType, ShapeState } from "@/types/sceneGraph";
import type { ComputedAssetState } from "@/engine/AnimationEngine";
import { demoSceneGraph } from "@/lib/demoSceneGraph";
import { demoBinarySearch } from "@/lib/demoBinarySearch";
import { demoHashMap } from "@/lib/demoHashMap";
import { demoTCPHandshake } from "@/lib/demoTCPHandshake";
import { demoMultiAgent } from "@/lib/demoMultiAgent";
import { SavedAnimations } from "@/components/Input/SavedAnimations";
import { saveToLocalStorage } from "@/lib/savedStorage";

const CanvasWorkspace = dynamic(
  () => import("@/components/Canvas/CanvasWorkspace").then((m) => m.CanvasWorkspace),
  { ssr: false }
);

const DEMOS: { label: string; sg: SceneGraph }[] = [
  { label: "Neuron", sg: demoSceneGraph },
  { label: "Binary Search", sg: demoBinarySearch },
  { label: "Hash Map", sg: demoHashMap },
  { label: "TCP Handshake", sg: demoTCPHandshake },
  { label: "Multi-Agent", sg: demoMultiAgent },
];

export default function Home() {
  const [sceneGraph, setSceneGraph] = useState<SceneGraph | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [sidebarTab, setSidebarTab] = useState<"create" | "saved">("create");
  const [savedVersion, setSavedVersion] = useState(0);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const autoPlayRef = useRef(false);

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { overrides, applyEdit, undo, redo, canUndo, canRedo, resetHistory } = useEditHistory();
  const [pendingAdds, setPendingAdds] = useState<SceneGraph["assets"]>([]);
  const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set());
  const editingRef = useRef(false); // prevents sceneGraph reset effect during edits

  const { states, currentTime, duration, playing, speed, play, pause, reset, seek, setSpeed } =
    useAnimationEngine(sceneGraph);

  // Merge engine states with edit overrides, pending adds, pending deletes
  const mergedStates = useMemo(() => {
    if (!editMode) return states;
    const merged = new Map(states);

    // 1. Add pending new assets FIRST (they don't exist in engine yet)
    for (const asset of pendingAdds) {
      if (!merged.has(asset.id)) {
        merged.set(asset.id, { ...asset.initialState, visible: true, opacity: 1 } as ComputedAssetState);
      }
    }

    // 2. Apply overrides AFTER — so they can modify both existing and pending shapes
    for (const [id, changes] of overrides) {
      const existing = merged.get(id);
      if (existing) merged.set(id, { ...existing, ...changes } as ComputedAssetState);
    }

    // 3. Hide pending deletes
    for (const id of pendingDeletes) {
      const existing = merged.get(id);
      if (existing) merged.set(id, { ...existing, visible: false, opacity: 0 } as ComputedAssetState);
    }

    return merged;
  }, [states, editMode, overrides, pendingAdds, pendingDeletes]);

  // Auto-play
  useEffect(() => {
    if (sceneGraph && autoPlayRef.current) {
      autoPlayRef.current = false;
      const t = setTimeout(() => play(), 300);
      return () => clearTimeout(t);
    }
  }, [sceneGraph, play]);

  // Reset edit mode on scene graph change — but NOT when edit actions modify it
  useEffect(() => {
    if (editingRef.current) { editingRef.current = false; return; }
    setEditMode(false);
    setSelectedIds(new Set());
    setPendingAdds([]);
    setPendingDeletes(new Set());
    resetHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneGraph]);

  // --- Non-edit handlers ---
  const handleLoadDemo = useCallback((label: string, sg: SceneGraph) => {
    setSceneGraph(sg);
    setLastPrompt(null);
    setError(null);
    setActiveDemo(label);
    setReviewNote("");
    autoPlayRef.current = true;
  }, []);

  const handleGenerate = useCallback(async (description: string) => {
    setLoading(true);
    setError(null);
    setLastPrompt(description);
    setActiveDemo(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }
      const sg: SceneGraph = await res.json();
      setSceneGraph(sg);
      autoPlayRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRegenerate = useCallback(() => {
    if (lastPrompt) handleGenerate(lastPrompt);
  }, [lastPrompt, handleGenerate]);

  const handleLoadSaved = useCallback((sg: SceneGraph) => {
    setSceneGraph(sg);
    setLastPrompt(null);
    setError(null);
    setActiveDemo(null);
    autoPlayRef.current = true;
  }, []);

  const handleSave = useCallback(() => {
    if (!sceneGraph) return;
    saveToLocalStorage(sceneGraph, lastPrompt);
    setSavedVersion((v) => v + 1);
    setShowSaveConfirm(true);
    setTimeout(() => setShowSaveConfirm(false), 2000);
  }, [sceneGraph, lastPrompt]);

  // --- Edit mode handlers ---
  const handleEnterEdit = useCallback(() => {
    pause();
    setEditMode(true);
    setSelectedIds(new Set());
    setPendingAdds([]);
    setPendingDeletes(new Set());
    resetHistory();
  }, [pause, resetHistory]);

  const handleExitEdit = useCallback(() => {
    setEditMode(false);
    setSelectedIds(new Set());
    setPendingAdds([]);
    setPendingDeletes(new Set());
    resetHistory();
  }, [resetHistory]);

  const handleSelect = useCallback((id: string | null, additive: boolean) => {
    if (!id) { setSelectedIds(new Set()); return; }
    if (additive) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
    } else {
      setSelectedIds(new Set([id]));
    }
  }, []);

  const handleRubberBandSelect = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  // Single shape edit (drag end, transform end, property change)
  const handleEditChange = useCallback((id: string, changes: Record<string, unknown>) => {
    applyEdit((prev) => {
      const next = new Map(prev);
      const existing = next.get(id) || {};
      next.set(id, { ...existing, ...changes });
      return next;
    });
  }, [applyEdit]);

  // Batch edit (multi-drag)
  const handleBatchEditChange = useCallback((batch: Array<{ id: string; changes: Record<string, unknown> }>) => {
    applyEdit((prev) => {
      const next = new Map(prev);
      for (const { id, changes } of batch) {
        const existing = next.get(id) || {};
        next.set(id, { ...existing, ...changes });
      }
      return next;
    });
  }, [applyEdit]);

  // Toggle blink on selected shapes
  const handleToggleBlink = useCallback(() => {
    if (selectedIds.size === 0) return;
    applyEdit((prev) => {
      const next = new Map(prev);
      // Check if any selected shape is already blinking
      let anyBlinking = false;
      for (const id of selectedIds) {
        const existing = next.get(id);
        const curState = mergedStates.get(id);
        const isOn = (existing?.blink as boolean | undefined) ?? curState?.blink ?? false;
        if (isOn) { anyBlinking = true; break; }
      }
      // Toggle: if any are blinking, turn all off. Otherwise turn all on.
      for (const id of selectedIds) {
        const existing = next.get(id) || {};
        next.set(id, { ...existing, blink: !anyBlinking });
      }
      return next;
    });
  }, [selectedIds, applyEdit, mergedStates]);

  // Property panel change — goes through same applyEdit
  const handlePropertyChange = useCallback((assetId: string, key: string, value: string | number) => {
    applyEdit((prev) => {
      const next = new Map(prev);
      const existing = next.get(assetId) || {};
      next.set(assetId, { ...existing, [key]: value });
      return next;
    });
  }, [applyEdit]);

  // Add shape — deferred to save checkpoint
  const handleAddShape = useCallback((type: AssetType) => {
    if (!sceneGraph) return;
    const id = `edit_${type}_${Date.now()}`;
    const defaults: Record<string, ShapeState> = {
      rect: { x: 640, y: 360, width: 120, height: 80, fill: "#4A90D9", stroke: "#FFFFFF", strokeWidth: 2 },
      roundedRect: { x: 640, y: 360, width: 120, height: 80, fill: "#50C878", stroke: "#FFFFFF", strokeWidth: 2, cornerRadius: 10 },
      circle: { x: 640, y: 360, radius: 40, fill: "#E6A817", stroke: "#FFFFFF", strokeWidth: 2 },
      ellipse: { x: 640, y: 360, width: 120, height: 70, fill: "#9B59B6", stroke: "#FFFFFF", strokeWidth: 2 },
      star: { x: 640, y: 360, radius: 35, numPoints: 5, innerRadius: 15, fill: "#F4D03F", stroke: "#E6A817", strokeWidth: 2 },
      polygon: { x: 640, y: 360, radius: 35, numPoints: 6, fill: "#2EC4B6", stroke: "#FFFFFF", strokeWidth: 2 },
      diamond: { x: 640, y: 360, width: 80, height: 80, fill: "#E74C3C", stroke: "#FFFFFF", strokeWidth: 2 },
      arrow: { x: 0, y: 0, points: [540, 360, 740, 360], stroke: "#E6A817", strokeWidth: 2 },
      line: { x: 0, y: 0, points: [540, 360, 740, 360], stroke: "#95A5A6", strokeWidth: 2 },
      text: { x: 640, y: 360, text: "New Text", fontSize: 20, fill: "#FFFFFF" },
      textBox: { x: 640, y: 360, width: 120, height: 40, text: "Label", fontSize: 14, fill: "#2C3E50", stroke: "#FFFFFF" },
      container: { x: 640, y: 360, width: 200, height: 120, fill: "#0d1220", stroke: "#95A5A6", text: "Group" },
    };
    const newAsset = { id, type: type as SceneGraph["assets"][0]["type"], initialState: defaults[type] || defaults.rect, visible: true };
    setPendingAdds((prev) => [...prev, newAsset]);
    setSelectedIds(new Set([id]));
  }, [sceneGraph]);

  // Delete selected — deferred to save checkpoint
  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    setPendingDeletes((prev) => {
      const next = new Set(prev);
      for (const id of selectedIds) next.add(id);
      return next;
    });
    // Also remove from pending adds if it was just added
    setPendingAdds((prev) => prev.filter((a) => !selectedIds.has(a.id)));
    setSelectedIds(new Set());
  }, [selectedIds]);

  // Save checkpoint — apply ALL pending changes to scene graph at once
  const handleSaveCheckpoint = useCallback(() => {
    if (!sceneGraph) { handleExitEdit(); return; }
    const hasChanges = overrides.size > 0 || pendingAdds.length > 0 || pendingDeletes.size > 0;
    if (!hasChanges) { handleExitEdit(); return; }

    editingRef.current = true; // prevent the reset effect from firing
    const sg = structuredClone(sceneGraph);

    // 1. Apply property overrides to existing assets
    for (const [id, changes] of overrides) {
      const asset = sg.assets.find((a) => a.id === id);
      if (asset) asset.initialState = { ...asset.initialState, ...changes };
    }

    // 2. Add new assets + appear actions
    for (const newAsset of pendingAdds) {
      sg.assets.push(newAsset);
      sg.timeline.push({
        id: `appear_${newAsset.id}`,
        startTime: Math.max(0, currentTime - 0.1),
        duration: 0.5,
        actions: [{ targetId: newAsset.id, type: "appear", effect: "fade" }],
      });
    }

    // 3. Add disappear actions for deleted assets
    for (const id of pendingDeletes) {
      sg.timeline.push({
        id: `del_${id}`,
        startTime: currentTime,
        duration: 0.3,
        actions: [{ targetId: id, type: "disappear", effect: "fade" }],
      });
    }

    sg.timeline.sort((a, b) => a.startTime - b.startTime);
    setSceneGraph(sg);
    handleExitEdit();
    setTimeout(() => seek(currentTime), 50);
  }, [sceneGraph, overrides, pendingAdds, pendingDeletes, currentTime, handleExitEdit, seek]);

  // Arrow key nudge
  const handleArrowMove = useCallback((dx: number, dy: number) => {
    if (selectedIds.size === 0) return;
    const batch: Array<{ id: string; changes: Record<string, unknown> }> = [];
    for (const id of selectedIds) {
      const s = mergedStates.get(id);
      const a = sceneGraph?.assets.find((a) => a.id === id);
      if (!s || !a) continue;
      if ((a.type === "arrow" || a.type === "line") && s.points) {
        batch.push({ id, changes: { points: s.points.map((v, i) => Math.round(v + (i % 2 === 0 ? dx : dy))) } });
      } else {
        batch.push({ id, changes: { x: Math.round((s.x ?? 0) + dx), y: Math.round((s.y ?? 0) + dy) } });
      }
    }
    if (batch.length > 0) handleBatchEditChange(batch);
  }, [selectedIds, mergedStates, sceneGraph, handleBatchEditChange]);

  // Keyboard shortcuts in edit mode
  useEffect(() => {
    if (!editMode) return;
    const handler = (e: KeyboardEvent) => {
      const isInput = document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA";

      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "a" && !isInput) {
        e.preventDefault();
        if (sceneGraph) {
          const ids = sceneGraph.assets
            .filter((a) => { const s = states.get(a.id); return s && (s.visible || (s.opacity !== undefined && s.opacity > 0)); })
            .map((a) => a.id);
          setSelectedIds(new Set(ids));
        }
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && !isInput && selectedIds.size > 0) {
        e.preventDefault();
        handleDeleteSelected();
        return;
      }
      if (e.key === "Escape") { setSelectedIds(new Set()); return; }

      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) && !isInput) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const map: Record<string, [number, number]> = {
          ArrowUp: [0, -step], ArrowDown: [0, step], ArrowLeft: [-step, 0], ArrowRight: [step, 0],
        };
        const [dx, dy] = map[e.key];
        handleArrowMove(dx, dy);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editMode, undo, redo, selectedIds, handleDeleteSelected, handleArrowMove, sceneGraph, states]);

  // Properties panel info
  const singleId = selectedIds.size === 1 ? [...selectedIds][0] : null;
  const selectedAsset = singleId ? sceneGraph?.assets.find((a) => a.id === singleId) : null;
  const selectedState = singleId ? mergedStates.get(singleId) : null;

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-900 text-white">
      {/* Left panel */}
      <div className="w-80 bg-zinc-800 border-r border-zinc-700 flex flex-col">
        <div className="flex border-b border-zinc-700">
          <button onClick={() => setSidebarTab("create")} className={`flex-1 py-2.5 text-xs font-medium transition-colors ${sidebarTab === "create" ? "text-white border-b-2 border-blue-500" : "text-zinc-400 hover:text-zinc-200"}`}>Create</button>
          <button onClick={() => setSidebarTab("saved")} className={`flex-1 py-2.5 text-xs font-medium transition-colors ${sidebarTab === "saved" ? "text-white border-b-2 border-blue-500" : "text-zinc-400 hover:text-zinc-200"}`}>Saved</button>
        </div>

        {sidebarTab === "create" ? (
          <>
            <TextInputPanel onSubmit={handleGenerate} onDemo={() => handleLoadDemo("Neuron", demoSceneGraph)} loading={loading} />
            <div className="border-t border-zinc-700 p-3">
              <p className="text-xs text-zinc-500 mb-2 font-medium">Review Demos:</p>
              <div className="flex flex-wrap gap-1.5">
                {DEMOS.map((d) => (
                  <button key={d.label} onClick={() => handleLoadDemo(d.label, d.sg)} disabled={loading}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${activeDemo === d.label ? "bg-blue-600 text-white" : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"} disabled:opacity-50`}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            {activeDemo && (
              <div className="border-t border-zinc-700 p-3">
                <label className="text-xs text-zinc-400 block mb-1">Review notes for &quot;{activeDemo}&quot;:</label>
                <textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="What's wrong?..." rows={3}
                  className="w-full bg-zinc-900 border border-zinc-600 rounded-lg p-2 text-xs text-white placeholder-zinc-500 resize-none focus:outline-none focus:border-yellow-500" />
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 p-3 overflow-y-auto">
            <SavedAnimations onLoad={handleLoadSaved} refreshKey={savedVersion} />
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Title bar */}
        {sceneGraph && (
          <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/80 border-b border-zinc-700/50">
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-medium text-white truncate">{sceneGraph.metadata.title}</h2>
              <p className="text-xs text-zinc-400 truncate">{sceneGraph.metadata.description}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!editMode && (
                <button onClick={handleEnterEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-zinc-700 hover:bg-amber-600/80 rounded-md text-zinc-300 hover:text-white border border-zinc-600 hover:border-amber-500/50 transition-colors shrink-0">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L3.463 11.1a.25.25 0 00-.064.108l-.563 1.97 1.971-.564a.25.25 0 00.108-.064l8.61-8.61a.25.25 0 000-.353L12.427 2.488z" /></svg>
                  Edit
                </button>
              )}
              <button onClick={handleSave}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors shrink-0 ${showSaveConfirm ? "bg-green-600/20 text-green-400 border border-green-600/30" : "bg-zinc-700 hover:bg-zinc-600 text-zinc-300 border border-zinc-600"}`}>
                {showSaveConfirm ? (<><svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" /></svg>Saved!</>)
                  : (<><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2.5 2.5h8l3 3v8h-11z" /><path d="M5 2.5v4h5v-4" /><path d="M4.5 9.5h7" /><path d="M4.5 11.5h7" /></svg>Save</>)}
              </button>
              {lastPrompt && !editMode && (
                <button onClick={handleRegenerate} disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 rounded-md text-zinc-300 transition-colors shrink-0">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2v5h5L5.05 5.05A5.5 5.5 0 0 1 13.5 8 5.5 5.5 0 1 1 2.05 6.23L.93 5.36A7 7 0 1 0 15 8a7 7 0 0 0-12.55-4.2L2 2z" /></svg>
                  Regenerate
                </button>
              )}
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className={`flex-1 relative ${sceneGraph ? "" : "flex items-center justify-center"}`}>
          {sceneGraph ? (
            <>
              <CanvasWorkspace
                assets={editMode ? [...sceneGraph.assets, ...pendingAdds].filter((a) => !pendingDeletes.has(a.id)) : sceneGraph.assets}
                states={mergedStates}
                backgroundColor={sceneGraph.metadata.backgroundColor}
                canvasWidth={sceneGraph.metadata.canvasWidth}
                canvasHeight={sceneGraph.metadata.canvasHeight}
                editMode={editMode}
                selectedAssetIds={selectedIds}
                onSelectAsset={handleSelect}
                onEditChange={handleEditChange}
                onBatchEditChange={handleBatchEditChange}
                onRubberBandSelect={handleRubberBandSelect}
              />
              {editMode && (
                <EditToolbar
                  selectedCount={selectedIds.size}
                  isBlinking={singleId ? !!(mergedStates.get(singleId)?.blink) : false}
                  onAddShape={handleAddShape}
                  onDeleteSelected={handleDeleteSelected}
                  onToggleBlink={handleToggleBlink}
                  onSaveCheckpoint={handleSaveCheckpoint}
                  onExitEdit={handleExitEdit}
                  onUndo={undo}
                  onRedo={redo}
                  canUndo={canUndo}
                  canRedo={canRedo}
                />
              )}
              {editMode && selectedAsset && selectedState && singleId && (
                <PropertiesPanel assetId={singleId} assetType={selectedAsset.type} state={selectedState} onPropertyChange={handlePropertyChange} />
              )}
            </>
          ) : (
            <div className="text-center text-zinc-500">
              <svg className="mx-auto mb-4 w-16 h-16 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-lg">Describe a concept to generate an animation</p>
              <p className="text-sm mt-1 text-zinc-600">Or click a demo below to review</p>
            </div>
          )}
          {loading && sceneGraph && (
            <div className="absolute inset-0 bg-zinc-900/70 flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-3">
                <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" className="opacity-75" />
                </svg>
                <p className="text-sm text-zinc-300">Regenerating animation...</p>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-900/80 border border-red-700 text-red-200 px-4 py-2 rounded-lg text-sm max-w-md z-20">
              {error}
              <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-200">x</button>
            </div>
          )}
        </div>

        {/* Playback / Edit status */}
        {sceneGraph && !editMode && (
          <PlaybackControls playing={playing} speed={speed} currentTime={currentTime} duration={duration}
            timelineEntries={sceneGraph.timeline} onPlay={play} onPause={pause} onReset={reset} onSeek={seek} onSpeedChange={setSpeed} />
        )}
        {sceneGraph && editMode && (
          <div className="bg-zinc-800 border-t border-blue-500/30 px-4 py-2 flex items-center justify-between">
            <span className="text-xs text-blue-400">
              Editing at {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, "0")}
            </span>
            <span className="text-[10px] text-zinc-500">
              {selectedIds.size > 0 && `${selectedIds.size} selected · `}
              {(overrides.size + pendingAdds.length + pendingDeletes.size) > 0
                ? `${overrides.size} edits, ${pendingAdds.length} added, ${pendingDeletes.size} deleted`
                : "No changes"}
              {canUndo && ` · Cmd+Z undo`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
