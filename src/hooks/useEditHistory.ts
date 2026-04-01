import { useCallback, useRef, useState } from "react";
import type { ShapeState } from "@/types/sceneGraph";

export type EditSnapshot = Map<string, Partial<ShapeState>>;

/**
 * Full undo/redo history for edit mode.
 * Snapshot-based: each entry is a complete Map of overrides.
 */
export function useEditHistory() {
  const [overrides, setOverrides] = useState<EditSnapshot>(new Map());
  const historyRef = useRef<EditSnapshot[]>([new Map()]);
  const stepRef = useRef(0);
  const [, forceRender] = useState(0); // forces re-render so canUndo/canRedo update

  const canUndo = stepRef.current > 0;
  const canRedo = stepRef.current < historyRef.current.length - 1;

  const applyEdit = useCallback((updater: (prev: EditSnapshot) => EditSnapshot) => {
    const current = historyRef.current[stepRef.current];
    const next = updater(new Map(current));

    historyRef.current = historyRef.current.slice(0, stepRef.current + 1);
    historyRef.current.push(next);
    stepRef.current = historyRef.current.length - 1;
    setOverrides(next);
    forceRender((n) => n + 1);
  }, []);

  const undo = useCallback(() => {
    if (stepRef.current <= 0) return;
    stepRef.current--;
    setOverrides(new Map(historyRef.current[stepRef.current]));
    forceRender((n) => n + 1);
  }, []);

  const redo = useCallback(() => {
    if (stepRef.current >= historyRef.current.length - 1) return;
    stepRef.current++;
    setOverrides(new Map(historyRef.current[stepRef.current]));
    forceRender((n) => n + 1);
  }, []);

  const resetHistory = useCallback(() => {
    historyRef.current = [new Map()];
    stepRef.current = 0;
    setOverrides(new Map());
    forceRender((n) => n + 1);
  }, []);

  return { overrides, applyEdit, undo, redo, canUndo, canRedo, resetHistory };
}
