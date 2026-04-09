"use client";

import { useState, useEffect, useRef } from "react";

interface TextInputPanelProps {
  onSubmit: (description: string) => void;
  loading: boolean;
}

const SUGGESTIONS = [
  "Explain how transformer attention mechanism works",
  "Show how a neural network learns with backpropagation",
  "Explain how a hash map works with collisions",
  "Show how binary search narrows down a target",
  "Explain how TCP three-way handshake works",
  "Show how garbage collection works in memory",
  "Explain how public key encryption works",
];

export function TextInputPanel({ onSubmit, loading }: TextInputPanelProps) {
  const [text, setText] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (loading) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    onSubmit(trimmed);
  };

  return (
    <>
      <div className="p-4 border-b border-zinc-700">
        <h1 className="text-lg font-semibold text-white">TutoReels</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Describe a concept and get an explainer animation
        </p>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto min-h-0">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-zinc-300 font-medium">
              Describe your concept
            </label>
            <span
              className={`text-[10px] font-mono ${
                text.length > 1800
                  ? "text-red-400"
                  : text.length > 1000
                    ? "text-yellow-400"
                    : "text-zinc-500"
              }`}
            >
              {text.length > 0 && `${text.length}/2000`}
            </span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 2000))}
            placeholder="e.g., Explain how transformer attention works step by step..."
            rows={6}
            className="w-full bg-zinc-900 border border-zinc-600 rounded-lg p-3 text-sm text-white placeholder-zinc-500 resize-none focus:outline-none focus:border-blue-500 transition-colors"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
          />
          <p className="text-[10px] text-zinc-600 mt-1">
            Cmd+Enter to submit
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!text.trim() || loading}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-600 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="opacity-25"
                />
                <path
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  className="opacity-75"
                />
              </svg>
              Generating... {elapsed > 0 && `(${elapsed}s)`}
            </>
          ) : (
            "Generate Animation"
          )}
        </button>

        {loading && (
          <p className="text-[10px] text-zinc-500 text-center -mt-2">
            Usually takes 10-20 seconds
          </p>
        )}

        <div>
          <p className="text-xs text-zinc-500 mb-2">Try an example:</p>
          <div className="flex flex-col gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setText(s)}
                disabled={loading}
                className="text-left text-xs text-zinc-400 hover:text-blue-400 disabled:opacity-50 p-2 rounded hover:bg-zinc-700/50 transition-colors leading-snug"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
