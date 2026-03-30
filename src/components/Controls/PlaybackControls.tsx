"use client";

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

  return (
    <div className="bg-zinc-800 border-t border-zinc-700 px-4 py-3">
      {/* Timeline scrubber with step markers */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs text-zinc-400 w-10 text-right font-mono">
          {formatTime(currentTime)}
        </span>
        <div className="flex-1 relative">
          {/* Custom progress track */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-zinc-700 rounded-full">
            <div
              className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-[width] duration-75"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Step markers */}
          {timelineEntries &&
            duration > 0 &&
            timelineEntries.map((entry) => {
              const pct = (entry.startTime / duration) * 100;
              const isActive =
                currentTime >= entry.startTime &&
                currentTime < entry.startTime + entry.duration;
              return (
                <button
                  key={entry.id}
                  className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full -ml-1 z-10 transition-colors ${
                    isActive
                      ? "bg-blue-400 ring-2 ring-blue-400/30"
                      : "bg-zinc-500 hover:bg-zinc-300"
                  }`}
                  style={{ left: `${pct}%` }}
                  onClick={() => onSeek(entry.startTime)}
                  title={`Step: ${entry.id} (${formatTime(entry.startTime)})`}
                />
              );
            })}

          {/* Range input (transparent, sits on top) */}
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.01}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="relative w-full h-4 cursor-pointer opacity-0"
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
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M2 2v5h5L5.05 5.05A5.5 5.5 0 0 1 13.5 8 5.5 5.5 0 1 1 2.05 6.23L.93 5.36A7 7 0 1 0 15 8a7 7 0 0 0-12.55-4.2L2 2z" />
            </svg>
          </button>

          <button
            onClick={playing ? onPause : onPlay}
            className="p-2 bg-blue-600 hover:bg-blue-500 rounded-full text-white transition-colors"
            title={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="currentColor"
              >
                <rect x="4" y="3" width="3.5" height="12" rx="1" />
                <rect x="10.5" y="3" width="3.5" height="12" rx="1" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="currentColor"
              >
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
