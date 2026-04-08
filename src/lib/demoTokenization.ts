import type { SceneGraph } from "@/types/sceneGraph";

/**
 * Demo: Tokenization
 * Shows how text "The cat sat on the mat" gets broken into tokens.
 * Uses BPE-style tokenization as example.
 *
 * Layout:
 * - Title at top
 * - Full sentence in a text box
 * - Arrow down to tokenizer box
 * - Individual token boxes appear one by one with IDs
 * - Vocabulary lookup table on the right
 */

const SENTENCE = "The cat sat on the mat";
const TOKENS = ["The", " cat", " sat", " on", " the", " mat"];
const TOKEN_IDS = [464, 3797, 3290, 319, 262, 2386];

const TOKEN_COLORS = ["#4A90D9", "#50C878", "#E6A817", "#9B59B6", "#E74C3C", "#2EC4B6"];

// Token box positions (spread horizontally)
const TOKEN_START_X = 140;
const TOKEN_GAP = 170;
const TOKEN_Y = 420;

export const demoTokenization: SceneGraph = {
  metadata: {
    title: "How Tokenization Works",
    description: "Shows how text is broken into tokens with BPE, each mapped to a unique ID",
    duration: 28,
    canvasWidth: 1280,
    canvasHeight: 720,
    backgroundColor: "#1a1a2e",
  },
  assets: [
    // Title
    { id: "title", type: "text", initialState: { x: 350, y: 30, text: "How Tokenization Works", fontSize: 28, fill: "#FFFFFF" }, visible: false },
    { id: "subtitle", type: "text", initialState: { x: 380, y: 65, text: "Breaking text into tokens for the model", fontSize: 14, fill: "#95A5A6" }, visible: false },

    // Input sentence
    { id: "input_box", type: "roundedRect", initialState: { x: 640, y: 150, width: 500, height: 50, fill: "#2C3E50", stroke: "#4A90D9", strokeWidth: 2, cornerRadius: 10 }, visible: false },
    { id: "input_text", type: "text", initialState: { x: 430, y: 135, text: `"${SENTENCE}"`, fontSize: 20, fill: "#FFFFFF" }, visible: false },
    { id: "input_label", type: "text", initialState: { x: 420, y: 110, text: "Input Text", fontSize: 12, fill: "#95A5A6" }, visible: false },

    // Tokenizer box
    { id: "tokenizer", type: "roundedRect", initialState: { x: 640, y: 270, width: 200, height: 50, fill: "#9B59B6", stroke: "#FFFFFF", strokeWidth: 2, cornerRadius: 12 }, visible: false },
    { id: "tokenizer_lbl", type: "text", initialState: { x: 570, y: 255, text: "BPE Tokenizer", fontSize: 16, fill: "#FFFFFF" }, visible: false },

    // Arrow input → tokenizer
    { id: "arrow_in", type: "arrow", initialState: { x: 0, y: 0, points: [640, 175, 640, 245], stroke: "#4A90D9", strokeWidth: 2 }, visible: false },

    // Arrow tokenizer → tokens
    { id: "arrow_out", type: "arrow", initialState: { x: 0, y: 0, points: [640, 295, 640, 380], stroke: "#E6A817", strokeWidth: 2 }, visible: false },

    // Token boxes (6 tokens)
    ...TOKENS.map((token, i) => ({
      id: `tok_${i}`,
      type: "roundedRect" as const,
      initialState: {
        x: TOKEN_START_X + i * TOKEN_GAP,
        y: TOKEN_Y,
        width: 120,
        height: 40,
        fill: TOKEN_COLORS[i],
        stroke: "#FFFFFF",
        strokeWidth: 1,
        cornerRadius: 8,
      },
      visible: false,
    })),

    // Token text labels
    ...TOKENS.map((token, i) => ({
      id: `tok_lbl_${i}`,
      type: "text" as const,
      initialState: {
        x: TOKEN_START_X + i * TOKEN_GAP - 30,
        y: TOKEN_Y - 8,
        text: `"${token}"`,
        fontSize: 13,
        fill: "#FFFFFF",
      },
      visible: false,
    })),

    // Token ID labels below
    ...TOKEN_IDS.map((id, i) => ({
      id: `tok_id_${i}`,
      type: "text" as const,
      initialState: {
        x: TOKEN_START_X + i * TOKEN_GAP - 20,
        y: TOKEN_Y + 28,
        text: `ID: ${id}`,
        fontSize: 11,
        fill: "#95A5A6",
      },
      visible: false,
    })),

    // Vocabulary table (right side)
    { id: "vocab_box", type: "roundedRect", initialState: { x: 1100, y: 300, width: 200, height: 180, fill: "#1a2a3a", stroke: "#50C878", strokeWidth: 1, cornerRadius: 8 }, visible: false },
    { id: "vocab_title", type: "text", initialState: { x: 1030, y: 225, text: "Vocabulary", fontSize: 14, fill: "#50C878" }, visible: false },
    { id: "vocab_size", type: "text", initialState: { x: 1025, y: 245, text: "50,257 tokens", fontSize: 11, fill: "#95A5A6" }, visible: false },
    { id: "vocab_entry1", type: "text", initialState: { x: 1020, y: 275, text: '464  → "The"', fontSize: 11, fill: "#CCCCCC" }, visible: false },
    { id: "vocab_entry2", type: "text", initialState: { x: 1020, y: 295, text: '3797 → " cat"', fontSize: 11, fill: "#CCCCCC" }, visible: false },
    { id: "vocab_entry3", type: "text", initialState: { x: 1020, y: 315, text: '3290 → " sat"', fontSize: 11, fill: "#CCCCCC" }, visible: false },
    { id: "vocab_entry4", type: "text", initialState: { x: 1020, y: 335, text: '319  → " on"', fontSize: 11, fill: "#CCCCCC" }, visible: false },
    { id: "vocab_entry5", type: "text", initialState: { x: 1020, y: 355, text: '262  → " the"', fontSize: 11, fill: "#CCCCCC" }, visible: false },
    { id: "vocab_entry6", type: "text", initialState: { x: 1020, y: 375, text: '2386 → " mat"', fontSize: 11, fill: "#CCCCCC" }, visible: false },

    // Step descriptions
    { id: "step_text", type: "text", initialState: { x: 100, y: 550, text: "", fontSize: 14, fill: "#B0BEC5" }, visible: false },

    // Notes
    { id: "n1", type: "text", initialState: { x: 100, y: 600, text: "", fontSize: 12, fill: "#95A5A6" }, visible: false },
    { id: "n2", type: "text", initialState: { x: 100, y: 620, text: "", fontSize: 12, fill: "#95A5A6" }, visible: false },
    { id: "n3", type: "text", initialState: { x: 100, y: 640, text: "", fontSize: 12, fill: "#95A5A6" }, visible: false },
    { id: "n4", type: "text", initialState: { x: 100, y: 660, text: "", fontSize: 12, fill: "#95A5A6" }, visible: false },
  ],
  timeline: [
    // 1. Show title
    { id: "show_title", startTime: 0, duration: 1, actions: [
      { targetId: "title", type: "appear", effect: "fade" },
      { targetId: "subtitle", type: "appear", effect: "fade" },
      { targetId: "step_text", type: "appear", effect: "fade" },
    ]},

    // 2. Show input sentence
    { id: "show_input", startTime: 1.5, duration: 1, actions: [
      { targetId: "step_text", type: "setText", text: "Step 1: Start with raw text input" },
      { targetId: "n1", type: "appear", effect: "fade" },
      { targetId: "n1", type: "setText", text: "1. Raw text input received" },
      { targetId: "input_box", type: "appear", effect: "scale", easing: "backOut" },
      { targetId: "input_text", type: "appear", effect: "fade" },
      { targetId: "input_label", type: "appear", effect: "fade" },
    ]},

    // 3. Show tokenizer
    { id: "show_tokenizer", startTime: 4, duration: 1, actions: [
      { targetId: "step_text", type: "setText", text: "Step 2: BPE Tokenizer splits text into subword tokens" },
      { targetId: "n2", type: "appear", effect: "fade" },
      { targetId: "n2", type: "setText", text: "2. BPE splits into subword tokens" },
      { targetId: "arrow_in", type: "drawArrow" },
      { targetId: "tokenizer", type: "appear", effect: "scale", easing: "backOut" },
      { targetId: "tokenizer_lbl", type: "appear", effect: "fade" },
    ]},

    // 4. Tokenizer processes
    { id: "tokenizer_pulse", startTime: 5.5, duration: 0.6, actions: [
      { targetId: "tokenizer", type: "highlight", color: "#FFD700" },
    ]},

    // 5. Show arrow to tokens
    { id: "show_arrow_out", startTime: 6.5, duration: 0.8, actions: [
      { targetId: "arrow_out", type: "drawArrow" },
    ]},

    // 6. Tokens appear one by one
    { id: "tok0", startTime: 8, duration: 0.6, actions: [
      { targetId: "step_text", type: "setText", text: 'Step 3: Each token gets a unique ID from the vocabulary' },
      { targetId: "n3", type: "appear", effect: "fade" },
      { targetId: "n3", type: "setText", text: "3. Each token mapped to unique ID" },
      { targetId: "tok_0", type: "appear", effect: "scale", easing: "backOut" },
      { targetId: "tok_lbl_0", type: "appear", effect: "fade" },
      { targetId: "tok_id_0", type: "appear", effect: "fade" },
    ]},
    { id: "tok1", startTime: 9, duration: 0.6, actions: [
      { targetId: "tok_1", type: "appear", effect: "scale", easing: "backOut" },
      { targetId: "tok_lbl_1", type: "appear", effect: "fade" },
      { targetId: "tok_id_1", type: "appear", effect: "fade" },
    ]},
    { id: "tok2", startTime: 10, duration: 0.6, actions: [
      { targetId: "tok_2", type: "appear", effect: "scale", easing: "backOut" },
      { targetId: "tok_lbl_2", type: "appear", effect: "fade" },
      { targetId: "tok_id_2", type: "appear", effect: "fade" },
    ]},
    { id: "tok3", startTime: 11, duration: 0.6, actions: [
      { targetId: "tok_3", type: "appear", effect: "scale", easing: "backOut" },
      { targetId: "tok_lbl_3", type: "appear", effect: "fade" },
      { targetId: "tok_id_3", type: "appear", effect: "fade" },
    ]},
    { id: "tok4", startTime: 12, duration: 0.6, actions: [
      { targetId: "tok_4", type: "appear", effect: "scale", easing: "backOut" },
      { targetId: "tok_lbl_4", type: "appear", effect: "fade" },
      { targetId: "tok_id_4", type: "appear", effect: "fade" },
    ]},
    { id: "tok5", startTime: 13, duration: 0.6, actions: [
      { targetId: "tok_5", type: "appear", effect: "scale", easing: "backOut" },
      { targetId: "tok_lbl_5", type: "appear", effect: "fade" },
      { targetId: "tok_id_5", type: "appear", effect: "fade" },
    ]},

    // 7. Show vocabulary table
    { id: "show_vocab", startTime: 15, duration: 1, actions: [
      { targetId: "step_text", type: "setText", text: "Step 4: Token IDs are looked up in a learned vocabulary of 50,257 entries" },
      { targetId: "n4", type: "appear", effect: "fade" },
      { targetId: "n4", type: "setText", text: "4. Vocabulary maps tokens ↔ IDs" },
      { targetId: "vocab_box", type: "appear", effect: "fade" },
      { targetId: "vocab_title", type: "appear", effect: "fade" },
      { targetId: "vocab_size", type: "appear", effect: "fade" },
    ]},

    // 8. Vocab entries appear
    { id: "vocab_entries", startTime: 17, duration: 1, actions: [
      { targetId: "vocab_entry1", type: "appear", effect: "fade" },
      { targetId: "vocab_entry2", type: "appear", effect: "fade" },
      { targetId: "vocab_entry3", type: "appear", effect: "fade" },
      { targetId: "vocab_entry4", type: "appear", effect: "fade" },
      { targetId: "vocab_entry5", type: "appear", effect: "fade" },
      { targetId: "vocab_entry6", type: "appear", effect: "fade" },
    ]},

    // 9. Summary
    { id: "summary", startTime: 20, duration: 0.5, actions: [
      { targetId: "step_text", type: "setText", text: 'Result: "The cat sat on the mat" → [464, 3797, 3290, 319, 262, 2386] — ready for embedding' },
    ]},
  ],
};
