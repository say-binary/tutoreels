"use client";

import type { AssetType } from "@/types/sceneGraph";
import type { ComputedAssetState } from "@/engine/AnimationEngine";
import {
  RectShape,
  RoundedRectShape,
  CircleShape,
  EllipseShape,
  LineShape,
} from "./shapes/BasicShapes";
import { ArrowShape } from "./shapes/Arrows";
import { TextShape, TextBoxShape } from "./shapes/TextLabel";
import { ContainerShape } from "./shapes/Container";
import { StarShape, PolygonShape, DiamondShape } from "./shapes/AdvancedShapes";

export interface AssetDefinition {
  type: AssetType;
  displayName: string;
  description: string;
  component: React.FC<{ state: ComputedAssetState }>;
}

const definitions: AssetDefinition[] = [
  {
    type: "rect",
    displayName: "Rectangle",
    description: "A rectangle. Use for blocks, layers, data containers.",
    component: RectShape,
  },
  {
    type: "roundedRect",
    displayName: "Rounded Rectangle",
    description: "A rectangle with rounded corners. Use for cards, buttons, styled containers.",
    component: RoundedRectShape,
  },
  {
    type: "circle",
    displayName: "Circle",
    description: "A circle. Use for nodes, neurons, data points.",
    component: CircleShape,
  },
  {
    type: "ellipse",
    displayName: "Ellipse",
    description: "An ellipse. Use for grouped concepts, cloud shapes.",
    component: EllipseShape,
  },
  {
    type: "arrow",
    displayName: "Arrow",
    description: "A directional arrow. Use for data flow, connections, transformations between shapes.",
    component: ArrowShape,
  },
  {
    type: "line",
    displayName: "Line",
    description: "A simple line. Use for separators, connections without direction.",
    component: LineShape,
  },
  {
    type: "text",
    displayName: "Text",
    description: "A text label. Use for titles, annotations, step descriptions.",
    component: TextShape,
  },
  {
    type: "textBox",
    displayName: "Text Box",
    description: "Text inside a rounded box. Use for labeled components, values, variables.",
    component: TextBoxShape,
  },
  {
    type: "container",
    displayName: "Container",
    description: "A dashed border container with a label. Use to group related elements.",
    component: ContainerShape,
  },
  {
    type: "star",
    displayName: "Star",
    description: "A star shape. Use for highlights, important markers, ratings. Properties: numPoints (default 5), innerRadius, radius.",
    component: StarShape,
  },
  {
    type: "polygon",
    displayName: "Polygon",
    description: "A regular polygon (hexagon, pentagon, etc). Use for process steps, state machines. Properties: numPoints (number of sides, default 6), radius.",
    component: PolygonShape,
  },
  {
    type: "diamond",
    displayName: "Diamond",
    description: "A diamond / rhombus. Use for decision points, conditional logic, branching.",
    component: DiamondShape,
  },
];

export const assetRegistry = new Map<AssetType, AssetDefinition>(
  definitions.map((d) => [d.type, d])
);

export function getAssetCatalog(): string {
  return definitions
    .map(
      (d) =>
        `- type: "${d.type}" (${d.displayName}): ${d.description}`
    )
    .join("\n");
}
