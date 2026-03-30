import { z } from "zod";

const AssetTypeEnum = z.enum([
  "rect",
  "roundedRect",
  "circle",
  "ellipse",
  "arrow",
  "line",
  "text",
  "textBox",
  "container",
  "star",
  "polygon",
  "diamond",
]);

const EasingTypeEnum = z.enum([
  "linear",
  "easeIn",
  "easeOut",
  "easeInOut",
  "backOut",
  "bounceOut",
  "elastic",
]);

const ActionTypeEnum = z.enum([
  "appear",
  "disappear",
  "moveTo",
  "morphTo",
  "highlight",
  "drawArrow",
  "setText",
]);

const AppearEffectEnum = z.enum(["fade", "scale", "slide"]);

const GradientSpecSchema = z.object({
  type: z.literal("linear"),
  startColor: z.string(),
  endColor: z.string(),
  angle: z.number().optional(),
});

const ShapeStateSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  radius: z.number().optional(),
  scaleX: z.number().optional(),
  scaleY: z.number().optional(),
  rotation: z.number().optional(),
  opacity: z.number().min(0).max(1).optional(),
  fill: z.string().optional(),
  stroke: z.string().optional(),
  strokeWidth: z.number().optional(),
  text: z.string().optional(),
  fontSize: z.number().optional(),
  fontStyle: z.string().optional(),
  points: z.array(z.number()).optional(),
  cornerRadius: z.number().optional(),

  // Shadows
  shadowColor: z.string().optional(),
  shadowBlur: z.number().optional(),
  shadowOffsetX: z.number().optional(),
  shadowOffsetY: z.number().optional(),
  shadowOpacity: z.number().min(0).max(1).optional(),

  // Gradients
  gradient: GradientSpecSchema.optional(),

  // Dash pattern
  dash: z.array(z.number()).optional(),

  // Advanced shapes
  numPoints: z.number().optional(),
  innerRadius: z.number().optional(),
});

const AssetInstanceSchema = z.object({
  id: z.string(),
  type: AssetTypeEnum,
  label: z.string().optional(),
  initialState: ShapeStateSchema,
  visible: z.boolean(),
});

const AnimationActionSchema = z.object({
  targetId: z.string(),
  type: ActionTypeEnum,
  toState: ShapeStateSchema.partial().optional(),
  effect: AppearEffectEnum.optional(),
  easing: EasingTypeEnum.optional(),
  color: z.string().optional(),
  text: z.string().optional(),
});

const TimelineEntrySchema = z.object({
  id: z.string(),
  startTime: z.number(),
  duration: z.number(),
  parallel: z.boolean().optional(),
  actions: z.array(AnimationActionSchema),
});

export const SceneGraphSchema = z.object({
  metadata: z.object({
    title: z.string(),
    description: z.string(),
    duration: z.number(),
    canvasWidth: z.number(),
    canvasHeight: z.number(),
    backgroundColor: z.string(),
  }),
  assets: z.array(AssetInstanceSchema),
  timeline: z.array(TimelineEntrySchema),
});

export type SceneGraphZod = z.infer<typeof SceneGraphSchema>;

export const sceneGraphJsonSchema = z.toJSONSchema(SceneGraphSchema, {
  target: "draft-7",
});
