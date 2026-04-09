import type { SceneGraph } from "@/types/sceneGraph";

// Per-user storage for:
//   1. User-generated demos — every successful `Create Animation` adds
//      an entry so the user can replay it from the demo list later.
//   2. Hidden demo IDs — when a user edits a demo and saves the changes,
//      the original demo hides from their personal demo list. Built-in
//      demos stay untouched for everyone else.
//
// Both are namespaced by the user's mobile number (the local identifier
// from LoginScreen). If no user is available we fall back to a "guest"
// namespace so features still work for pre-login development.

export interface UserDemo {
  id: string;         // unique, e.g. "user_1712345678901"
  label: string;      // short label for the demo pill (max ~18 chars)
  prompt: string;     // the original user prompt
  plan: string;       // the edited plan that was used to generate
  sceneGraph: SceneGraph;
  createdAt: string;  // ISO timestamp
}

const USER_DEMOS_KEY_PREFIX = "tutoreels_user_demos_";
const HIDDEN_DEMOS_KEY_PREFIX = "tutoreels_hidden_demos_";

function userDemosKey(user: string | null): string {
  return USER_DEMOS_KEY_PREFIX + (user || "guest");
}

function hiddenDemosKey(user: string | null): string {
  return HIDDEN_DEMOS_KEY_PREFIX + (user || "guest");
}

// ---------- user demos ----------

export function loadUserDemos(user: string | null): UserDemo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(userDemosKey(user));
    return raw ? (JSON.parse(raw) as UserDemo[]) : [];
  } catch {
    return [];
  }
}

export function addUserDemo(
  user: string | null,
  prompt: string,
  plan: string,
  sceneGraph: SceneGraph
): UserDemo {
  const id = `user_${Date.now()}`;
  const label = makeLabel(prompt, sceneGraph.metadata.title);
  const demo: UserDemo = {
    id,
    label,
    prompt,
    plan,
    sceneGraph,
    createdAt: new Date().toISOString(),
  };
  const existing = loadUserDemos(user);
  // Prepend so the newest appears first.
  localStorage.setItem(userDemosKey(user), JSON.stringify([demo, ...existing]));
  return demo;
}

export function removeUserDemo(user: string | null, id: string) {
  const existing = loadUserDemos(user);
  const next = existing.filter((d) => d.id !== id);
  localStorage.setItem(userDemosKey(user), JSON.stringify(next));
}

/** Build a short, pill-friendly label from the prompt or scene graph title. */
function makeLabel(prompt: string, title?: string): string {
  const src = (title && title.trim()) || prompt;
  const clean = src.replace(/^(Explain|Show|How|What)\s+(how|what|does)?\s*/i, "").trim();
  const first = clean.split(/[.!?]/)[0];
  const words = first.split(/\s+/).slice(0, 3).join(" ");
  return words.length > 24 ? words.slice(0, 22) + "…" : words || "Animation";
}

// ---------- hidden demos (per user) ----------

export function loadHiddenDemos(user: string | null): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(hiddenDemosKey(user));
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

export function hideDemoForUser(user: string | null, demoId: string) {
  const hidden = loadHiddenDemos(user);
  hidden.add(demoId);
  localStorage.setItem(hiddenDemosKey(user), JSON.stringify([...hidden]));
}

export function unhideDemoForUser(user: string | null, demoId: string) {
  const hidden = loadHiddenDemos(user);
  hidden.delete(demoId);
  localStorage.setItem(hiddenDemosKey(user), JSON.stringify([...hidden]));
}
