import type { SceneGraph } from "@/types/sceneGraph";

/**
 * Demo: Advanced Multi-Agent System
 *
 * Layout (1280x720):
 * Row 1 (y~90):  User → Global Memory (shared context)
 * Row 2 (y~210): Orchestrator Agent with ReAct loop
 * Row 3 (y~370): Three specialist agents, each with local memory
 * Row 4 (y~500): Tool/function registry below each agent
 * Row 5 (y~610): Guardrails bar across the bottom
 * Right side:    Final output + feedback arrow back to orchestrator
 *
 * Notes accumulate at bottom-left.
 */

// --- Layout constants ---
const CX = 640; // canvas center x

export const demoMultiAgent: SceneGraph = {
  metadata: {
    title: "Advanced Multi-Agent System",
    description: "Shows orchestrator, ReAct loop, local/global memory, tools, guardrails, and feedback in a multi-agent architecture",
    duration: 34,
    canvasWidth: 1280,
    canvasHeight: 720,
    backgroundColor: "#1a1a2e",
  },
  assets: [
    // ── Title ──
    { id: "title", type: "text", initialState: { x: 310, y: 25, text: "Advanced Multi-Agent Architecture", fontSize: 26, fill: "#FFFFFF" }, visible: false },

    // ── Row 1: User + Global Memory ──
    { id: "user", type: "circle", initialState: { x: 100, y: 100, radius: 28, fill: "#4A90D9", stroke: "#FFFFFF", strokeWidth: 2 }, visible: false },
    { id: "user_lbl", type: "text", initialState: { x: 80, y: 138, text: "User", fontSize: 13, fill: "#CCCCCC" }, visible: false },
    { id: "query", type: "textBox", initialState: { x: 270, y: 100, width: 190, height: 34, fill: "#2C3E50", stroke: "#4A90D9", text: "\"Plan my trip to Tokyo\"", fontSize: 11 }, visible: false },

    // Global Memory (right side of row 1)
    { id: "global_mem", type: "roundedRect", initialState: { x: 950, y: 100, width: 220, height: 55, fill: "#1a2a3a", stroke: "#2EC4B6", strokeWidth: 2, cornerRadius: 8 }, visible: false },
    { id: "global_mem_lbl", type: "text", initialState: { x: 875, y: 85, text: "Global Memory", fontSize: 14, fill: "#2EC4B6" }, visible: false },
    { id: "global_mem_desc", type: "text", initialState: { x: 868, y: 105, text: "Shared context, past results, user prefs", fontSize: 10, fill: "#95A5A6" }, visible: false },

    // Arrow user → orchestrator
    { id: "arrow_user_orch", type: "arrow", initialState: { x: 0, y: 0, points: [365, 100, 540, 200], stroke: "#4A90D9", strokeWidth: 2 }, visible: false },

    // ── Row 2: Orchestrator + ReAct Loop ──
    { id: "orchestrator", type: "roundedRect", initialState: { x: CX, y: 215, width: 200, height: 65, fill: "#9B59B6", stroke: "#FFFFFF", strokeWidth: 2, cornerRadius: 12 }, visible: false },
    { id: "orch_lbl", type: "text", initialState: { x: 575, y: 200, text: "Orchestrator Agent", fontSize: 15, fill: "#FFFFFF" }, visible: false },
    { id: "orch_desc", type: "text", initialState: { x: 585, y: 222, text: "Plan → Delegate → Verify", fontSize: 11, fill: "#DDDDDD" }, visible: false },

    // ReAct loop (circular arrow around orchestrator)
    { id: "react_box", type: "roundedRect", initialState: { x: 440, y: 215, width: 100, height: 45, fill: "#2C1a3a", stroke: "#E056A0", strokeWidth: 2, cornerRadius: 8 }, visible: false },
    { id: "react_lbl", type: "text", initialState: { x: 405, y: 200, text: "ReAct Loop", fontSize: 12, fill: "#E056A0" }, visible: false },
    { id: "react_desc", type: "text", initialState: { x: 398, y: 218, text: "Think→Act→Observe", fontSize: 9, fill: "#CCCCCC" }, visible: false },
    // Arrow ReAct ↔ Orchestrator
    { id: "arrow_react_orch", type: "arrow", initialState: { x: 0, y: 0, points: [490, 215, 540, 215], stroke: "#E056A0", strokeWidth: 2 }, visible: false },

    // Arrow Orchestrator ↔ Global Memory
    { id: "arrow_orch_gmem", type: "arrow", initialState: { x: 0, y: 0, points: [740, 200, 840, 115], stroke: "#2EC4B6", strokeWidth: 1 }, visible: false },
    { id: "gmem_rw_lbl", type: "text", initialState: { x: 770, y: 150, text: "read/write", fontSize: 9, fill: "#2EC4B6" }, visible: false },

    // ── Delegation arrows ──
    { id: "arrow_to_a1", type: "arrow", initialState: { x: 0, y: 0, points: [570, 248, 260, 345], stroke: "#E6A817", strokeWidth: 2 }, visible: false },
    { id: "arrow_to_a2", type: "arrow", initialState: { x: 0, y: 0, points: [CX, 248, CX, 345], stroke: "#E6A817", strokeWidth: 2 }, visible: false },
    { id: "arrow_to_a3", type: "arrow", initialState: { x: 0, y: 0, points: [710, 248, 1060, 345], stroke: "#E6A817", strokeWidth: 2 }, visible: false },

    // ── Row 3: Specialist Agents ──
    // Agent 1 — Research
    { id: "a1", type: "roundedRect", initialState: { x: 180, y: 375, width: 155, height: 50, fill: "#50C878", stroke: "#FFFFFF", strokeWidth: 2, cornerRadius: 10 }, visible: false },
    { id: "a1_lbl", type: "text", initialState: { x: 120, y: 363, text: "Research Agent", fontSize: 13, fill: "#FFFFFF" }, visible: false },
    // Local memory for A1
    { id: "a1_mem", type: "textBox", initialState: { x: 180, y: 430, width: 100, height: 24, fill: "#1a2a3a", stroke: "#2EC4B6", text: "Local Memory", fontSize: 9 }, visible: false },

    // Agent 2 — Booking
    { id: "a2", type: "roundedRect", initialState: { x: CX, y: 375, width: 155, height: 50, fill: "#50C878", stroke: "#FFFFFF", strokeWidth: 2, cornerRadius: 10 }, visible: false },
    { id: "a2_lbl", type: "text", initialState: { x: 585, y: 363, text: "Booking Agent", fontSize: 13, fill: "#FFFFFF" }, visible: false },
    { id: "a2_mem", type: "textBox", initialState: { x: CX, y: 430, width: 100, height: 24, fill: "#1a2a3a", stroke: "#2EC4B6", text: "Local Memory", fontSize: 9 }, visible: false },

    // Agent 3 — Budget
    { id: "a3", type: "roundedRect", initialState: { x: 1060, y: 375, width: 155, height: 50, fill: "#50C878", stroke: "#FFFFFF", strokeWidth: 2, cornerRadius: 10 }, visible: false },
    { id: "a3_lbl", type: "text", initialState: { x: 1005, y: 363, text: "Budget Agent", fontSize: 13, fill: "#FFFFFF" }, visible: false },
    { id: "a3_mem", type: "textBox", initialState: { x: 1060, y: 430, width: 100, height: 24, fill: "#1a2a3a", stroke: "#2EC4B6", text: "Local Memory", fontSize: 9 }, visible: false },

    // ── Row 4: Tools / Functions ──
    { id: "tools_container", type: "container", initialState: { x: CX, y: 510, width: 1100, height: 55, fill: "#0d1220", stroke: "#95A5A6", text: "Tool & Function Registry" }, visible: false },
    { id: "t1", type: "textBox", initialState: { x: 150, y: 510, width: 100, height: 26, fill: "#1a2a3a", stroke: "#95A5A6", text: "Web Search", fontSize: 10 }, visible: false },
    { id: "t2", type: "textBox", initialState: { x: 310, y: 510, width: 100, height: 26, fill: "#1a2a3a", stroke: "#95A5A6", text: "Knowledge DB", fontSize: 10 }, visible: false },
    { id: "t3", type: "textBox", initialState: { x: 530, y: 510, width: 100, height: 26, fill: "#1a2a3a", stroke: "#95A5A6", text: "Flight API", fontSize: 10 }, visible: false },
    { id: "t4", type: "textBox", initialState: { x: 710, y: 510, width: 100, height: 26, fill: "#1a2a3a", stroke: "#95A5A6", text: "Hotel API", fontSize: 10 }, visible: false },
    { id: "t5", type: "textBox", initialState: { x: 890, y: 510, width: 100, height: 26, fill: "#1a2a3a", stroke: "#95A5A6", text: "Calculator", fontSize: 10 }, visible: false },
    { id: "t6", type: "textBox", initialState: { x: 1070, y: 510, width: 100, height: 26, fill: "#1a2a3a", stroke: "#95A5A6", text: "Code Exec", fontSize: 10 }, visible: false },

    // Arrows agents → tool registry
    { id: "arrow_a1_tools", type: "arrow", initialState: { x: 0, y: 0, points: [180, 400, 180, 483], stroke: "#95A5A6", strokeWidth: 1 }, visible: false },
    { id: "arrow_a2_tools", type: "arrow", initialState: { x: 0, y: 0, points: [CX, 400, CX, 483], stroke: "#95A5A6", strokeWidth: 1 }, visible: false },
    { id: "arrow_a3_tools", type: "arrow", initialState: { x: 0, y: 0, points: [1060, 400, 1060, 483], stroke: "#95A5A6", strokeWidth: 1 }, visible: false },

    // ── Row 5: Guardrails ──
    { id: "guardrails", type: "roundedRect", initialState: { x: CX, y: 590, width: 1100, height: 40, fill: "#3a1a1a", stroke: "#E74C3C", strokeWidth: 2, cornerRadius: 6 }, visible: false },
    { id: "guard_lbl", type: "text", initialState: { x: 430, y: 578, text: "Guardrails: Safety Filters  •  Rate Limits  •  Output Validation  •  PII Redaction", fontSize: 12, fill: "#E74C3C" }, visible: false },

    // ── Result arrows back ──
    { id: "arrow_res1", type: "arrow", initialState: { x: 0, y: 0, points: [240, 350, 580, 248], stroke: "#50C878", strokeWidth: 2 }, visible: false },
    { id: "arrow_res2", type: "arrow", initialState: { x: 0, y: 0, points: [CX, 350, CX, 248], stroke: "#50C878", strokeWidth: 2 }, visible: false },
    { id: "arrow_res3", type: "arrow", initialState: { x: 0, y: 0, points: [1000, 350, 700, 248], stroke: "#50C878", strokeWidth: 2 }, visible: false },

    // ── Final Output ──
    { id: "arrow_to_output", type: "arrow", initialState: { x: 0, y: 0, points: [740, 210, 1060, 155], stroke: "#E6A817", strokeWidth: 2 }, visible: false },
    { id: "output", type: "roundedRect", initialState: { x: 1150, y: 210, width: 170, height: 50, fill: "#E6A817", stroke: "#FFFFFF", strokeWidth: 2, cornerRadius: 10 }, visible: false },
    { id: "output_lbl", type: "text", initialState: { x: 1085, y: 198, text: "Final Trip Plan", fontSize: 14, fill: "#1a1a2e" }, visible: false },
    { id: "output_desc", type: "text", initialState: { x: 1085, y: 218, text: "Verified & formatted", fontSize: 10, fill: "#2C3E50" }, visible: false },

    // Feedback loop arrow (output back to orchestrator)
    { id: "feedback_arrow", type: "arrow", initialState: { x: 0, y: 0, points: [1150, 250, 1150, 290, 800, 290, 740, 250], stroke: "#E056A0", strokeWidth: 2 }, visible: false },
    { id: "feedback_lbl", type: "text", initialState: { x: 910, y: 278, text: "Feedback / Retry if needed", fontSize: 10, fill: "#E056A0" }, visible: false },

    // ── Persistent step notes ──
    { id: "n1", type: "text", initialState: { x: 60, y: 640, text: "", fontSize: 11, fill: "#95A5A6" }, visible: false },
    { id: "n2", type: "text", initialState: { x: 60, y: 655, text: "", fontSize: 11, fill: "#95A5A6" }, visible: false },
    { id: "n3", type: "text", initialState: { x: 60, y: 670, text: "", fontSize: 11, fill: "#95A5A6" }, visible: false },
    { id: "n4", type: "text", initialState: { x: 60, y: 685, text: "", fontSize: 11, fill: "#95A5A6" }, visible: false },
    { id: "n5", type: "text", initialState: { x: 60, y: 700, text: "", fontSize: 11, fill: "#95A5A6" }, visible: false },
  ],
  timeline: [
    // 1. Title
    { id: "s_title", startTime: 0, duration: 1, actions: [
      { targetId: "title", type: "appear", effect: "fade" },
    ]},

    // 2. User sends query
    { id: "s_user", startTime: 1.5, duration: 1, actions: [
      { targetId: "n1", type: "appear", effect: "fade" },
      { targetId: "n1", type: "setText", text: "1. User query enters the system" },
      { targetId: "user", type: "appear", effect: "scale", easing: "backOut" },
      { targetId: "user_lbl", type: "appear", effect: "fade" },
      { targetId: "query", type: "appear", effect: "slide" },
    ]},

    // 3. Orchestrator + ReAct + Global Memory appear
    { id: "s_orch", startTime: 4, duration: 1.2, actions: [
      { targetId: "n2", type: "appear", effect: "fade" },
      { targetId: "n2", type: "setText", text: "2. Orchestrator uses ReAct loop + global memory" },
      { targetId: "arrow_user_orch", type: "drawArrow" },
      { targetId: "orchestrator", type: "appear", effect: "scale", easing: "backOut" },
      { targetId: "orch_lbl", type: "appear", effect: "fade" },
      { targetId: "orch_desc", type: "appear", effect: "fade" },
      { targetId: "react_box", type: "appear", effect: "fade" },
      { targetId: "react_lbl", type: "appear", effect: "fade" },
      { targetId: "react_desc", type: "appear", effect: "fade" },
      { targetId: "arrow_react_orch", type: "drawArrow" },
      { targetId: "global_mem", type: "appear", effect: "fade" },
      { targetId: "global_mem_lbl", type: "appear", effect: "fade" },
      { targetId: "global_mem_desc", type: "appear", effect: "fade" },
      { targetId: "arrow_orch_gmem", type: "drawArrow" },
      { targetId: "gmem_rw_lbl", type: "appear", effect: "fade" },
    ]},

    // 4. ReAct loop pulses (Think → Act → Observe)
    { id: "s_react_pulse", startTime: 6.5, duration: 0.6, actions: [
      { targetId: "react_box", type: "highlight", color: "#E056A0" },
      { targetId: "orchestrator", type: "highlight", color: "#FFD700" },
    ]},

    // 5. Delegate to specialist agents
    { id: "s_delegate", startTime: 8, duration: 1.2, actions: [
      { targetId: "n3", type: "appear", effect: "fade" },
      { targetId: "n3", type: "setText", text: "3. Subtasks delegated to specialist agents" },
      { targetId: "arrow_to_a1", type: "drawArrow" },
      { targetId: "arrow_to_a2", type: "drawArrow" },
      { targetId: "arrow_to_a3", type: "drawArrow" },
    ]},

    // 6. Agents + their local memory appear
    { id: "s_agents", startTime: 10, duration: 1, actions: [
      { targetId: "a1", type: "appear", effect: "scale", easing: "backOut" },
      { targetId: "a1_lbl", type: "appear", effect: "fade" },
      { targetId: "a1_mem", type: "appear", effect: "fade" },
      { targetId: "a2", type: "appear", effect: "scale", easing: "backOut" },
      { targetId: "a2_lbl", type: "appear", effect: "fade" },
      { targetId: "a2_mem", type: "appear", effect: "fade" },
      { targetId: "a3", type: "appear", effect: "scale", easing: "backOut" },
      { targetId: "a3_lbl", type: "appear", effect: "fade" },
      { targetId: "a3_mem", type: "appear", effect: "fade" },
    ]},

    // 7. Tool & Function Registry appears, agents connect
    { id: "s_tools", startTime: 13, duration: 1.2, actions: [
      { targetId: "n4", type: "appear", effect: "fade" },
      { targetId: "n4", type: "setText", text: "4. Agents call tools via function registry" },
      { targetId: "tools_container", type: "appear", effect: "fade" },
      { targetId: "t1", type: "appear", effect: "fade" },
      { targetId: "t2", type: "appear", effect: "fade" },
      { targetId: "t3", type: "appear", effect: "fade" },
      { targetId: "t4", type: "appear", effect: "fade" },
      { targetId: "t5", type: "appear", effect: "fade" },
      { targetId: "t6", type: "appear", effect: "fade" },
      { targetId: "arrow_a1_tools", type: "drawArrow" },
      { targetId: "arrow_a2_tools", type: "drawArrow" },
      { targetId: "arrow_a3_tools", type: "drawArrow" },
    ]},

    // 8. Agents work (pulse)
    { id: "s_work", startTime: 16, duration: 0.6, actions: [
      { targetId: "a1", type: "highlight", color: "#FFD700" },
      { targetId: "a2", type: "highlight", color: "#FFD700" },
      { targetId: "a3", type: "highlight", color: "#FFD700" },
    ]},

    // 9. Guardrails appear
    { id: "s_guardrails", startTime: 18, duration: 1, actions: [
      { targetId: "guardrails", type: "appear", effect: "fade" },
      { targetId: "guard_lbl", type: "appear", effect: "fade" },
    ]},

    // 10. Results flow back through guardrails to orchestrator
    { id: "s_results", startTime: 20, duration: 1.2, actions: [
      { targetId: "n5", type: "appear", effect: "fade" },
      { targetId: "n5", type: "setText", text: "5. Results verified by guardrails, returned & synthesized" },
      { targetId: "arrow_res1", type: "drawArrow" },
      { targetId: "arrow_res2", type: "drawArrow" },
      { targetId: "arrow_res3", type: "drawArrow" },
    ]},

    // 11. Orchestrator synthesizes
    { id: "s_synth", startTime: 23, duration: 0.6, actions: [
      { targetId: "orchestrator", type: "highlight", color: "#FFD700" },
    ]},

    // 12. Final output
    { id: "s_output", startTime: 25, duration: 1, actions: [
      { targetId: "arrow_to_output", type: "drawArrow" },
      { targetId: "output", type: "appear", effect: "scale", easing: "bounceOut" },
      { targetId: "output_lbl", type: "appear", effect: "fade" },
      { targetId: "output_desc", type: "appear", effect: "fade" },
    ]},

    // 13. Feedback loop
    { id: "s_feedback", startTime: 28, duration: 1.2, actions: [
      { targetId: "feedback_arrow", type: "drawArrow" },
      { targetId: "feedback_lbl", type: "appear", effect: "fade" },
    ]},

    // 14. Final ReAct pulse to show the loop continues
    { id: "s_final_pulse", startTime: 31, duration: 0.6, actions: [
      { targetId: "react_box", type: "highlight", color: "#E056A0" },
      { targetId: "global_mem", type: "highlight", color: "#2EC4B6" },
    ]},
  ],
};
