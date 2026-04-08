import type { SceneGraph } from "@/types/sceneGraph";

/**
 * Demo: Word Embeddings
 * Shows how token IDs get converted to dense vectors via an embedding matrix.
 * Uses "The cat sat" as example with 4-dimensional embeddings (simplified).
 *
 * Layout:
 * - Token IDs at top
 * - Embedding matrix in the middle
 * - Output vectors at the bottom
 * - Shows lookup, not multiplication
 */

const TOKENS = ["The", "cat", "sat"];
const TOKEN_IDS = [464, 3797, 3290];
const EMBEDDINGS = [
  [0.21, -0.45, 0.87, 0.12],
  [0.65, 0.33, -0.22, 0.91],
  [-0.18, 0.77, 0.44, -0.56],
];

const TOKEN_X = [280, 540, 800];
const COLORS = ["#4A90D9", "#50C878", "#E6A817"];

export const demoEmbedding: SceneGraph = {
  metadata: {
    title: "How Word Embeddings Work",
    description: "Shows how token IDs become dense vectors via embedding matrix lookup",
    duration: 30,
    canvasWidth: 1280,
    canvasHeight: 720,
    backgroundColor: "#1a1a2e",
  },
  assets: [
    // Title
    { id: "title", type: "text", initialState: { x: 350, y: 25, text: "How Word Embeddings Work", fontSize: 28, fill: "#FFFFFF" }, visible: false },
    { id: "subtitle", type: "text", initialState: { x: 350, y: 60, text: "Token IDs → Dense Vectors via Embedding Matrix Lookup", fontSize: 13, fill: "#95A5A6" }, visible: false },

    // Token ID boxes at top
    ...TOKENS.map((tok, i) => ({
      id: `tid_box_${i}`,
      type: "roundedRect" as const,
      initialState: { x: TOKEN_X[i], y: 130, width: 120, height: 45, fill: COLORS[i], stroke: "#FFFFFF", strokeWidth: 1, cornerRadius: 8 },
      visible: false,
    })),
    ...TOKENS.map((tok, i) => ({
      id: `tid_lbl_${i}`,
      type: "text" as const,
      initialState: { x: TOKEN_X[i] - 35, y: 118, text: `"${tok}" → ${TOKEN_IDS[i]}`, fontSize: 13, fill: "#FFFFFF" },
      visible: false,
    })),

    // Arrows from tokens → embedding matrix
    ...TOKENS.map((_, i) => ({
      id: `arrow_tid_${i}`,
      type: "arrow" as const,
      initialState: { x: 0, y: 0, points: [TOKEN_X[i], 153, TOKEN_X[i], 220], stroke: COLORS[i], strokeWidth: 2 },
      visible: false,
    })),

    // Embedding matrix
    { id: "matrix_box", type: "roundedRect", initialState: { x: 540, y: 280, width: 500, height: 110, fill: "#1a2a3a", stroke: "#9B59B6", strokeWidth: 2, cornerRadius: 10 }, visible: false },
    { id: "matrix_lbl", type: "text", initialState: { x: 420, y: 230, text: "Embedding Matrix  (50,257 × d_model)", fontSize: 15, fill: "#9B59B6" }, visible: false },
    { id: "matrix_dim", type: "text", initialState: { x: 420, y: 250, text: "Each row = one token's learned vector (d=768 in GPT-2, simplified to d=4 here)", fontSize: 10, fill: "#95A5A6" }, visible: false },

    // Matrix rows (highlight the looked-up rows)
    { id: "row_464", type: "textBox", initialState: { x: 540, y: 280, width: 400, height: 25, fill: "#4A90D930", stroke: "#4A90D9", text: "Row 464:  [ 0.21, -0.45,  0.87,  0.12 ]", fontSize: 11 }, visible: false },
    { id: "row_3797", type: "textBox", initialState: { x: 540, y: 310, width: 400, height: 25, fill: "#50C87830", stroke: "#50C878", text: "Row 3797: [ 0.65,  0.33, -0.22,  0.91 ]", fontSize: 11 }, visible: false },
    { id: "row_3290", type: "textBox", initialState: { x: 540, y: 340, width: 400, height: 25, fill: "#E6A81730", stroke: "#E6A817", text: "Row 3290: [-0.18,  0.77,  0.44, -0.56 ]", fontSize: 11 }, visible: false },

    // Arrows from matrix → output vectors
    ...TOKENS.map((_, i) => ({
      id: `arrow_emb_${i}`,
      type: "arrow" as const,
      initialState: { x: 0, y: 0, points: [TOKEN_X[i], 350, TOKEN_X[i], 430], stroke: COLORS[i], strokeWidth: 2 },
      visible: false,
    })),

    // Output embedding vectors
    ...TOKENS.map((tok, i) => ({
      id: `emb_box_${i}`,
      type: "roundedRect" as const,
      initialState: { x: TOKEN_X[i], y: 470, width: 180, height: 70, fill: "#0d1220", stroke: COLORS[i], strokeWidth: 2, cornerRadius: 8 },
      visible: false,
    })),
    ...TOKENS.map((tok, i) => ({
      id: `emb_lbl_${i}`,
      type: "text" as const,
      initialState: { x: TOKEN_X[i] - 60, y: 445, text: `E("${tok}")`, fontSize: 12, fill: COLORS[i] },
      visible: false,
    })),
    ...EMBEDDINGS.map((vec, i) => ({
      id: `emb_vec_${i}`,
      type: "text" as const,
      initialState: { x: TOKEN_X[i] - 70, y: 468, text: `[${vec.join(", ")}]`, fontSize: 11, fill: "#CCCCCC" },
      visible: false,
    })),

    // Key insight box
    { id: "insight_box", type: "roundedRect", initialState: { x: 640, y: 590, width: 600, height: 45, fill: "#1a2a3a", stroke: "#E6A817", strokeWidth: 1, cornerRadius: 8 }, visible: false },
    { id: "insight_text", type: "text", initialState: { x: 385, y: 577, text: "Similar words end up with similar vectors — \"cat\" and \"dog\" are close in embedding space", fontSize: 12, fill: "#E6A817" }, visible: false },

    // Step text
    { id: "step_text", type: "text", initialState: { x: 60, y: 660, text: "", fontSize: 13, fill: "#B0BEC5" }, visible: false },
  ],
  timeline: [
    { id: "show_title", startTime: 0, duration: 1, actions: [
      { targetId: "title", type: "appear", effect: "fade" },
      { targetId: "subtitle", type: "appear", effect: "fade" },
      { targetId: "step_text", type: "appear", effect: "fade" },
    ]},

    { id: "show_tokens", startTime: 1.5, duration: 1, actions: [
      { targetId: "step_text", type: "setText", text: "Step 1: Start with token IDs from the tokenizer" },
      ...TOKENS.map((_, i) => ({ targetId: `tid_box_${i}`, type: "appear" as const, effect: "scale" as const, easing: "backOut" as const })),
      ...TOKENS.map((_, i) => ({ targetId: `tid_lbl_${i}`, type: "appear" as const, effect: "fade" as const })),
    ]},

    { id: "show_arrows_down", startTime: 3.5, duration: 1, actions: [
      { targetId: "step_text", type: "setText", text: "Step 2: Look up each token ID in the embedding matrix" },
      ...TOKENS.map((_, i) => ({ targetId: `arrow_tid_${i}`, type: "drawArrow" as const })),
    ]},

    { id: "show_matrix", startTime: 5, duration: 1, actions: [
      { targetId: "matrix_box", type: "appear", effect: "fade" },
      { targetId: "matrix_lbl", type: "appear", effect: "fade" },
      { targetId: "matrix_dim", type: "appear", effect: "fade" },
    ]},

    { id: "show_rows", startTime: 7, duration: 1.5, actions: [
      { targetId: "step_text", type: "setText", text: "Step 3: Each token ID selects its row — a learned dense vector" },
      { targetId: "row_464", type: "appear", effect: "slide" },
      { targetId: "row_3797", type: "appear", effect: "slide" },
      { targetId: "row_3290", type: "appear", effect: "slide" },
    ]},

    { id: "highlight_rows", startTime: 9, duration: 0.6, actions: [
      { targetId: "row_464", type: "highlight", color: "#4A90D9" },
      { targetId: "row_3797", type: "highlight", color: "#50C878" },
      { targetId: "row_3290", type: "highlight", color: "#E6A817" },
    ]},

    { id: "show_arrows_out", startTime: 10.5, duration: 1, actions: [
      ...TOKENS.map((_, i) => ({ targetId: `arrow_emb_${i}`, type: "drawArrow" as const })),
    ]},

    { id: "show_embeddings", startTime: 12, duration: 1.5, actions: [
      { targetId: "step_text", type: "setText", text: "Step 4: Output is a sequence of dense vectors — one per token" },
      ...TOKENS.map((_, i) => ({ targetId: `emb_box_${i}`, type: "appear" as const, effect: "scale" as const, easing: "backOut" as const })),
      ...TOKENS.map((_, i) => ({ targetId: `emb_lbl_${i}`, type: "appear" as const, effect: "fade" as const })),
      ...EMBEDDINGS.map((_, i) => ({ targetId: `emb_vec_${i}`, type: "appear" as const, effect: "fade" as const })),
    ]},

    { id: "show_insight", startTime: 16, duration: 1, actions: [
      { targetId: "step_text", type: "setText", text: "Key insight: embeddings are LEARNED — the model adjusts them during training" },
      { targetId: "insight_box", type: "appear", effect: "fade" },
      { targetId: "insight_text", type: "appear", effect: "fade" },
    ]},
  ],
};
