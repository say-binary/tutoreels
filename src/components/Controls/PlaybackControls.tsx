"use client";

import { useState } from "react";
import type { TimelineEntry } from "@/types/sceneGraph";

interface PlaybackControlsProps {
  playing: boolean;
  speed: number;
  currentTime: number;
  duration: number;
  timelineEntries?: TimelineEntry[];
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onSeek: (time: number) => void;
  onSpeedChange: (speed: number) => void;
}

const SPEEDS = [0.5, 1, 1.5, 2];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function cleanStepName(id: string): string {
  return id
    .replace(/^s_|^step_?|^show_/i, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function PlaybackControls({
  playing,
  speed,
  currentTime,
  duration,
  timelineEntries,
  onPlay,
  onPause,
  onReset,
  onSeek,
  onSpeedChange,
}: PlaybackControlsProps) {
  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  // Find the currently active step index
  let activeStepIdx = -1;
  if (timelineEntries) {
    for (let i = timelineEntries.length - 1; i >= 0; i--) {
      if (currentTime >= timelineEntries[i].startTime) {
        activeStepIdx = i;
        break;
      }
    }
  }

  // Which step label to show: hovered takes priority, then active
  const displayIdx = hoveredStep !== null ? hoveredStep : activeStepIdx;
  const displayEntry = timelineEntries && displayIdx >= 0 ? timelineEntries[displayIdx] : null;

  return (
    <div className="bg-zinc-800 border-t border-zinc-700 px-4 py-3">
      {/* Step label row — shows hovered or active step name */}
      {timelineEntries && displayEntry && (
        <div className="flex items-center gap-2 mb-2 px-1 h-5">
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
            hoveredStep !== null
              ? "text-yellow-400 bg-yellow-500/15"
              : "text-blue-400 bg-blue-500/15"
          }`}>
            Step {displayIdx + 1}/{timelineEntries.length}
          </span>
          <span className={`text-[11px] truncate ${
            hoveredStep !== null ? "text-zinc-200" : "text-zinc-500"
          }`}>
            {cleanStepName(displayEntry.id)}
          </span>
          {hoveredStep !== null && (
            <span className="text-[10px] text-zinc-600 font-mono">
              {formatTime(displayEntry.startTime)}
            </span>
          )}
        </div>
      )}

      {/* Timeline scrubber with numbered step markers */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs text-zinc-400 w-10 text-right font-mono">
          {formatTime(currentTime)}
        </span>
        <div className="flex-1 relative h-6">
          {/* Progress track */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-zinc-700 rounded-full">
            <div
              className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-[width] duration-75"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Numbered step markers */}
          {timelineEntries &&
            duration > 0 &&
            timelineEntries.map((entry, idx) => {
              const pct = (entry.startTime / duration) * 100;
              const isPast = currentTime >= entry.startTime + entry.duration;
              const isActive = idx === activeStepIdx;
              const isHovered = idx === hoveredStep;
              const num = idx + 1;

              return (
                <button
                  key={entry.id}
                  className={`absolute top-1/2 -translate-y-1/2 z-10 flex items-center justify-center rounded-full transition-all text-[8px] font-bold leading-none select-none ${
                    isHovered
                      ? "w-6 h-6 -ml-3 bg-yellow-500 text-zinc-900 ring-2 ring-yellow-400/50 scale-110"
                      : isActive
                        ? "w-5 h-5 -ml-2.5 bg-blue-500 text-white ring-2 ring-blue-400/40"
                        : isPast
                          ? "w-4 h-4 -ml-2 bg-blue-500/60 text-white"
                          : "w-4 h-4 -ml-2 bg-zinc-600 text-zinc-300 hover:bg-zinc-400 hover:text-white"
                  }`}
                  style={{ left: `${pct}%` }}
                  onClick={() => onSeek(entry.startTime)}
                  onMouseEnter={() => setHoveredStep(idx)}
                  onMouseLeave={() => setHoveredStep(null)}
                >
                  {num}
                </button>
              );
            })}

          {/* Range input (transparent, sits on top for drag-seek) */}
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.01}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="relative w-full h-6 cursor-pointer opacity-0 z-20"
          />
        </div>
        <span className="text-xs text-zinc-400 w-10 font-mono">
          {formatTime(duration)}
        </span>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="p-2 text-zinc-400 hover:text-white transition-colors"
            title="Reset"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 2v5h5L5.05 5.05A5.5 5.5 0 0 1 13.5 8 5.5 5.5 0 1 1 2.05 6.23L.93 5.36A7 7 0 1 0 15 8a7 7 0 0 0-12.55-4.2L2 2z" />
            </svg>
          </button>

          <button
            onClick={playing ? onPause : onPlay}
            className="p-2 bg-blue-600 hover:bg-blue-500 rounded-full text-white transition-colors"
            title={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                <rect x="4" y="3" width="3.5" height="12" rx="1" />
                <rect x="10.5" y="3" width="3.5" height="12" rx="1" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                <path d="M5 3.5v11l9-5.5z" />
              </svg>
            )}
          </button>
        </div>

        {/* Speed selector */}
        <div className="flex items-center gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                speed === s
                  ? "bg-blue-600 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
