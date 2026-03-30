import Anthropic from "@anthropic-ai/sdk";

/**
 * Takes a user's concept description and returns an enriched breakdown
 * with all necessary components, sub-concepts, and data flow.
 * Uses a fast Claude call to decompose the concept.
 */
export async function enrichConcept(
  client: Anthropic,
  userDescription: string
): Promise<string> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    system: `You are a technical educator. Given a concept, break it down into a complete system diagram specification for an animation.

Output a structured breakdown with:
1. TITLE: A clear title for the animation
2. COMPONENTS: List every component/block needed to explain this concept completely (5-10 components). For each, give: name, role, and visual shape suggestion (circle, rect, textBox).
3. DATA FLOW: How data/information moves between components (as numbered steps). This is the teaching sequence.
4. KEY VALUES: Any example values, formulas, or labels that should appear on screen to make it concrete.

Be thorough — don't skip components. For example, for "transformer attention":
- Don't just show Q, K, V — also show the input embeddings, the dot product, scaling by sqrt(dk), softmax normalization, the weighted sum, and the output projection.

Keep it concise — bullet points only, no prose. This will be used to generate an animation.`,
    messages: [
      {
        role: "user",
        content: userDescription,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return userDescription; // fallback to original
  }

  return textBlock.text;
}
