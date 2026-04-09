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

/** Export a scene graph as a downloadable JSON file */
export function exportToFile(sg: SceneGraph) {
  const data = JSON.stringify(sg, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(sg.metadata.title || "animation").replace(/[^a-zA-Z0-9]/g, "_")}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Import a scene graph from a JSON file. Returns a promise. */
export function importFromFile(): Promise<SceneGraph> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) { reject(new Error("No file selected")); return; }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const sg = JSON.parse(reader.result as string) as SceneGraph;
          if (!sg.metadata || !sg.assets || !sg.timeline) {
            reject(new Error("Invalid animation file"));
            return;
          }
          resolve(sg);
        } catch {
          reject(new Error("Failed to parse file"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    };
    input.click();
  });
}
