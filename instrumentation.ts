// instrumentation.ts — runs once when the Next.js server process starts.
//
// Dev-only: dynamically imports the Node-runtime-only idle watcher so that
// Next's static analyzer never sees `process.exit` / `process.kill` in
// any Edge-runtime bundle.
//
// See src/server/idleWatcher.ts for the actual shutdown logic.

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "development") return;

  const { armIdleWatcher } = await import("./src/server/idleWatcher");
  armIdleWatcher();
}
