// Node-only runtime for the dev-server idle watcher. Loaded dynamically
// from instrumentation.ts so Next.js's static analyzer never sees
// `process.exit` / `process.kill` in any Edge-runtime bundle.
//
// State (shared with src/app/api/heartbeat/route.ts via globalThis):
//   lastSeen    — timestamp of the most recent normal heartbeat.
//   hasSeen     — becomes true once any client has ever connected.
//   closingSince — timestamp of a pending pagehide (tab close OR reload).
//
// Shutdown triggers:
//   1. closingSince != 0 and (now - closingSince) > CLOSE_GRACE_MS:
//      The tab reported pagehide and no fresh heartbeat has arrived
//      during the grace window, so assume the user really closed.
//   2. (now - lastSeen) > IDLE_THRESHOLD_MS:
//      15 minutes have passed without any heartbeat at all
//      (laptop asleep, computer shut down, user walked away, …).
//   3. Nobody ever connected within STARTUP_GRACE_MS of server boot.
//
// On shutdown we send SIGTERM to the current process to let Next.js
// run its graceful shutdown hooks (closing the HTTP server and killing
// Turbopack worker processes), then force-exit after 5 seconds as a
// safety net so no orphaned Node/Turbopack processes are left behind.

type IdleState = { lastSeen: number; hasSeen: boolean; closingSince: number };

export function armIdleWatcher() {
  const g = globalThis as unknown as {
    __tutoreelsIdle?: IdleState;
    __tutoreelsIdleArmed?: boolean;
  };
  if (g.__tutoreelsIdleArmed) return; // HMR safety
  g.__tutoreelsIdleArmed = true;
  if (!g.__tutoreelsIdle) {
    g.__tutoreelsIdle = { lastSeen: 0, hasSeen: false, closingSince: 0 };
  }

  const IDLE_THRESHOLD_MS = 15 * 60 * 1000; // 15 min of no heartbeat → exit
  const STARTUP_GRACE_MS = 5 * 60 * 1000;   // 5 min for first browser to connect
  const CLOSE_GRACE_MS = 45 * 1000;         // 45 s after pagehide to detect real close vs reload
  const CHECK_INTERVAL_MS = 15 * 1000;      // poll every 15 s
  const startedAt = Date.now();

  let shuttingDown = false;
  const shutdown = (reason: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[idle-shutdown] ${reason} — shutting down.`);
    try {
      process.kill(process.pid, "SIGTERM");
    } catch {
      // ignore
    }
    setTimeout(() => {
      console.log("[idle-shutdown] Graceful shutdown took too long — forcing exit.");
      process.exit(0);
    }, 5000).unref();
  };

  const interval = setInterval(() => {
    if (shuttingDown) return;
    const state = g.__tutoreelsIdle!;

    // Startup grace: nobody has pinged us yet.
    if (!state.hasSeen) {
      if (Date.now() - startedAt > STARTUP_GRACE_MS) {
        clearInterval(interval);
        shutdown(`No browser connected within ${STARTUP_GRACE_MS / 60_000} minutes`);
      }
      return;
    }

    // Trigger 1: explicit close grace elapsed without a new heartbeat.
    if (state.closingSince > 0) {
      const closingAgo = Date.now() - state.closingSince;
      if (closingAgo > CLOSE_GRACE_MS) {
        clearInterval(interval);
        shutdown(`Browser closed ${(closingAgo / 1000).toFixed(0)}s ago with no reconnect`);
        return;
      }
    }

    // Trigger 2: 15 minutes of total silence.
    const idleMs = Date.now() - state.lastSeen;
    if (idleMs > IDLE_THRESHOLD_MS) {
      clearInterval(interval);
      shutdown(`No heartbeat for ${(idleMs / 60_000).toFixed(1)} minutes`);
    }
  }, CHECK_INTERVAL_MS);

  interval.unref?.();

  console.log(
    `[idle-shutdown] Armed. 15 min idle timeout · 45 s close-grace · 5 min startup grace.`
  );
}
