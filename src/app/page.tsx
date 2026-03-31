"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useRef, useEffect } from "react";
import { TextInputPanel } from "@/components/Input/TextInputPanel";
import { PlaybackControls } from "@/components/Controls/PlaybackControls";
import { useAnimationEngine } from "@/hooks/useAnimationEngine";
import type { SceneGraph } from "@/types/sceneGraph";
import { demoSceneGraph } from "@/lib/demoSceneGraph";
import { demoBinarySearch } from "@/lib/demoBinarySearch";
import { demoHashMap } from "@/lib/demoHashMap";
import { demoTCPHandshake } from "@/lib/demoTCPHandshake";
import { demoMultiAgent } from "@/lib/demoMultiAgent";
import { SavedAnimations } from "@/components/Input/SavedAnimations";
import { saveToLocalStorage } from "@/lib/savedStorage";

const CanvasWorkspace = dynamic(
  () =>
    import("@/components/Canvas/CanvasWorkspace").then(
      (m) => m.CanvasWorkspace
    ),
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
  const [savedVersion, setSavedVersion] = useState(0); // bumped to trigger re-render of SavedAnimations
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const autoPlayRef = useRef(false);

  const {
    states,
    currentTime,
    duration,
    playing,
    speed,
    play,
    pause,
    reset,
    seek,
    setSpeed,
  } = useAnimationEngine(sceneGraph);

  // Auto-play when a new scene graph loads
  useEffect(() => {
    if (sceneGraph && autoPlayRef.current) {
      autoPlayRef.current = false;
      const timer = setTimeout(() => play(), 300);
      return () => clearTimeout(timer);
    }
  }, [sceneGraph, play]);

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
    if (lastPrompt) {
      handleGenerate(lastPrompt);
    }
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

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-900 text-white">
      {/* Left panel */}
      <div className="w-80 bg-zinc-800 border-r border-zinc-700 flex flex-col">
        {/* Tab switcher */}
        <div className="flex border-b border-zinc-700">
          <button
            onClick={() => setSidebarTab("create")}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              sidebarTab === "create"
                ? "text-white border-b-2 border-blue-500"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Create
          </button>
          <button
            onClick={() => setSidebarTab("saved")}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              sidebarTab === "saved"
                ? "text-white border-b-2 border-blue-500"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Saved
          </button>
        </div>

        {sidebarTab === "create" ? (
          <>
            <TextInputPanel
              onSubmit={handleGenerate}
              onDemo={() => handleLoadDemo("Neuron", demoSceneGraph)}
              loading={loading}
            />

            {/* Demo selector */}
            <div className="border-t border-zinc-700 p-3">
              <p className="text-xs text-zinc-500 mb-2 font-medium">Review Demos:</p>
              <div className="flex flex-wrap gap-1.5">
                {DEMOS.map((d) => (
                  <button
                    key={d.label}
                    onClick={() => handleLoadDemo(d.label, d.sg)}
                    disabled={loading}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                      activeDemo === d.label
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                    } disabled:opacity-50`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Review textbox */}
            {activeDemo && (
              <div className="border-t border-zinc-700 p-3">
                <label className="text-xs text-zinc-400 block mb-1">
                  Review notes for &quot;{activeDemo}&quot;:
                </label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="What's wrong? e.g. 'arrows misaligned', 'label overlaps box', 'text too small'..."
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-600 rounded-lg p-2 text-xs text-white placeholder-zinc-500 resize-none focus:outline-none focus:border-yellow-500"
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 p-3 overflow-y-auto">
            <SavedAnimations
              onLoad={handleLoadSaved}
              refreshKey={savedVersion}
            />
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Title bar */}
        {sceneGraph && (
          <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/80 border-b border-zinc-700/50">
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-medium text-white truncate">
                {sceneGraph.metadata.title}
              </h2>
              <p className="text-xs text-zinc-400 truncate">
                {sceneGraph.metadata.description}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Save button */}
              <button
                onClick={handleSave}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors shrink-0 ${
                  showSaveConfirm
                    ? "bg-green-600/20 text-green-400 border border-green-600/30"
                    : "bg-zinc-700 hover:bg-zinc-600 text-zinc-300 border border-zinc-600"
                }`}
              >
                {showSaveConfirm ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                    </svg>
                    Saved!
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M2.5 2.5h8l3 3v8h-11z" />
                      <path d="M5 2.5v4h5v-4" />
                      <path d="M4.5 9.5h7" />
                      <path d="M4.5 11.5h7" />
                    </svg>
                    Save
                  </>
                )}
              </button>

              {/* Regenerate button */}
              {lastPrompt && (
                <button
                  onClick={handleRegenerate}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 rounded-md text-zinc-300 transition-colors shrink-0"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M2 2v5h5L5.05 5.05A5.5 5.5 0 0 1 13.5 8 5.5 5.5 0 1 1 2.05 6.23L.93 5.36A7 7 0 1 0 15 8a7 7 0 0 0-12.55-4.2L2 2z" />
                  </svg>
                  Regenerate
                </button>
              )}
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className={`flex-1 relative ${sceneGraph ? "" : "flex items-center justify-center"}`}>
          {sceneGraph ? (
            <CanvasWorkspace
              assets={sceneGraph.assets}
              states={states}
              backgroundColor={sceneGraph.metadata.backgroundColor}
              canvasWidth={sceneGraph.metadata.canvasWidth}
              canvasHeight={sceneGraph.metadata.canvasHeight}
            />
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

        {/* Playback */}
        {sceneGraph && (
          <PlaybackControls
            playing={playing}
            speed={speed}
            currentTime={currentTime}
            duration={duration}
            timelineEntries={sceneGraph.timeline}
            onPlay={play}
            onPause={pause}
            onReset={reset}
            onSeek={seek}
            onSpeedChange={setSpeed}
          />
        )}
      </div>
    </div>
  );
}
