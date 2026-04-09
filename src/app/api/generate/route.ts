import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SceneGraphSchema } from "@/ai/sceneGraphSchema";
import { buildSystemPrompt } from "@/ai/prompt";
import { validateSceneGraph, formatErrorsForLLM } from "@/ai/validateSceneGraph";
import { enrichConcept } from "@/ai/enrichConcept";
import type { SceneGraph } from "@/types/sceneGraph";

const MAX_RETRIES = 2;

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
    const { description, plan } = await req.json();

    if (!description || typeof description !== "string") {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }
    if (description.length > 2000) {
      return NextResponse.json({ error: "Description too long (max 2000 characters)" }, { status: 400 });
    }

    const client = new Anthropic();
    const systemPrompt = buildSystemPrompt();

    // If the caller supplied an already-reviewed plan (via the Plan Review
    // modal), use it directly. Otherwise fall back to the legacy auto-enrich
    // path so anything still calling generate without a plan keeps working.
    let enrichedConcept: string;
    if (typeof plan === "string" && plan.trim().length > 0) {
      if (plan.length > 8000) {
        return NextResponse.json({ error: "Plan too long (max 8000 characters)" }, { status: 400 });
      }
      console.log(`[generate] Using user-edited plan (${plan.length} chars)`);
      enrichedConcept = plan;
    } else {
      console.log(`[generate] No plan provided — auto-enriching: "${description.slice(0, 60)}..."`);
      enrichedConcept = await enrichConcept(client, description);
      console.log(`[generate] Enrichment done (${enrichedConcept.length} chars)`);
    }

    // Build initial messages with enriched concept
    const messages: Anthropic.MessageParam[] = [
      {
        role: "user",
        content: `Create an explainer animation for this concept. Here is the FINAL plan the user approved — follow it EXACTLY, including every component, step, and timing:\n\n${enrichedConcept}\n\nOriginal request: "${description}"\n\nInclude ALL components and steps from the plan above. Include persistent step annotation notes (note_1, note_2, etc.) on the left side. Output ONLY the JSON scene graph. No explanation, no markdown.`,
      },
    ];

    let lastSceneGraph: SceneGraph | null = null;
    let attempt = 0;

    while (attempt <= MAX_RETRIES) {
      attempt++;
      console.log(`[generate] Attempt ${attempt}/${MAX_RETRIES + 1} for: "${description.slice(0, 60)}..."`);

      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 16384,
        system: systemPrompt,
        messages,
      });

      const textBlock = response.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        return NextResponse.json({ error: "No text response from AI" }, { status: 500 });
      }

      // Extract JSON
      const jsonStr = extractJson(textBlock.text);
      if (!jsonStr) {
        console.error(`[generate] Attempt ${attempt}: Failed to extract JSON`);
        if (attempt <= MAX_RETRIES) {
          messages.push({ role: "assistant", content: textBlock.text });
          messages.push({
            role: "user",
            content: "Your response was not valid JSON. Please output ONLY the raw JSON scene graph object, starting with { and ending with }. No markdown, no explanation.",
          });
          continue;
        }
        return NextResponse.json({ error: "AI response was not valid JSON after retries." }, { status: 500 });
      }

      // Parse JSON
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        console.error(`[generate] Attempt ${attempt}: JSON parse error`);
        if (attempt <= MAX_RETRIES) {
          messages.push({ role: "assistant", content: textBlock.text });
          messages.push({
            role: "user",
            content: "Your JSON was malformed and couldn't be parsed. Please output valid JSON only.",
          });
          continue;
        }
        return NextResponse.json({ error: "AI returned malformed JSON after retries." }, { status: 500 });
      }

      // Fix common issues
      const fixed = fixCommonIssues(parsed as Record<string, unknown>);

      // Validate with Zod
      const zodResult = SceneGraphSchema.safeParse(fixed);
      if (!zodResult.success) {
        console.error(`[generate] Attempt ${attempt}: Zod failed:`, zodResult.error.issues.slice(0, 3));
        if (attempt <= MAX_RETRIES) {
          const issuesSummary = zodResult.error.issues
            .slice(0, 5)
            .map((i) => `- Path: ${i.path.join(".")}, Error: ${i.message}`)
            .join("\n");
          messages.push({ role: "assistant", content: textBlock.text });
          messages.push({
            role: "user",
            content: `Your JSON has schema errors:\n${issuesSummary}\n\nPlease fix these and output the corrected JSON only.`,
          });
          continue;
        }
        return NextResponse.json(
          { error: "AI generated invalid animation structure after retries." },
          { status: 500 }
        );
      }

      const sceneGraph = zodResult.data;

      // Programmatic validation (layout, alignment, completeness)
      const validationErrors = validateSceneGraph(sceneGraph);
      const criticalErrors = validationErrors.filter((e) => e.severity === "error");

      if (criticalErrors.length > 0 && attempt <= MAX_RETRIES) {
        console.log(`[generate] Attempt ${attempt}: ${criticalErrors.length} critical errors, retrying`);
        const errorFeedback = formatErrorsForLLM(validationErrors);
        messages.push({ role: "assistant", content: textBlock.text });
        messages.push({ role: "user", content: errorFeedback });
        lastSceneGraph = sceneGraph; // keep as fallback
        continue;
      }

      // Log warnings but don't retry for them
      const warnings = validationErrors.filter((e) => e.severity === "warning");
      if (warnings.length > 0) {
        console.log(`[generate] ${warnings.length} warnings:`, warnings.map((w) => w.message));
      }

      console.log(`[generate] Success on attempt ${attempt}`);
      return NextResponse.json(sceneGraph);
    }

    // If we exhausted retries but have a last valid scene graph, return it
    if (lastSceneGraph) {
      console.log("[generate] Returning last valid scene graph after retry exhaustion");
      return NextResponse.json(lastSceneGraph);
    }

    return NextResponse.json({ error: "Failed to generate valid animation after retries." }, { status: 500 });
  } catch (error) {
    console.error("Generation error:", error);

    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "Invalid Anthropic API key. Check your ANTHROPIC_API_KEY in .env.local." },
        { status: 401 }
      );
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Rate limited. Please wait a moment and try again." },
        { status: 429 }
      );
    }
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `API error: ${error.message}` },
        { status: 502 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function extractJson(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) return trimmed;

  const codeBlockMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return null;
}

function fixCommonIssues(data: Record<string, unknown>): Record<string, unknown> {
  const sg = { ...data } as Record<string, unknown>;

  // Fix metadata
  if (!sg.metadata) sg.metadata = {};
  if (typeof sg.metadata === "object") {
    const meta = sg.metadata as Record<string, unknown>;
    if (!meta.canvasWidth) meta.canvasWidth = 1280;
    if (!meta.canvasHeight) meta.canvasHeight = 720;
    if (!meta.backgroundColor) meta.backgroundColor = "#1a1a2e";
    if (!meta.title) meta.title = "Animation";
    if (!meta.description) meta.description = "";
    if (!meta.duration && Array.isArray(sg.timeline)) {
      const timeline = sg.timeline as Array<{ startTime?: number; duration?: number }>;
      let maxEnd = 0;
      for (const entry of timeline) {
        const end = (entry.startTime ?? 0) + (entry.duration ?? 0);
        if (end > maxEnd) maxEnd = end;
      }
      meta.duration = Math.max(maxEnd + 2, 10);
    }
  }

  // Fix assets
  if (Array.isArray(sg.assets)) {
    for (const asset of sg.assets as Array<Record<string, unknown>>) {
      if (asset.visible === undefined) asset.visible = false;
      if (!asset.initialState) asset.initialState = { x: 100, y: 100 };
      const s = asset.initialState as Record<string, unknown>;
      if (s.x === undefined) s.x = 100;
      if (s.y === undefined) s.y = 100;
      if (typeof s.x === "number") s.x = Math.max(0, Math.min(s.x as number, 1280));
      if (typeof s.y === "number") s.y = Math.max(0, Math.min(s.y as number, 720));
      if (asset.type === "arrow" || asset.type === "line") {
        s.x = 0;
        s.y = 0;
        if (!Array.isArray(s.points) || (s.points as number[]).length < 4) {
          s.points = [100, 100, 200, 200];
        }
      }
    }
  }

  // Fix timeline
  if (Array.isArray(sg.timeline)) {
    let i = 0;
    const assetIds = new Set(
      Array.isArray(sg.assets)
        ? (sg.assets as Array<{ id?: string }>).map((a) => a.id).filter(Boolean)
        : []
    );
    for (const entry of sg.timeline as Array<Record<string, unknown>>) {
      if (!entry.id) entry.id = `step_${i}`;
      if (entry.startTime === undefined) entry.startTime = i * 2;
      if (!entry.duration) entry.duration = 1;
      if (Array.isArray(entry.actions)) {
        entry.actions = (entry.actions as Array<{ targetId?: string }>).filter(
          (a) => a.targetId && assetIds.has(a.targetId)
        );
      }
      i++;
    }
    sg.timeline = (sg.timeline as Array<{ actions?: unknown[] }>).filter(
      (e) => Array.isArray(e.actions) && e.actions.length > 0
    );
  }

  return sg;
}
