import type { SceneGraph } from "@/types/sceneGraph";

/**
 * Demo: Hash Map with Collisions
 * Layout: Hash function box at top-center, bucket array on the left,
 * keys inserted on the right, arrows showing insertion + chaining.
 */

const BUCKET_X = 250;       // center x of bucket column
const BUCKET_START_Y = 200;  // center y of first bucket
const BUCKET_GAP = 70;       // vertical gap between buckets
const BUCKET_W = 160;
const BUCKET_H = 45;

function bucketY(i: number) { return BUCKET_START_Y + i * BUCKET_GAP; }

export const demoHashMap: SceneGraph = {
  metadata: {
    title: "How a Hash Map Works with Collisions",
    description: "Shows key insertion, hashing, bucket placement, and collision resolution via chaining",
    duration: 28,
    canvasWidth: 1280,
    canvasHeight: 720,
    backgroundColor: "#1a1a2e",
  },
  assets: [
    // Title
    { id: "title", type: "text", initialState: { x: 350, y: 30, text: "Hash Map: Insertion & Collision Handling", fontSize: 26, fill: "#FFFFFF" }, visible: false },

    // Bucket labels (index 0-5)
    ...[0, 1, 2, 3, 4, 5].map(i => ({
      id: `bucket_${i}`,
      type: "roundedRect" as const,
      initialState: {
        x: BUCKET_X,
        y: bucketY(i),
        width: BUCKET_W,
        height: BUCKET_H,
        fill: "#2C3E50",
        stroke: "#4A90D9",
        strokeWidth: 2,
        cornerRadius: 6,
      },
      visible: false,
    })),

    // Bucket index labels
    ...[0, 1, 2, 3, 4, 5].map(i => ({
      id: `bidx_${i}`,
      type: "text" as const,
      initialState: { x: BUCKET_X - BUCKET_W / 2 - 30, y: bucketY(i) - 8, text: `[${i}]`, fontSize: 14, fill: "#95A5A6" },
      visible: false,
    })),

    // Hash function box
    { id: "hash_fn", type: "roundedRect", initialState: { x: 640, y: 130, width: 180, height: 50, fill: "#9B59B6", stroke: "#FFFFFF", strokeWidth: 2, cornerRadius: 10 }, visible: false },
    { id: "hash_fn_label", type: "text", initialState: { x: 580, y: 120, text: "hash(key) % 6", fontSize: 16, fill: "#FFFFFF" }, visible: false },

    // Key 1: "apple" → bucket 2
    { id: "key_apple", type: "textBox", initialState: { x: 900, y: 200, width: 120, height: 36, fill: "#1E2A3A", stroke: "#50C878", text: '"apple"', fontSize: 14 }, visible: false },
    { id: "arrow_apple_hash", type: "arrow", initialState: { x: 0, y: 0, points: [840, 200, 730, 145], stroke: "#50C878", strokeWidth: 2 }, visible: false },
    { id: "arrow_apple_bucket", type: "arrow", initialState: { x: 0, y: 0, points: [550, 145, 330, bucketY(2)], stroke: "#50C878", strokeWidth: 2 }, visible: false },
    { id: "val_apple", type: "textBox", initialState: { x: BUCKET_X + 30, y: bucketY(2), width: 100, height: 30, fill: "#1a3a2e", stroke: "#50C878", text: "apple:5", fontSize: 12 }, visible: false },

    // Key 2: "banana" → bucket 4
    { id: "key_banana", type: "textBox", initialState: { x: 900, y: 300, width: 120, height: 36, fill: "#1E2A3A", stroke: "#E6A817", text: '"banana"', fontSize: 14 }, visible: false },
    { id: "arrow_banana_hash", type: "arrow", initialState: { x: 0, y: 0, points: [840, 300, 730, 155], stroke: "#E6A817", strokeWidth: 2 }, visible: false },
    { id: "arrow_banana_bucket", type: "arrow", initialState: { x: 0, y: 0, points: [550, 155, 330, bucketY(4)], stroke: "#E6A817", strokeWidth: 2 }, visible: false },
    { id: "val_banana", type: "textBox", initialState: { x: BUCKET_X + 30, y: bucketY(4), width: 100, height: 30, fill: "#3a3a1e", stroke: "#E6A817", text: "banana:3", fontSize: 12 }, visible: false },

    // Key 3: "cherry" → bucket 2 (COLLISION!)
    { id: "key_cherry", type: "textBox", initialState: { x: 900, y: 400, width: 120, height: 36, fill: "#1E2A3A", stroke: "#E74C3C", text: '"cherry"', fontSize: 14 }, visible: false },
    { id: "arrow_cherry_hash", type: "arrow", initialState: { x: 0, y: 0, points: [840, 400, 730, 160], stroke: "#E74C3C", strokeWidth: 2 }, visible: false },
    { id: "arrow_cherry_bucket", type: "arrow", initialState: { x: 0, y: 0, points: [550, 160, 330, bucketY(2)], stroke: "#E74C3C", strokeWidth: 2 }, visible: false },
    { id: "collision_label", type: "text", initialState: { x: 350, y: bucketY(2) - 40, text: "COLLISION!", fontSize: 18, fill: "#E74C3C" }, visible: false },
    // Chain: cherry links after apple — arrow from bottom of apple box to top of cherry box
    { id: "chain_arrow", type: "arrow", initialState: { x: 0, y: 0, points: [BUCKET_X + 30, bucketY(2) + 15, BUCKET_X + 30, bucketY(2) + 40], stroke: "#E74C3C", strokeWidth: 2 }, visible: false },
    { id: "val_cherry", type: "textBox", initialState: { x: BUCKET_X + 30, y: bucketY(2) + 55, width: 100, height: 30, fill: "#3a1e1e", stroke: "#E74C3C", text: "cherry:7", fontSize: 12 }, visible: false },

    // Step description
    { id: "step_text", type: "text", initialState: { x: 500, y: 620, text: "", fontSize: 16, fill: "#B0BEC5" }, visible: false },
  ],
  timeline: [
    // Show title and buckets
    { id: "show_title", startTime: 0, duration: 1, actions: [
      { targetId: "title", type: "appear", effect: "fade" },
      { targetId: "step_text", type: "appear", effect: "fade" },
    ]},
    { id: "show_buckets", startTime: 1.5, duration: 1, actions: [
      ...[0, 1, 2, 3, 4, 5].flatMap(i => [
        { targetId: `bucket_${i}`, type: "appear" as const, effect: "scale" as const },
        { targetId: `bidx_${i}`, type: "appear" as const, effect: "fade" as const },
      ]),
      { targetId: "step_text", type: "setText", text: "Step 1: Start with an array of 6 empty buckets" },
    ]},

    // Show hash function
    { id: "show_hash", startTime: 3.5, duration: 0.8, actions: [
      { targetId: "hash_fn", type: "appear", effect: "scale" },
      { targetId: "hash_fn_label", type: "appear", effect: "fade" },
      { targetId: "step_text", type: "setText", text: "Step 2: The hash function maps keys to bucket indices" },
    ]},

    // Insert "apple" → bucket 2
    { id: "insert_apple", startTime: 5.5, duration: 0.8, actions: [
      { targetId: "key_apple", type: "appear", effect: "slide" },
      { targetId: "step_text", type: "setText", text: 'Step 3: Insert "apple" → hash("apple") % 6 = 2' },
    ]},
    { id: "apple_to_hash", startTime: 7, duration: 0.8, actions: [
      { targetId: "arrow_apple_hash", type: "drawArrow" },
    ]},
    { id: "apple_to_bucket", startTime: 8, duration: 0.8, actions: [
      { targetId: "arrow_apple_bucket", type: "drawArrow" },
      { targetId: "bucket_2", type: "highlight", color: "#50C878" },
    ]},
    { id: "apple_placed", startTime: 9, duration: 0.6, actions: [
      { targetId: "val_apple", type: "appear", effect: "fade" },
    ]},

    // Insert "banana" → bucket 4
    { id: "insert_banana", startTime: 10.5, duration: 0.8, actions: [
      { targetId: "key_banana", type: "appear", effect: "slide" },
      { targetId: "step_text", type: "setText", text: 'Step 4: Insert "banana" → hash("banana") % 6 = 4' },
    ]},
    { id: "banana_to_hash", startTime: 11.5, duration: 0.8, actions: [
      { targetId: "arrow_banana_hash", type: "drawArrow" },
    ]},
    { id: "banana_to_bucket", startTime: 12.5, duration: 0.8, actions: [
      { targetId: "arrow_banana_bucket", type: "drawArrow" },
      { targetId: "bucket_4", type: "highlight", color: "#E6A817" },
    ]},
    { id: "banana_placed", startTime: 13.5, duration: 0.6, actions: [
      { targetId: "val_banana", type: "appear", effect: "fade" },
    ]},

    // Insert "cherry" → bucket 2 (COLLISION)
    { id: "insert_cherry", startTime: 15.5, duration: 0.8, actions: [
      { targetId: "key_cherry", type: "appear", effect: "slide" },
      { targetId: "step_text", type: "setText", text: 'Step 5: Insert "cherry" → hash("cherry") % 6 = 2... Collision!' },
    ]},
    { id: "cherry_to_hash", startTime: 16.5, duration: 0.8, actions: [
      { targetId: "arrow_cherry_hash", type: "drawArrow" },
    ]},
    { id: "cherry_collision", startTime: 17.5, duration: 0.8, actions: [
      { targetId: "arrow_cherry_bucket", type: "drawArrow" },
      { targetId: "bucket_2", type: "highlight", color: "#E74C3C" },
      { targetId: "collision_label", type: "appear", effect: "scale", easing: "bounceOut" },
    ]},

    // Resolve via chaining
    { id: "chain", startTime: 19.5, duration: 1, actions: [
      { targetId: "step_text", type: "setText", text: "Step 6: Resolve collision by chaining — link cherry after apple" },
      { targetId: "chain_arrow", type: "drawArrow" },
      { targetId: "val_cherry", type: "appear", effect: "fade" },
      { targetId: "collision_label", type: "disappear", effect: "fade" },
    ]},

    // Summary
    { id: "summary", startTime: 22, duration: 0.5, actions: [
      { targetId: "step_text", type: "setText", text: "Hash maps use hash functions for O(1) average lookup. Collisions are resolved by chaining." },
    ]},
  ],
};
