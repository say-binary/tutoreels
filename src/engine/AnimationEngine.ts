import type {
  SceneGraph,
  ShapeState,
  TimelineEntry,
  AnimationAction,
  GradientSpec,
} from "@/types/sceneGraph";
import { getEasing, interpolateNumber, interpolateColor } from "./Interpolators";

export interface ComputedAssetState extends ShapeState {
  visible: boolean;
}

const NUMERIC_KEYS: (keyof ShapeState)[] = [
  "x",
  "y",
  "width",
  "height",
  "radius",
  "scaleX",
  "scaleY",
  "rotation",
  "opacity",
  "strokeWidth",
  "fontSize",
  "cornerRadius",
  // Shadows
  "shadowBlur",
  "shadowOffsetX",
  "shadowOffsetY",
  "shadowOpacity",
  // Advanced shapes
  "numPoints",
  "innerRadius",
];

const COLOR_KEYS: (keyof ShapeState)[] = ["fill", "stroke", "shadowColor"];

export class AnimationEngine {
  private sceneGraph: SceneGraph;

  constructor(sceneGraph: SceneGraph) {
    this.sceneGraph = sceneGraph;
  }

  setSceneGraph(sg: SceneGraph) {
    this.sceneGraph = sg;
  }

  computeStates(currentTime: number): Map<string, ComputedAssetState> {
    const states = new Map<string, ComputedAssetState>();

    for (const asset of this.sceneGraph.assets) {
      const base: ComputedAssetState = {
        ...asset.initialState,
        opacity: asset.initialState.opacity ?? (asset.visible ? 1 : 0),
        visible: asset.visible,
      };
      states.set(asset.id, base);
    }

    // Resolve timeline entries to absolute start times
    const resolved = this.resolveTimeline();

    for (const { entry, absoluteStart } of resolved) {
      const entryEnd = absoluteStart + entry.duration;

      for (const action of entry.actions) {
        const state = states.get(action.targetId);
        if (!state) continue;

        if (currentTime < absoluteStart) continue;

        const progress = Math.min(
          1,
          entry.duration > 0
            ? (currentTime - absoluteStart) / entry.duration
            : 1
        );

        const eased = getEasing(action.easing)(progress);
        this.applyAction(state, action, eased, currentTime >= entryEnd);
      }
    }

    return states;
  }

  private resolveTimeline(): {
    entry: TimelineEntry;
    absoluteStart: number;
  }[] {
    const resolved: { entry: TimelineEntry; absoluteStart: number }[] = [];
    let runningTime = 0;

    for (const entry of this.sceneGraph.timeline) {
      const absoluteStart = entry.parallel ? runningTime : entry.startTime;
      resolved.push({ entry, absoluteStart });
      if (!entry.parallel) {
        runningTime = entry.startTime + entry.duration;
      }
    }

    return resolved;
  }

  private interpolateGradient(
    from: GradientSpec | undefined,
    to: GradientSpec | undefined,
    progress: number
  ): GradientSpec | undefined {
    if (!to) return from;
    if (!from) return to;

    return {
      type: "linear",
      startColor: interpolateColor(from.startColor, to.startColor, progress),
      endColor: interpolateColor(from.endColor, to.endColor, progress),
      angle: interpolateNumber(from.angle ?? 0, to.angle ?? 0, progress),
    };
  }

  private applyAction(
    state: ComputedAssetState,
    action: AnimationAction,
    progress: number,
    completed: boolean
  ) {
    switch (action.type) {
      case "appear": {
        const effect = action.effect ?? "fade";
        if (effect === "fade") {
          state.opacity = progress;
        } else if (effect === "scale") {
          state.opacity = progress;
          state.scaleX = progress;
          state.scaleY = progress;
        } else if (effect === "slide") {
          state.opacity = progress;
          const baseX = action.toState?.x ?? state.x;
          state.x = interpolateNumber(baseX - 50, baseX, progress);
        }
        state.visible = true;
        break;
      }

      case "disappear": {
        const effect = action.effect ?? "fade";
        if (effect === "fade") {
          state.opacity = 1 - progress;
        } else if (effect === "scale") {
          state.opacity = 1 - progress;
          state.scaleX = 1 - progress;
          state.scaleY = 1 - progress;
        }
        if (completed) state.visible = false;
        break;
      }

      case "moveTo":
      case "morphTo": {
        if (!action.toState) break;
        const snapshot = { ...state };
        for (const key of NUMERIC_KEYS) {
          const to = action.toState[key];
          if (to !== undefined && typeof to === "number") {
            const from = snapshot[key];
            if (typeof from === "number") {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (state as any)[key] = interpolateNumber(from, to, progress);
            } else {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (state as any)[key] = to;
            }
          }
        }
        for (const key of COLOR_KEYS) {
          const to = action.toState[key];
          if (to !== undefined && typeof to === "string") {
            const from = snapshot[key];
            if (typeof from === "string") {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (state as any)[key] = interpolateColor(from, to, progress);
            } else {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (state as any)[key] = to;
            }
          }
        }
        // Interpolate points array (for arrows/lines moving)
        if (action.toState.points && Array.isArray(action.toState.points) && Array.isArray(snapshot.points)) {
          const fromPts = snapshot.points;
          const toPts = action.toState.points;
          const len = Math.min(fromPts.length, toPts.length);
          const interpolated: number[] = [];
          for (let i = 0; i < len; i++) {
            interpolated.push(interpolateNumber(fromPts[i], toPts[i], progress));
          }
          state.points = interpolated;
        } else if (action.toState.points && completed) {
          state.points = action.toState.points;
        }

        // Interpolate gradient if present
        if (action.toState.gradient) {
          state.gradient = this.interpolateGradient(
            snapshot.gradient,
            action.toState.gradient,
            progress
          );
        }
        if (action.toState.text !== undefined && completed) {
          state.text = action.toState.text;
        }
        break;
      }

      case "highlight": {
        const pulseColor = action.color ?? "#FFD700";
        const originalFill = state.fill ?? "#cccccc";
        if (progress < 0.5) {
          state.fill = interpolateColor(originalFill, pulseColor, progress * 2);
        } else {
          state.fill = interpolateColor(pulseColor, originalFill, (progress - 0.5) * 2);
        }
        break;
      }

      case "drawArrow": {
        if (state.points && state.points.length >= 4) {
          const totalPoints = state.points.length;
          const visibleCount = Math.max(
            4,
            Math.floor((totalPoints / 2) * progress) * 2
          );
          state.points = state.points.slice(0, visibleCount);
        }
        state.opacity = progress;
        state.visible = true;
        break;
      }

      case "setText": {
        if (action.text !== undefined) {
          state.text = action.text;
          state.opacity = progress;
        }
        break;
      }
    }
  }
}
