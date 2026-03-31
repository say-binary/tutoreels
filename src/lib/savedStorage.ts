import type { SceneGraph } from "@/types/sceneGraph";

export interface SavedItem {
  id: string;
  title: string;
  description: string;
  prompt: string;
  createdAt: string;
  sceneGraph: SceneGraph;
}

const STORAGE_KEY = "tutoreels_saved";

export function loadSaved(): SavedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function persistSaved(items: SavedItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function saveToLocalStorage(sg: SceneGraph, prompt: string | null) {
  const items = loadSaved();
  const newItem: SavedItem = {
    id: `anim_${Date.now()}`,
    title: sg.metadata.title || "Untitled",
    description: sg.metadata.description || "",
    prompt: prompt || "",
    createdAt: new Date().toISOString(),
    sceneGraph: sg,
  };
  persistSaved([newItem, ...items]);
}
