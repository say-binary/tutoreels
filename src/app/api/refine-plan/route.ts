// POST /api/refine-plan — takes a previous plan + user comments and
// returns an incrementally-updated plan. Used by the "Regenerate" flow:
// instead of throwing the previous plan away and generating a fresh one,
// the user types comments like "make the inputs colored differently" or
// "add a step showing the bias term" and we apply those edits surgically.
//
// If `previousPlan` is missing (e.g. regenerating a built-in demo for
// the first time), the endpoint falls back to a fresh plan generation
// based on `originalPrompt`, lightly steered by the comments.
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const PLAN_SYSTEM = `You are a technical educator designing an explainer animation. Output a DETAILED, EDITABLE plan that will be used AS-IS to generate an animation.

Structure your output EXACTLY like this (plain text, no markdown headings, no asterisks):

TITLE: <short title>

COMPONENTS:
- <name>: <role>, shape: <rect|roundedRect|circle|ellipse|textBox|star|diamond>, color hint: <e.g. blue, green>
- ...
(5-12 components)

KEY VALUES / LABELS:
- <label, formula, or example value>
- ...

STEPS:
1. [0.0s - 2.0s] <what happens>
2. [2.0s - 4.0s] <...>
...
(6-14 steps)

NARRATION NOTES (optional):
- <one-line annotations>

Rules:
- Be thorough — include every sub-component.
- Reference components by name from the COMPONENTS list.
- Use concrete example values where possible.
- Each step 1-3 seconds. Total 15-40 seconds.
- Output plain text only. No markdown, no code fences, no preamble.`;

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
    const { originalPrompt, previousPlan, comments } = await req.json();

    if (!originalPrompt || typeof originalPrompt !== "string") {
      return NextResponse.json({ error: "originalPrompt is required" }, { status: 400 });
    }
    if (!comments || typeof comments !== "string") {
      return NextResponse.json({ error: "comments is required" }, { status: 400 });
    }
    if (originalPrompt.length > 2000) {
      return NextResponse.json({ error: "originalPrompt too long" }, { status: 400 });
    }
    if (comments.length > 2000) {
      return NextResponse.json({ error: "comments too long" }, { status: 400 });
    }
    if (previousPlan && typeof previousPlan === "string" && previousPlan.length > 8000) {
      return NextResponse.json({ error: "previousPlan too long" }, { status: 400 });
    }

    const client = new Anthropic();
    const hasPrevious = typeof previousPlan === "string" && previousPlan.trim().length > 0;

    let userMessage: string;
    if (hasPrevious) {
      userMessage = `Here is the EXISTING plan for an explainer animation:

--- BEGIN EXISTING PLAN ---
${previousPlan}
--- END EXISTING PLAN ---

Original concept: "${originalPrompt}"

The user wants the following INCREMENTAL changes applied to the existing plan:

--- BEGIN USER COMMENTS ---
${comments}
--- END USER COMMENTS ---

Apply these comments to produce a REVISED plan. RULES:
- Preserve as much of the existing plan as possible — components, ordering, timing, formatting.
- Only change what the comments require. Do not rewrite unrelated sections.
- Keep the same overall structure (TITLE, COMPONENTS, KEY VALUES / LABELS, STEPS, NARRATION NOTES).
- If a component is added, add it to the COMPONENTS list AND reference it in the relevant STEPS.
- If a component is removed, remove it from BOTH the COMPONENTS list AND any STEPS that reference it; renumber subsequent steps if needed.
- If timings need to shift, shift them consistently across affected steps.
- Output the FULL revised plan (not just a diff).
- Output plain text only — no preamble, no markdown, no commentary.`;
    } else {
      userMessage = `Original concept: "${originalPrompt}"

The user has these initial preferences for the animation:

--- BEGIN USER COMMENTS ---
${comments}
--- END USER COMMENTS ---

Generate the plan from scratch, incorporating the user's preferences where possible. Output plain text only — no preamble, no markdown.`;
    }

    console.log(
      `[refine-plan] ${hasPrevious ? "Refining" : "Fresh-generating"} plan for: "${originalPrompt.slice(0, 60)}..."`
    );

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2500,
      system: PLAN_SYSTEM,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No plan returned from AI" }, { status: 500 });
    }

    console.log(`[refine-plan] Done (${textBlock.text.length} chars)`);
    return NextResponse.json({ plan: textBlock.text });
  } catch (error) {
    console.error("[refine-plan] error:", error);
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
