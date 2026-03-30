import type { SceneGraph } from "@/types/sceneGraph";

/**
 * Demo: TCP Three-Way Handshake
 * Layout: Client on left, Server on right, messages in the middle
 * going diagonally between them at different Y levels.
 */

const CLIENT_X = 250;
const SERVER_X = 1030;
const TOP_Y = 180;
const MSG_GAP = 130;

function msgY(step: number) { return TOP_Y + step * MSG_GAP; }

export const demoTCPHandshake: SceneGraph = {
  metadata: {
    title: "TCP Three-Way Handshake",
    description: "Shows the SYN, SYN-ACK, ACK sequence to establish a TCP connection",
    duration: 24,
    canvasWidth: 1280,
    canvasHeight: 720,
    backgroundColor: "#1a1a2e",
  },
  assets: [
    // Title
    { id: "title", type: "text", initialState: { x: 380, y: 30, text: "TCP Three-Way Handshake", fontSize: 28, fill: "#FFFFFF" }, visible: false },

    // Client box
    { id: "client_box", type: "roundedRect", initialState: { x: CLIENT_X, y: 120, width: 160, height: 60, fill: "#4A90D9", stroke: "#FFFFFF", strokeWidth: 2, cornerRadius: 10 }, visible: false },
    { id: "client_label", type: "text", initialState: { x: CLIENT_X - 25, y: 110, text: "Client", fontSize: 18, fill: "#FFFFFF" }, visible: false },

    // Server box
    { id: "server_box", type: "roundedRect", initialState: { x: SERVER_X, y: 120, width: 160, height: 60, fill: "#50C878", stroke: "#FFFFFF", strokeWidth: 2, cornerRadius: 10 }, visible: false },
    { id: "server_label", type: "text", initialState: { x: SERVER_X - 28, y: 110, text: "Server", fontSize: 18, fill: "#FFFFFF" }, visible: false },

    // Vertical timelines (dashed lines)
    { id: "client_timeline", type: "line", initialState: { x: 0, y: 0, points: [CLIENT_X, 155, CLIENT_X, 620], stroke: "#4A90D9", strokeWidth: 1, dash: [6, 4] }, visible: false },
    { id: "server_timeline", type: "line", initialState: { x: 0, y: 0, points: [SERVER_X, 155, SERVER_X, 620], stroke: "#50C878", strokeWidth: 1, dash: [6, 4] }, visible: false },

    // Message 1: SYN →
    { id: "syn_arrow", type: "arrow", initialState: { x: 0, y: 0, points: [CLIENT_X + 20, msgY(0), SERVER_X - 20, msgY(0) + 40], stroke: "#4A90D9", strokeWidth: 2 }, visible: false },
    { id: "syn_label", type: "textBox", initialState: { x: 640, y: msgY(0), width: 140, height: 34, fill: "#1a2a4e", stroke: "#4A90D9", text: "SYN (seq=100)", fontSize: 12 }, visible: false },
    { id: "syn_desc", type: "text", initialState: { x: CLIENT_X + 60, y: msgY(0) - 25, text: '"I want to connect"', fontSize: 13, fill: "#95A5A6" }, visible: false },

    // Message 2: ← SYN-ACK
    { id: "synack_arrow", type: "arrow", initialState: { x: 0, y: 0, points: [SERVER_X - 20, msgY(1), CLIENT_X + 20, msgY(1) + 40], stroke: "#50C878", strokeWidth: 2 }, visible: false },
    { id: "synack_label", type: "textBox", initialState: { x: 640, y: msgY(1) + 10, width: 180, height: 34, fill: "#1a3a2e", stroke: "#50C878", text: "SYN-ACK (seq=300,ack=101)", fontSize: 11 }, visible: false },
    { id: "synack_desc", type: "text", initialState: { x: SERVER_X - 250, y: msgY(1) - 15, text: '"OK, I accept. Let\'s connect"', fontSize: 13, fill: "#95A5A6" }, visible: false },

    // Message 3: ACK →
    { id: "ack_arrow", type: "arrow", initialState: { x: 0, y: 0, points: [CLIENT_X + 20, msgY(2), SERVER_X - 20, msgY(2) + 40], stroke: "#E6A817", strokeWidth: 2 }, visible: false },
    { id: "ack_label", type: "textBox", initialState: { x: 640, y: msgY(2) + 5, width: 140, height: 34, fill: "#3a3a1e", stroke: "#E6A817", text: "ACK (ack=301)", fontSize: 12 }, visible: false },
    { id: "ack_desc", type: "text", initialState: { x: CLIENT_X + 60, y: msgY(2) - 20, text: '"Confirmed! Connection ready"', fontSize: 13, fill: "#95A5A6" }, visible: false },

    // Connection established label
    { id: "connected_box", type: "roundedRect", initialState: { x: 640, y: 600, width: 300, height: 45, fill: "#2C3E50", stroke: "#50C878", strokeWidth: 2, cornerRadius: 10 }, visible: false },
    { id: "connected_label", type: "text", initialState: { x: 530, y: 590, text: "Connection Established!", fontSize: 20, fill: "#50C878" }, visible: false },

    // Step text
    { id: "step_text", type: "text", initialState: { x: 350, y: 660, text: "", fontSize: 15, fill: "#B0BEC5" }, visible: false },
  ],
  timeline: [
    // Title
    { id: "show_title", startTime: 0, duration: 1, actions: [
      { targetId: "title", type: "appear", effect: "fade" },
      { targetId: "step_text", type: "appear", effect: "fade" },
    ]},

    // Show client and server
    { id: "show_endpoints", startTime: 1.5, duration: 1, actions: [
      { targetId: "client_box", type: "appear", effect: "scale" },
      { targetId: "client_label", type: "appear", effect: "fade" },
      { targetId: "server_box", type: "appear", effect: "scale" },
      { targetId: "server_label", type: "appear", effect: "fade" },
      { targetId: "step_text", type: "setText", text: "Two computers need to establish a reliable connection" },
    ]},

    // Show timelines
    { id: "show_timelines", startTime: 3, duration: 0.8, actions: [
      { targetId: "client_timeline", type: "appear", effect: "fade" },
      { targetId: "server_timeline", type: "appear", effect: "fade" },
    ]},

    // Step 1: SYN
    { id: "send_syn", startTime: 4.5, duration: 1.2, actions: [
      { targetId: "step_text", type: "setText", text: "Step 1: Client sends SYN — \"I want to connect, here's my sequence number\"" },
      { targetId: "syn_arrow", type: "drawArrow" },
      { targetId: "syn_label", type: "appear", effect: "fade" },
      { targetId: "syn_desc", type: "appear", effect: "fade" },
    ]},
    { id: "syn_received", startTime: 6.5, duration: 0.5, actions: [
      { targetId: "server_box", type: "highlight", color: "#4A90D9" },
    ]},

    // Step 2: SYN-ACK
    { id: "send_synack", startTime: 8, duration: 1.2, actions: [
      { targetId: "step_text", type: "setText", text: "Step 2: Server replies SYN-ACK — \"Got it, here's MY sequence number + I ack yours\"" },
      { targetId: "synack_arrow", type: "drawArrow" },
      { targetId: "synack_label", type: "appear", effect: "fade" },
      { targetId: "synack_desc", type: "appear", effect: "fade" },
    ]},
    { id: "synack_received", startTime: 10, duration: 0.5, actions: [
      { targetId: "client_box", type: "highlight", color: "#50C878" },
    ]},

    // Step 3: ACK
    { id: "send_ack", startTime: 11.5, duration: 1.2, actions: [
      { targetId: "step_text", type: "setText", text: "Step 3: Client sends ACK — \"Confirmed! I ack your sequence number\"" },
      { targetId: "ack_arrow", type: "drawArrow" },
      { targetId: "ack_label", type: "appear", effect: "fade" },
      { targetId: "ack_desc", type: "appear", effect: "fade" },
    ]},
    { id: "ack_received", startTime: 13.5, duration: 0.5, actions: [
      { targetId: "server_box", type: "highlight", color: "#E6A817" },
    ]},

    // Connection established
    { id: "connected", startTime: 15, duration: 1, actions: [
      { targetId: "connected_box", type: "appear", effect: "scale", easing: "backOut" },
      { targetId: "connected_label", type: "appear", effect: "fade" },
      { targetId: "step_text", type: "setText", text: "Both sides verified: connection is reliable and bidirectional. Data can now flow." },
    ]},
  ],
};
