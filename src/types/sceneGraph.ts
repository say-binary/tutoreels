export type AssetType =
  | "rect"
  | "roundedRect"
  | "circle"
  | "ellipse"
  | "arrow"
  | "line"
  | "text"
  | "textBox"
  | "container"
  | "star"
  | "polygon"
  | "diamond";

export type EasingType =
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "backOut"
  | "bounceOut"
  | "elastic";

export type ActionType =
  | "appear"
  | "disappear"
  | "moveTo"
  | "morphTo"
  | "highlight"
  | "drawArrow"
  | "setText";

export type AppearEffect = "fade" | "scale" | "slide";

export interface GradientSpec {
  type: "linear";
  startColor: string;
  endColor: string;
  angle?: number; // degrees, default 0 (left-to-right)
}

export interface ShapeState {
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  opacity?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  text?: string;
  fontSize?: number;
  fontStyle?: string;
  points?: number[];
  cornerRadius?: number;
  visible?: boolean;

  // Shadows
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowOpacity?: number;

  // Gradients
  gradient?: GradientSpec;

  // Dash pattern
  dash?: number[];

  // Advanced shapes
  numPoints?: number;
  innerRadius?: number;
}

export interface AssetInstance {
  id: string;
  type: AssetType;
  label?: string;
  initialState: ShapeState;
  visible: boolean;
}

export interface AnimationAction {
  targetId: string;
  type: ActionType;
  toState?: Partial<ShapeState>;
  effect?: AppearEffect;
  easing?: EasingType;
  color?: string;
  text?: string;
}

export interface TimelineEntry {
  id: string;
  startTime: number;
  duration: number;
  parallel?: boolean;
  actions: AnimationAction[];
}

export interface SceneGraphMetadata {
  title: string;
  description: string;
  duration: number;
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
}

export interface SceneGraph {
  metadata: SceneGraphMetadata;
  assets: AssetInstance[];
  timeline: TimelineEntry[];
}
