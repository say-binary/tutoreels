import type { SceneGraph } from "@/types/sceneGraph";

/**
 * Demo: Binary Search
 * Layout: Title at top, array of 8 boxes in a row centered at y=250,
 * low/mid/high pointers below, target box on the right.
 * Animation shows narrowing the search range.
 */

const ARRAY = [3, 7, 12, 19, 24, 31, 42, 55];
const TARGET = 31;
const BOX_W = 80;
const BOX_H = 50;
const GAP = 10;
const TOTAL_W = ARRAY.length * (BOX_W + GAP) - GAP; // 710
const START_X = (1280 - TOTAL_W) / 2 + BOX_W / 2; // center of first box

function boxCenter(i: number) {
  return START_X + i * (BOX_W + GAP);
}

export const demoBinarySearch: SceneGraph = {
  metadata: {
    title: "Binary Search: Finding 31",
    description: "Shows how binary search narrows down the search range step by step",
    duration: 24,
    canvasWidth: 1280,
    canvasHeight: 720,
    backgroundColor: "#1a1a2e",
  },
  assets: [
    // Title
    { id: "title", type: "text", initialState: { x: 380, y: 40, text: "Binary Search: Finding 31 in a Sorted Array", fontSize: 26, fill: "#FFFFFF" }, visible: false },

    // Array boxes - 8 elements
    ...ARRAY.map((val, i) => ({
      id: `box_${i}`,
      type: "roundedRect" as const,
      initialState: {
        x: boxCenter(i),
        y: 250,
        width: BOX_W,
        height: BOX_H,
        fill: "#2C3E50",
        stroke: "#4A90D9",
        strokeWidth: 2,
        cornerRadius: 6,
      },
      visible: false,
    })),

    // Array value labels
    ...ARRAY.map((val, i) => ({
      id: `val_${i}`,
      type: "text" as const,
      initialState: {
        x: boxCenter(i) - 10,
        y: 240,
        text: String(val),
        fontSize: 18,
        fill: "#FFFFFF",
      },
      visible: false,
    })),

    // Index labels below boxes
    ...ARRAY.map((_, i) => ({
      id: `idx_${i}`,
      type: "text" as const,
      initialState: {
        x: boxCenter(i) - 4,
        y: 282,
        text: String(i),
        fontSize: 12,
        fill: "#666666",
      },
      visible: false,
    })),

    // Target box
    { id: "target_box", type: "textBox", initialState: { x: 1100, y: 250, width: 120, height: 40, fill: "#2C3E50", stroke: "#E6A817", text: `Target: ${TARGET}`, fontSize: 16 }, visible: false },

    // Pointer labels (low, mid, high) - these will move
    { id: "ptr_low", type: "text", initialState: { x: boxCenter(0) - 12, y: 320, text: "low", fontSize: 14, fill: "#50C878" }, visible: false },
    { id: "ptr_high", type: "text", initialState: { x: boxCenter(7) - 14, y: 320, text: "high", fontSize: 14, fill: "#E74C3C" }, visible: false },
    { id: "ptr_mid", type: "text", initialState: { x: boxCenter(3) - 12, y: 320, text: "mid", fontSize: 14, fill: "#E6A817" }, visible: false },

    // Pointer arrows
    { id: "arr_low", type: "arrow", initialState: { x: 0, y: 0, points: [boxCenter(0), 310, boxCenter(0), 280], stroke: "#50C878", strokeWidth: 2 }, visible: false },
    { id: "arr_high", type: "arrow", initialState: { x: 0, y: 0, points: [boxCenter(7), 310, boxCenter(7), 280], stroke: "#E74C3C", strokeWidth: 2 }, visible: false },
    { id: "arr_mid", type: "arrow", initialState: { x: 0, y: 0, points: [boxCenter(3), 310, boxCenter(3), 280], stroke: "#E6A817", strokeWidth: 2 }, visible: false },

    // Step description
    { id: "step_text", type: "text", initialState: { x: 300, y: 420, text: "", fontSize: 18, fill: "#B0BEC5" }, visible: false },

    // Comparison result
    { id: "compare_text", type: "text", initialState: { x: 350, y: 470, text: "", fontSize: 16, fill: "#E6A817" }, visible: false },

    // "Found!" label
    { id: "found_label", type: "text", initialState: { x: boxCenter(5) - 28, y: 170, text: "FOUND!", fontSize: 24, fill: "#50C878" }, visible: false },
  ],
  timeline: [
    // Step 1: Show title and array
    { id: "show_title", startTime: 0, duration: 1, actions: [
      { targetId: "title", type: "appear", effect: "fade" },
      { targetId: "step_text", type: "appear", effect: "fade" },
      { targetId: "compare_text", type: "appear", effect: "fade" },
    ]},
    { id: "show_array", startTime: 1.5, duration: 0.8, actions: [
      ...ARRAY.flatMap((_, i) => [
        { targetId: `box_${i}`, type: "appear" as const, effect: "scale" as const },
        { targetId: `val_${i}`, type: "appear" as const, effect: "fade" as const },
        { targetId: `idx_${i}`, type: "appear" as const, effect: "fade" as const },
      ]),
    ]},
    { id: "show_target", startTime: 3, duration: 0.8, actions: [
      { targetId: "target_box", type: "appear", effect: "scale" },
      { targetId: "step_text", type: "setText", text: "Step 1: Start with the full sorted array. low=0, high=7" },
    ]},

    // Step 2: Show initial pointers low=0, high=7, mid=3
    { id: "show_pointers", startTime: 4.5, duration: 0.8, actions: [
      { targetId: "ptr_low", type: "appear", effect: "fade" },
      { targetId: "ptr_high", type: "appear", effect: "fade" },
      { targetId: "arr_low", type: "drawArrow" },
      { targetId: "arr_high", type: "drawArrow" },
    ]},
    { id: "show_mid1", startTime: 5.5, duration: 0.8, actions: [
      { targetId: "step_text", type: "setText", text: "Step 2: Calculate mid = (0+7)/2 = 3. arr[3] = 19" },
      { targetId: "ptr_mid", type: "appear", effect: "fade" },
      { targetId: "arr_mid", type: "drawArrow" },
      { targetId: `box_3`, type: "highlight", color: "#E6A817" },
    ]},
    { id: "compare1", startTime: 7, duration: 0.5, actions: [
      { targetId: "compare_text", type: "setText", text: "19 < 31 → target is in right half → move low to mid+1" },
    ]},

    // Step 3: Move low to index 4, recalculate mid=5
    { id: "move_low", startTime: 8.5, duration: 1, actions: [
      { targetId: "step_text", type: "setText", text: "Step 3: low=4, high=7, mid=(4+7)/2 = 5. arr[5] = 31" },
      { targetId: "ptr_low", type: "moveTo", toState: { x: boxCenter(4) - 12 } },
      { targetId: "arr_low", type: "morphTo", toState: { points: [boxCenter(4), 310, boxCenter(4), 280] } },
    ]},
    // Dim left half
    { id: "dim_left", startTime: 9, duration: 0.5, parallel: true, actions: [
      { targetId: "box_0", type: "morphTo", toState: { fill: "#1a1a2e", stroke: "#333333" } },
      { targetId: "box_1", type: "morphTo", toState: { fill: "#1a1a2e", stroke: "#333333" } },
      { targetId: "box_2", type: "morphTo", toState: { fill: "#1a1a2e", stroke: "#333333" } },
      { targetId: "box_3", type: "morphTo", toState: { fill: "#1a1a2e", stroke: "#333333" } },
      { targetId: "val_0", type: "morphTo", toState: { fill: "#444444" } },
      { targetId: "val_1", type: "morphTo", toState: { fill: "#444444" } },
      { targetId: "val_2", type: "morphTo", toState: { fill: "#444444" } },
      { targetId: "val_3", type: "morphTo", toState: { fill: "#444444" } },
    ]},

    // Move mid to index 5
    { id: "move_mid", startTime: 10, duration: 1, actions: [
      { targetId: "ptr_mid", type: "moveTo", toState: { x: boxCenter(5) - 12 } },
      { targetId: "arr_mid", type: "morphTo", toState: { points: [boxCenter(5), 310, boxCenter(5), 280] } },
      { targetId: `box_5`, type: "highlight", color: "#E6A817" },
    ]},

    // Step 4: Compare — found!
    { id: "compare2", startTime: 11.5, duration: 0.5, actions: [
      { targetId: "compare_text", type: "setText", text: "31 == 31 → FOUND at index 5!" },
    ]},

    // Highlight found element
    { id: "found", startTime: 12.5, duration: 1, actions: [
      { targetId: "box_5", type: "morphTo", toState: { fill: "#50C878", stroke: "#FFFFFF" } },
      { targetId: "found_label", type: "appear", effect: "scale", easing: "bounceOut" },
      { targetId: "step_text", type: "setText", text: "Binary search found 31 in just 2 comparisons (vs 6 for linear search)" },
    ]},
  ],
};
