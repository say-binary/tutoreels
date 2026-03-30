import type { SceneGraph } from "@/types/sceneGraph";

export const demoSceneGraph: SceneGraph = {
  metadata: {
    title: "How a Neuron Computes Output",
    description:
      "Shows inputs being weighted, summed, and passed through activation",
    duration: 15,
    canvasWidth: 1280,
    canvasHeight: 720,
    backgroundColor: "#1a1a2e",
  },
  assets: [
    // Title
    {
      id: "title",
      type: "text",
      initialState: {
        x: 440,
        y: 30,
        text: "How a Neuron Works",
        fontSize: 28,
        fill: "#FFFFFF",
      },
      visible: false,
    },
    // Input circles (center-based)
    {
      id: "input1",
      type: "circle",
      initialState: {
        x: 200,
        y: 250,
        radius: 30,
        fill: "#4A90D9",
        stroke: "#FFFFFF",
        strokeWidth: 2,
      },
      visible: false,
    },
    {
      id: "input1_label",
      type: "text",
      initialState: { x: 175, y: 290, text: "x1 = 0.5", fontSize: 14, fill: "#CCCCCC" },
      visible: false,
    },
    {
      id: "input2",
      type: "circle",
      initialState: {
        x: 200,
        y: 400,
        radius: 30,
        fill: "#4A90D9",
        stroke: "#FFFFFF",
        strokeWidth: 2,
      },
      visible: false,
    },
    {
      id: "input2_label",
      type: "text",
      initialState: { x: 175, y: 440, text: "x2 = 0.8", fontSize: 14, fill: "#CCCCCC" },
      visible: false,
    },
    // Weight boxes (center-based: x,y = center of box)
    {
      id: "weight1",
      type: "textBox",
      initialState: {
        x: 350,
        y: 250,
        width: 80,
        height: 30,
        fill: "#2C3E50",
        stroke: "#E6A817",
        text: "w1=0.6",
        fontSize: 12,
      },
      visible: false,
    },
    {
      id: "weight2",
      type: "textBox",
      initialState: {
        x: 350,
        y: 400,
        width: 80,
        height: 30,
        fill: "#2C3E50",
        stroke: "#E6A817",
        text: "w2=0.4",
        fontSize: 12,
      },
      visible: false,
    },
    // Arrows from inputs to neuron
    {
      id: "arrow1",
      type: "arrow",
      initialState: {
        x: 0,
        y: 0,
        points: [230, 250, 500, 330],
        stroke: "#4A90D9",
        strokeWidth: 2,
      },
      visible: false,
    },
    {
      id: "arrow2",
      type: "arrow",
      initialState: {
        x: 0,
        y: 0,
        points: [230, 400, 500, 350],
        stroke: "#4A90D9",
        strokeWidth: 2,
      },
      visible: false,
    },
    // Neuron (circle, center-based)
    {
      id: "neuron",
      type: "circle",
      initialState: {
        x: 540,
        y: 340,
        radius: 45,
        fill: "#50C878",
        stroke: "#FFFFFF",
        strokeWidth: 2,
      },
      visible: false,
    },
    {
      id: "neuron_label",
      type: "text",
      initialState: { x: 518, y: 330, text: "Sum", fontSize: 16, fill: "#FFFFFF" },
      visible: false,
    },
    // Activation box (roundedRect, center-based: x,y = center)
    {
      id: "activation_box",
      type: "roundedRect",
      initialState: {
        x: 730,
        y: 340,
        width: 120,
        height: 60,
        fill: "#9B59B6",
        stroke: "#FFFFFF",
        strokeWidth: 2,
        cornerRadius: 10,
      },
      visible: false,
    },
    {
      id: "activation_label",
      type: "text",
      initialState: { x: 700, y: 330, text: "ReLU", fontSize: 16, fill: "#FFFFFF" },
      visible: false,
    },
    // Arrow from neuron to activation
    {
      id: "arrow3",
      type: "arrow",
      initialState: {
        x: 0,
        y: 0,
        points: [585, 340, 670, 340],
        stroke: "#50C878",
        strokeWidth: 2,
      },
      visible: false,
    },
    // Output circle
    {
      id: "output",
      type: "circle",
      initialState: {
        x: 920,
        y: 340,
        radius: 30,
        fill: "#E6A817",
        stroke: "#FFFFFF",
        strokeWidth: 2,
      },
      visible: false,
    },
    {
      id: "output_label",
      type: "text",
      initialState: { x: 885, y: 380, text: "Output: 0.62", fontSize: 14, fill: "#CCCCCC" },
      visible: false,
    },
    // Arrow from activation to output
    {
      id: "arrow4",
      type: "arrow",
      initialState: {
        x: 0,
        y: 0,
        points: [790, 340, 890, 340],
        stroke: "#E6A817",
        strokeWidth: 2,
      },
      visible: false,
    },
  ],
  timeline: [
    {
      id: "step1",
      startTime: 0,
      duration: 1,
      actions: [{ targetId: "title", type: "appear", effect: "fade" }],
    },
    {
      id: "step2",
      startTime: 1.5,
      duration: 1,
      actions: [
        { targetId: "input1", type: "appear", effect: "scale" },
        { targetId: "input1_label", type: "appear", effect: "fade" },
      ],
    },
    {
      id: "step2b",
      startTime: 2,
      duration: 1,
      parallel: true,
      actions: [
        { targetId: "input2", type: "appear", effect: "scale" },
        { targetId: "input2_label", type: "appear", effect: "fade" },
      ],
    },
    {
      id: "step3",
      startTime: 3.5,
      duration: 0.8,
      actions: [
        { targetId: "weight1", type: "appear", effect: "fade" },
        { targetId: "weight2", type: "appear", effect: "fade" },
      ],
    },
    {
      id: "step4",
      startTime: 5,
      duration: 1,
      actions: [
        { targetId: "arrow1", type: "drawArrow" },
        { targetId: "arrow2", type: "drawArrow" },
      ],
    },
    {
      id: "step5",
      startTime: 6.5,
      duration: 1,
      actions: [
        { targetId: "neuron", type: "appear", effect: "scale", easing: "backOut" },
        { targetId: "neuron_label", type: "appear", effect: "fade" },
      ],
    },
    {
      id: "step6",
      startTime: 8,
      duration: 0.5,
      actions: [
        { targetId: "neuron", type: "highlight", color: "#FFD700" },
      ],
    },
    {
      id: "step7",
      startTime: 9,
      duration: 1,
      actions: [
        { targetId: "arrow3", type: "drawArrow" },
        { targetId: "activation_box", type: "appear", effect: "fade" },
        { targetId: "activation_label", type: "appear", effect: "fade" },
      ],
    },
    {
      id: "step8",
      startTime: 11,
      duration: 1,
      actions: [
        { targetId: "arrow4", type: "drawArrow" },
        { targetId: "output", type: "appear", effect: "scale", easing: "bounceOut" },
        { targetId: "output_label", type: "appear", effect: "fade" },
      ],
    },
  ],
};
