import type { SceneGraph } from "@/types/sceneGraph";

/**
 * Demo: Positional Encoding
 * Shows why transformers need position info and how sinusoidal encoding works.
 * Uses "The cat sat" and shows the position vectors being added to embeddings.
 *
 * Layout:
 * - Token embeddings at top
 * - Position encoding vectors in middle
 * - Addition operation
 * - Final vectors at bottom
 * - Sinusoidal formula on the right
 */

const TOKENS = ["The", "cat", "sat"];
const POSITIONS = [0, 1, 2];
const COLORS = ["#4A90D9", "#50C878", "#E6A817"];
const POS_COLOR = "#E056A0";

const TOKEN_X = [280, 540, 800];
const EMB_Y = 150;
const POS_Y = 310;
const ADD_Y = 430;
const OUT_Y = 540;

export const demoPositionalEncoding: SceneGraph = {
  metadata: {
    title: "How Positional Encoding Works",
    description: "Shows how position information is added to token embeddings so transformers know word order",
    duration: 32,
    canvasWidth: 1280,
    canvasHeight: 720,
    backgroundColor: "#1a1a2e",
  },
  assets: [
    // Title
    { id: "title", type: "text", initialState: { x: 300, y: 25, text: "How Positional Encoding Works", fontSize: 28, fill: "#FFFFFF" }, visible: false },
    { id: "subtitle", type: "text", initialState: { x: 330, y: 60, text: "Adding position info so transformers know word order", fontSize: 13, fill: "#95A5A6" }, visible: false },

    // Problem statement
    { id: "problem_box", type: "roundedRect", initialState: { x: 640, y: 105, width: 700, height: 35, fill: "#2C1a1a", stroke: "#E74C3C", strokeWidth: 1, cornerRadius: 6 }, visible: false },
    { id: "problem_text", type: "text", initialState: { x: 320, y: 95, text: 'Problem: "cat sat the" and "the cat sat" have same embeddings — order is lost!', fontSize: 12, fill: "#E74C3C" }, visible: false },

    // Token embedding boxes
    ...TOKENS.map((tok, i) => ({
      id: `emb_${i}`,
      type: "roundedRect" as const,
      initialState: { x: TOKEN_X[i], y: EMB_Y, width: 160, height: 55, fill: "#0d1220", stroke: COLORS[i], strokeWidth: 2, cornerRadius: 8 },
      visible: false,
    })),
    ...TOKENS.map((tok, i) => ({
      id: `emb_lbl_${i}`,
      type: "text" as const,
      initialState: { x: TOKEN_X[i] - 55, y: EMB_Y - 20, text: `E("${tok}")`, fontSize: 12, fill: COLORS[i] },
      visible: false,
    })),
    ...TOKENS.map((_, i) => ({
      id: `emb_vec_${i}`,
      type: "text" as const,
      initialState: { x: TOKEN_X[i] - 60, y: EMB_Y - 2, text: `[0.21, -0.45, 0.87, 0.12]`, fontSize: 10, fill: "#CCCCCC" },
      visible: false,
    })),

    // Plus signs
    ...TOKENS.map((_, i) => ({
      id: `plus_${i}`,
      type: "text" as const,
      initialState: { x: TOKEN_X[i] - 5, y: EMB_Y + 45, text: "+", fontSize: 24, fill: "#FFFFFF" },
      visible: false,
    })),

    // Position encoding boxes
    ...TOKENS.map((_, i) => ({
      id: `pos_${i}`,
      type: "roundedRect" as const,
      initialState: { x: TOKEN_X[i], y: POS_Y, width: 160, height: 55, fill: "#1a0d20", stroke: POS_COLOR, strokeWidth: 2, cornerRadius: 8 },
      visible: false,
    })),
    ...TOKENS.map((_, i) => ({
      id: `pos_lbl_${i}`,
      type: "text" as const,
      initialState: { x: TOKEN_X[i] - 55, y: POS_Y - 20, text: `PE(pos=${i})`, fontSize: 12, fill: POS_COLOR },
      visible: false,
    })),
    ...POSITIONS.map((pos, i) => ({
      id: `pos_vec_${i}`,
      type: "text" as const,
      initialState: {
        x: TOKEN_X[i] - 60,
        y: POS_Y - 2,
        text: pos === 0 ? "[0.00, 1.00, 0.00, 1.00]"
            : pos === 1 ? "[0.84, 0.54, 0.01, 1.00]"
            : "[0.91, -0.42, 0.02, 1.00]",
        fontSize: 10,
        fill: "#CCCCCC",
      },
      visible: false,
    })),

    // Equals signs
    ...TOKENS.map((_, i) => ({
      id: `eq_${i}`,
      type: "text" as const,
      initialState: { x: TOKEN_X[i] - 5, y: POS_Y + 45, text: "=", fontSize: 24, fill: "#FFFFFF" },
      visible: false,
    })),

    // Arrows to output
    ...TOKENS.map((_, i) => ({
      id: `arrow_out_${i}`,
      type: "arrow" as const,
      initialState: { x: 0, y: 0, points: [TOKEN_X[i], POS_Y + 60, TOKEN_X[i], OUT_Y - 35], stroke: "#FFD700", strokeWidth: 2 },
      visible: false,
    })),

    // Output vectors (embedding + position)
    ...TOKENS.map((tok, i) => ({
      id: `out_${i}`,
      type: "roundedRect" as const,
      initialState: { x: TOKEN_X[i], y: OUT_Y, width: 160, height: 55, fill: "#1a1a0d", stroke: "#FFD700", strokeWidth: 2, cornerRadius: 8 },
      visible: false,
    })),
    ...TOKENS.map((tok, i) => ({
      id: `out_lbl_${i}`,
      type: "text" as const,
      initialState: { x: TOKEN_X[i] - 60, y: OUT_Y - 20, text: `"${tok}" (pos ${i})`, fontSize: 12, fill: "#FFD700" },
      visible: false,
    })),
    ...POSITIONS.map((pos, i) => ({
      id: `out_vec_${i}`,
      type: "text" as const,
      initialState: {
        x: TOKEN_X[i] - 60,
        y: OUT_Y - 2,
        text: pos === 0 ? "[0.21, 0.55, 0.87, 1.12]"
            : pos === 1 ? "[1.49, 0.87, -0.21, 1.91]"
            : "[0.73, 0.35, 0.46, 0.44]",
        fontSize: 10,
        fill: "#CCCCCC",
      },
      visible: false,
    })),

    // Sinusoidal formula (right side)
    { id: "formula_box", type: "roundedRect", initialState: { x: 1100, y: 310, width: 250, height: 120, fill: "#1a1a2e", stroke: "#9B59B6", strokeWidth: 1, cornerRadius: 8 }, visible: false },
    { id: "formula_title", type: "text", initialState: { x: 1010, y: 265, text: "Sinusoidal Formula", fontSize: 13, fill: "#9B59B6" }, visible: false },
    { id: "formula_sin", type: "text", initialState: { x: 995, y: 290, text: "PE(pos, 2i)   = sin(pos / 10000^(2i/d))", fontSize: 10, fill: "#CCCCCC" }, visible: false },
    { id: "formula_cos", type: "text", initialState: { x: 995, y: 310, text: "PE(pos, 2i+1) = cos(pos / 10000^(2i/d))", fontSize: 10, fill: "#CCCCCC" }, visible: false },
    { id: "formula_note", type: "text", initialState: { x: 995, y: 340, text: "Each position gets a unique\npattern of sin/cos values.\nNo learning required!", fontSize: 10, fill: "#95A5A6" }, visible: false },

    // Step text
    { id: "step_text", type: "text", initialState: { x: 60, y: 660, text: "", fontSize: 13, fill: "#B0BEC5" }, visible: false },
  ],
  timeline: [
    { id: "show_title", startTime: 0, duration: 1, actions: [
      { targetId: "title", type: "appear", effect: "fade" },
      { targetId: "subtitle", type: "appear", effect: "fade" },
      { targetId: "step_text", type: "appear", effect: "fade" },
    ]},

    { id: "show_problem", startTime: 1.5, duration: 1, actions: [
      { targetId: "step_text", type: "setText", text: "Problem: Transformers process all tokens in parallel — they don't know word order" },
      { targetId: "problem_box", type: "appear", effect: "fade" },
      { targetId: "problem_text", type: "appear", effect: "fade" },
    ]},

    { id: "show_embeddings", startTime: 4, duration: 1.2, actions: [
      { targetId: "step_text", type: "setText", text: "Step 1: Start with token embeddings (from the embedding layer)" },
      ...TOKENS.map((_, i) => ({ targetId: `emb_${i}`, type: "appear" as const, effect: "scale" as const, easing: "backOut" as const })),
      ...TOKENS.map((_, i) => ({ targetId: `emb_lbl_${i}`, type: "appear" as const, effect: "fade" as const })),
      ...TOKENS.map((_, i) => ({ targetId: `emb_vec_${i}`, type: "appear" as const, effect: "fade" as const })),
    ]},

    { id: "show_plus", startTime: 6, duration: 0.5, actions: [
      ...TOKENS.map((_, i) => ({ targetId: `plus_${i}`, type: "appear" as const, effect: "scale" as const })),
    ]},

    { id: "show_positions", startTime: 7, duration: 1.2, actions: [
      { targetId: "step_text", type: "setText", text: "Step 2: Generate position encoding vectors — each position has a unique pattern" },
      ...TOKENS.map((_, i) => ({ targetId: `pos_${i}`, type: "appear" as const, effect: "scale" as const, easing: "backOut" as const })),
      ...TOKENS.map((_, i) => ({ targetId: `pos_lbl_${i}`, type: "appear" as const, effect: "fade" as const })),
      ...TOKENS.map((_, i) => ({ targetId: `pos_vec_${i}`, type: "appear" as const, effect: "fade" as const })),
    ]},

    { id: "show_formula", startTime: 9.5, duration: 1, actions: [
      { targetId: "step_text", type: "setText", text: "The position encoding uses sinusoidal functions — no training needed" },
      { targetId: "formula_box", type: "appear", effect: "fade" },
      { targetId: "formula_title", type: "appear", effect: "fade" },
      { targetId: "formula_sin", type: "appear", effect: "fade" },
      { targetId: "formula_cos", type: "appear", effect: "fade" },
      { targetId: "formula_note", type: "appear", effect: "fade" },
    ]},

    { id: "show_equals", startTime: 12, duration: 0.5, actions: [
      ...TOKENS.map((_, i) => ({ targetId: `eq_${i}`, type: "appear" as const, effect: "scale" as const })),
    ]},

    { id: "show_arrows", startTime: 13, duration: 1, actions: [
      { targetId: "step_text", type: "setText", text: "Step 3: Add embedding + position encoding element-wise" },
      ...TOKENS.map((_, i) => ({ targetId: `arrow_out_${i}`, type: "drawArrow" as const })),
    ]},

    { id: "show_output", startTime: 15, duration: 1.5, actions: [
      { targetId: "step_text", type: "setText", text: "Step 4: Result — each token now carries BOTH meaning AND position information" },
      ...TOKENS.map((_, i) => ({ targetId: `out_${i}`, type: "appear" as const, effect: "scale" as const, easing: "bounceOut" as const })),
      ...TOKENS.map((_, i) => ({ targetId: `out_lbl_${i}`, type: "appear" as const, effect: "fade" as const })),
      ...TOKENS.map((_, i) => ({ targetId: `out_vec_${i}`, type: "appear" as const, effect: "fade" as const })),
    ]},

    { id: "summary", startTime: 19, duration: 0.5, actions: [
      { targetId: "step_text", type: "setText", text: 'Now "The" at position 0 is different from "the" at position 4 — the model knows word order!' },
    ]},
  ],
};
