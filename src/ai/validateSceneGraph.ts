import type { SceneGraph, AssetInstance, ShapeState } from "@/types/sceneGraph";

interface ValidationError {
  severity: "error" | "warning";
  message: string;
  fix?: string; // suggestion for the LLM
}

/**
 * Programmatically validate a scene graph for layout/alignment issues.
 * Returns a list of errors that can be sent back to the LLM for fixing.
 */
export function validateSceneGraph(sg: SceneGraph): ValidationError[] {
  const errors: ValidationError[] = [];
  const assetMap = new Map<string, AssetInstance>();

  for (const asset of sg.assets) {
    assetMap.set(asset.id, asset);
  }

  // 1. Check all targetIds in timeline reference existing assets
  for (const entry of sg.timeline) {
    for (const action of entry.actions) {
      if (!assetMap.has(action.targetId)) {
        errors.push({
          severity: "error",
          message: `Timeline entry "${entry.id}" references non-existent asset "${action.targetId}"`,
          fix: `Remove this action or create an asset with id "${action.targetId}"`,
        });
      }
    }
  }

  // 2. Check shapes are within canvas bounds
  for (const asset of sg.assets) {
    const s = asset.initialState;
    if (asset.type === "arrow" || asset.type === "line") continue; // arrows use points
    const x = s.x ?? 0;
    const y = s.y ?? 0;
    if (x < 20 || x > 1260) {
      errors.push({
        severity: "warning",
        message: `Asset "${asset.id}" x=${x} is near/outside canvas edge`,
        fix: `Move x to be between 60 and 1220`,
      });
    }
    if (y < 20 || y > 700) {
      errors.push({
        severity: "warning",
        message: `Asset "${asset.id}" y=${y} is near/outside canvas edge`,
        fix: `Move y to be between 60 and 660`,
      });
    }
  }

  // 3. Check arrows connect near their source/target shapes
  for (const asset of sg.assets) {
    if (asset.type !== "arrow") continue;
    const pts = asset.initialState.points;
    if (!pts || pts.length < 4) {
      errors.push({
        severity: "error",
        message: `Arrow "${asset.id}" has missing or incomplete points array`,
        fix: `Set points to [startX, startY, endX, endY] with absolute pixel coordinates`,
      });
      continue;
    }
    // Check arrow points are within canvas
    for (let i = 0; i < pts.length; i += 2) {
      if (pts[i] < 0 || pts[i] > 1280 || pts[i + 1] < 0 || pts[i + 1] > 720) {
        errors.push({
          severity: "warning",
          message: `Arrow "${asset.id}" has points outside canvas: (${pts[i]}, ${pts[i + 1]})`,
          fix: `Keep all arrow points within 0-1280 (x) and 0-720 (y)`,
        });
      }
    }
  }

  // 4. Check for overlapping shapes (shapes at the same position)
  const positions: { id: string; x: number; y: number; type: string }[] = [];
  for (const asset of sg.assets) {
    if (asset.type === "arrow" || asset.type === "line" || asset.type === "text") continue;
    const s = asset.initialState;
    positions.push({ id: asset.id, x: s.x ?? 0, y: s.y ?? 0, type: asset.type });
  }
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const a = positions[i];
      const b = positions[j];
      const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
      if (dist < 30) {
        errors.push({
          severity: "warning",
          message: `Shapes "${a.id}" and "${b.id}" are overlapping at nearly the same position (distance: ${Math.round(dist)}px)`,
          fix: `Move them apart by at least 60px`,
        });
      }
    }
  }

  // 5. Check that shapes use the full canvas (not all crammed in one corner)
  const nonTextAssets = sg.assets.filter(
    (a) => a.type !== "arrow" && a.type !== "line" && a.type !== "text"
  );
  if (nonTextAssets.length > 3) {
    const xs = nonTextAssets.map((a) => a.initialState.x ?? 0);
    const ys = nonTextAssets.map((a) => a.initialState.y ?? 0);
    const xSpread = Math.max(...xs) - Math.min(...xs);
    const ySpread = Math.max(...ys) - Math.min(...ys);
    if (xSpread < 300 && ySpread < 200) {
      errors.push({
        severity: "error",
        message: `All shapes are clustered in a small area (${Math.round(xSpread)}x${Math.round(ySpread)}px). The canvas is 1280x720.`,
        fix: `Spread shapes across the full canvas. Use x range 100-1100 and y range 100-600.`,
      });
    }
  }

  // 6. Check timeline has sensible timing
  if (sg.timeline.length > 0) {
    const lastEntry = sg.timeline[sg.timeline.length - 1];
    const lastEndTime = lastEntry.startTime + lastEntry.duration;
    if (lastEndTime > sg.metadata.duration + 1) {
      errors.push({
        severity: "warning",
        message: `Timeline extends to ${lastEndTime}s but metadata.duration is only ${sg.metadata.duration}s`,
        fix: `Set metadata.duration to at least ${Math.ceil(lastEndTime + 2)}`,
      });
    }
  }

  // 7. Check all assets eventually get an "appear" action
  const appearedAssets = new Set<string>();
  for (const entry of sg.timeline) {
    for (const action of entry.actions) {
      if (action.type === "appear" || action.type === "drawArrow") {
        appearedAssets.add(action.targetId);
      }
    }
  }
  for (const asset of sg.assets) {
    if (!asset.visible && !appearedAssets.has(asset.id)) {
      errors.push({
        severity: "warning",
        message: `Asset "${asset.id}" is invisible and never gets an "appear" action — it will never be shown`,
        fix: `Add an "appear" action for "${asset.id}" in the timeline, or set visible: true`,
      });
    }
  }

  return errors;
}

export function formatErrorsForLLM(errors: ValidationError[]): string {
  const critical = errors.filter((e) => e.severity === "error");
  const warnings = errors.filter((e) => e.severity === "warning");

  let msg = "## Validation Errors in Your Scene Graph\n\n";

  if (critical.length > 0) {
    msg += "### CRITICAL (must fix):\n";
    for (const e of critical) {
      msg += `- ${e.message}${e.fix ? ` → FIX: ${e.fix}` : ""}\n`;
    }
  }

  if (warnings.length > 0) {
    msg += "\n### WARNINGS (should fix):\n";
    for (const e of warnings.slice(0, 8)) { // limit to avoid token bloat
      msg += `- ${e.message}${e.fix ? ` → FIX: ${e.fix}` : ""}\n`;
    }
  }

  msg += "\nPlease fix these issues and output the corrected JSON scene graph. Output ONLY the JSON.";
  return msg;
}
