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
 */
export function PlanReview({ description, plan, loading, onCancel, onAccept }: PlanReviewProps) {
  const [text, setText] = useState(plan);

  useEffect(() => {
    setText(plan);
  }, [plan]);

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-700">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400">
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

        {/* Body — editable textarea */}
        <div className="flex-1 p-6 min-h-0 flex flex-col">
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
            {text.length} characters · Tip: edit component names, add steps, or change timings before accepting.
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
