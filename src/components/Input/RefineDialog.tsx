"use client";

import { useState, useEffect, useRef } from "react";

interface RefineDialogProps {
  originalPrompt: string;
  hasPreviousPlan: boolean;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (comments: string) => void;
}

/**
 * Modal shown when the user clicks "Regenerate" on a demo. Asks for
 * incremental change comments instead of throwing the previous plan away.
 *
 * The comments are sent to /api/refine-plan along with the previous plan
 * (if any) to produce a revised plan, which then opens in PlanReview.
 */
export function RefineDialog({
  originalPrompt,
  hasPreviousPlan,
  loading,
  onCancel,
  onSubmit,
}: RefineDialogProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    onSubmit(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-700">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" className="text-amber-400">
              <path d="M2 2v5h5L5.05 5.05A5.5 5.5 0 0 1 13.5 8 5.5 5.5 0 1 1 2.05 6.23L.93 5.36A7 7 0 1 0 15 8a7 7 0 0 0-12.55-4.2L2 2z" />
            </svg>
            <h2 className="text-base font-semibold text-white">Refine Animation</h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
            {hasPreviousPlan
              ? "What would you like to change? Your existing plan will be modified incrementally — components, steps, and timings you don't mention will be preserved."
              : "Tell me what you'd like in the animation. I'll generate a fresh plan based on your preferences."}
          </p>
          <div className="mt-3 px-3 py-2 bg-zinc-800/60 border border-zinc-700/60 rounded-md">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Original concept</p>
            <p className="text-xs text-zinc-300 leading-snug">{originalPrompt}</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <label className="text-xs text-zinc-400 mb-1.5 font-medium block">
            {hasPreviousPlan ? "Changes to apply" : "Preferences"}
          </label>
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 2000))}
            disabled={loading}
            placeholder={
              hasPreviousPlan
                ? "e.g. Add a step showing the bias term. Make the inputs blue. Remove the activation function box."
                : "e.g. Use 4 input nodes. Show backpropagation at the end. Use red for errors."
            }
            rows={6}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 leading-relaxed resize-none focus:outline-none focus:border-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
            spellCheck={true}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
              if (e.key === "Escape") onCancel();
            }}
          />
          <p className="text-[10px] text-zinc-600 mt-1.5">
            {text.length}/2000 · Cmd+Enter to submit · Esc to cancel
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
            onClick={submit}
            disabled={loading || text.trim().length === 0}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-md text-white transition-colors"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" className="opacity-75" />
                </svg>
                Refining...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M13.5 8a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0zm-7-3.5a.5.5 0 0 0-1 0v3a.5.5 0 0 0 .146.354l1.5 1.5a.5.5 0 0 0 .708-.708L6.5 7.293V4.5z" />
                </svg>
                {hasPreviousPlan ? "Refine Plan" : "Generate Plan"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
