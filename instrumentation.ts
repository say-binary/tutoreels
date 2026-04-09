// instrumentation.ts — runs once when the Next.js server process starts.
//
// Installs a background watcher that shuts the dev server down when:
//   1. No heartbeat has been received from any browser for 60 seconds
//      (user closed the tab / browser / put machine to sleep).
//   2. The user has been idle in the browser for 15 minutes — the client
//      stops sending heartbeats after that, which the 60s rule then catches.
//
// Production builds skip this entirely — it only runs in `next dev`.

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "development") return;

  // Shared state between this module and the /api/heartbeat route.
  // Stored on globalThis so HMR / module reloads preserve it.
  type IdleState = { lastSeen: number; hasSeen: boolean };
  const g = globalThis as unknown as { __tutoreelsIdle?: IdleState };
  if (!g.__tutoreelsIdle) {
    g.__tutoreelsIdle = { lastSeen: 0, hasSeen: false };
  }

  // Give the first browser a generous grace period to connect before we
  // even start checking — otherwise the server could kill itself before
  // anyone opens localhost:3000.
  const STARTUP_GRACE_MS = 90_000; // 1.5 minutes
  const IDLE_THRESHOLD_MS = 60_000; // shut down after 60s without a heartbeat
  const CHECK_INTERVAL_MS = 10_000; // poll every 10s
  const startedAt = Date.now();

  const interval = setInterval(() => {
    const state = g.__tutoreelsIdle!;

    // Wait for the first heartbeat before engaging the idle check at all.
    if (!state.hasSeen) {
      // If nobody has connected after the startup grace, assume the user
      // launched us but never opened the URL — shut down too.
      if (Date.now() - startedAt > STARTUP_GRACE_MS) {
        console.log(
          `[idle-shutdown] No browser connected within ${STARTUP_GRACE_MS / 1000}s — shutting down.`
        );
        clearInterval(interval);
        process.exit(0);
      }
      return;
    }

    const idleMs = Date.now() - state.lastSeen;
    if (idleMs > IDLE_THRESHOLD_MS) {
      console.log(
        `[idle-shutdown] No heartbeat for ${(idleMs / 1000).toFixed(0)}s — shutting down.`
      );
      clearInterval(interval);
      process.exit(0);
    }
  }, CHECK_INTERVAL_MS);

  // Don't keep the event loop alive just for this timer.
  interval.unref?.();

  console.log(
    `[idle-shutdown] Armed. Server will exit if no browser heartbeat for ${IDLE_THRESHOLD_MS / 1000}s.`
  );
}
