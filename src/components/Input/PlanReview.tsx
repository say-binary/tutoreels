"use client";

import { useState, useEffect } from "react";

interface PlanReviewProps {
  description: string;
  plan: string;
  loading: boolean;
  onCancel: () => void;
  onAccept: (editedPlan: string) => void;
}

/**
 * Full-screen modal shown between the user submitting a concept and the
 * animation being generated. Displays the LLM-produced plan in an editable
 * textarea so the user can tweak components, steps, timings, or values
 * before committing to animation generation.
 *
 * The modal opens at a comfortable large size and can be toggled to
 * full-screen via the maximize button. The Cancel / X button collapses
 * (closes) the modal entirely.
 */
export function PlanReview({ description, plan, loading, onCancel, onAccept }: PlanReviewProps) {
  const [text, setText] = useState(plan);
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    setText(plan);
  }, [plan]);

  // Allow Esc to close.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [loading, onCancel]);

  const sizeClasses = maximized
    ? "w-[98vw] h-[96vh] max-w-none max-h-none"
    : "w-full max-w-5xl h-[88vh] max-h-[88vh]";

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className={`bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl flex flex-col ${sizeClasses}`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-700 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400 shrink-0">
                <path d="M3 2.5h10v11H3z" />
                <path d="M5 5.5h6M5 8h6M5 10.5h4" />
              </svg>
              <h2 className="text-base font-semibold text-white">Review Animation Plan</h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Edit the plan below, then click <span className="text-blue-400 font-medium">Create Animation</span>.
              This plan will be converted <em>exactly</em> into the final animation.
            </p>
            <div className="mt-3 px-3 py-2 bg-zinc-800/60 border border-zinc-700/60 rounded-md">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Your prompt</p>
              <p className="text-xs text-zinc-300 leading-snug">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setMaximized((m) => !m)}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
              title={maximized ? "Restore size" : "Maximize"}
              aria-label={maximized ? "Restore size" : "Maximize"}
            >
              {maximized ? (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5 5h6v6H5z" />
                  <path d="M2 5V2h3M14 5V2h-3M2 11v3h3M14 11v3h-3" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 2h5M2 2v5M14 2H9M14 2v5M2 14h5M2 14V9M14 14H9M14 14V9" />
                </svg>
              )}
            </button>
            <button
              onClick={onCancel}
              disabled={loading}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors disabled:opacity-50"
              title="Close"
              aria-label="Close"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body — editable textarea, takes all remaining vertical space */}
        <div className="flex-1 px-6 py-4 min-h-0 flex flex-col">
          <label className="text-xs text-zinc-400 mb-1.5 font-medium">Plan</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading}
            className="flex-1 w-full bg-zinc-950 border border-zinc-700 rounded-lg p-4 text-sm font-mono text-zinc-200 leading-relaxed resize-none focus:outline-none focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
            placeholder="Generating plan..."
            spellCheck={false}
          />
          <p className="text-[10px] text-zinc-600 mt-1.5">
            {text.length} characters · Tip: edit component names, add steps, or change timings before accepting · Esc to close
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-700 flex items-center justify-between gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-md transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onAccept(text.trim())}
            disabled={loading || text.trim().length === 0}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-md text-white transition-colors"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" className="opacity-75" />
                </svg>
                Creating...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0a.75.75 0 01.75.75v6.5h6.5a.75.75 0 010 1.5h-6.5v6.5a.75.75 0 01-1.5 0v-6.5H.75a.75.75 0 010-1.5h6.5V.75A.75.75 0 018 0z" />
                </svg>
                Create Animation
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
