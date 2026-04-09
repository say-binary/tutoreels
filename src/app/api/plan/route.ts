// POST /api/plan — takes a user's concept description and returns a
// detailed, human-readable step-by-step plan. The plan is shown to the
// user in a review modal before they commit to generating the animation.
// After review, the edited plan is sent back via /api/generate which
// converts it into a scene graph.
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  if (
    !process.env.ANTHROPIC_API_KEY ||
    process.env.ANTHROPIC_API_KEY === "your-api-key-here"
  ) {
    return NextResponse.json(
      { error: "Anthropic API key not configured. Set ANTHROPIC_API_KEY in .env.local and restart the dev server." },
      { status: 401 }
    );
  }

  try {
    const { description } = await req.json();
    if (!description || typeof description !== "string") {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }
    if (description.length > 2000) {
      return NextResponse.json({ error: "Description too long (max 2000 characters)" }, { status: 400 });
    }

    const client = new Anthropic();
    console.log(`[plan] Building plan for: "${description.slice(0, 60)}..."`);

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: `You are a technical educator designing an explainer animation. Given a concept, produce a DETAILED, EDITABLE plan that will be used AS-IS to generate an animation. The plan must be specific enough that another model can turn it directly into a step-by-step scene graph.

Structure your output EXACTLY like this (plain text, no markdown headings, no asterisks):

TITLE: <short title for the animation>

COMPONENTS:
- <name>: <brief role>, shape: <rect|roundedRect|circle|ellipse|textBox|star|diamond>, color hint: <e.g. blue, green>
- <name>: ...
(list 5-12 components)

KEY VALUES / LABELS:
- <label or formula or example value that will appear on screen>
- ...

STEPS:
1. [0.0s - 2.0s] <what happens: which components appear, move, highlight, what arrow is drawn, what text updates>
2. [2.0s - 4.0s] <...>
...
(6-14 steps, covering the full explanation)

NARRATION NOTES (optional):
- <one-line annotations that will appear on the left side during playback>

Rules:
- Be thorough — don't skip any sub-component (for attention: show Q/K/V AND dot product AND scaling AND softmax AND weighted sum).
- Every step must reference components by name from the COMPONENTS list.
- Use concrete example values ("The cat sat", "192.168.1.1", etc.) instead of abstractions where possible.
- Each step should take 1-3 seconds. Total animation 15-40 seconds.
- Output plain text only. No markdown, no code fences, no explanations of the format.`,
      messages: [
        { role: "user", content: description },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No plan returned from AI" }, { status: 500 });
    }

    console.log(`[plan] Done (${textBlock.text.length} chars)`);
    return NextResponse.json({ plan: textBlock.text });
  } catch (error) {
    console.error("[plan] error:", error);
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "Invalid Anthropic API key." }, { status: 401 });
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "Rate limited. Please wait a moment." }, { status: 429 });
    }
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `API error: ${error.message}` }, { status: 502 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
