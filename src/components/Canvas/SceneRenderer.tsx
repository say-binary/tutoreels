"use client";

import type { AssetInstance } from "@/types/sceneGraph";
import type { ComputedAssetState } from "@/engine/AnimationEngine";
import { assetRegistry } from "@/assets/registry";

interface SceneRendererProps {
  assets: AssetInstance[];
  states: Map<string, ComputedAssetState>;
}

export function SceneRenderer({ assets, states }: SceneRendererProps) {
  return (
    <>
      {assets.map((asset) => {
        const state = states.get(asset.id);
        if (!state) return null;
        if (!state.visible && (state.opacity === undefined || state.opacity <= 0))
          return null;

        const def = assetRegistry.get(asset.type);
        if (!def) return null;

        const Component = def.component;
        return <Component key={asset.id} state={state} />;
      })}
    </>
  );
}
