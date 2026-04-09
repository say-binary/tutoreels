"use client";
import { useEffect } from "react";

// Pings /api/heartbeat so the dev server's idle watcher knows the app
// is still open.
//
// Rules:
//   - Heartbeat every 60s while the tab is visible.
//   - On `pagehide`/`beforeunload`, send a final beacon with `unload: true`
//     so the server back-dates its lastSeen and shuts down within ~15s
//     instead of waiting the full 15 minutes.
//   - The 15-minute idle timeout lives on the server side
//     (instrumentation.ts) — it fires when we stop heartbeating, which
//     happens naturally when the browser is closed or the computer sleeps.
//
// Production builds become a no-op via the NODE_ENV check.
export function useHeartbeat() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const HEARTBEAT_INTERVAL_MS = 60_000;
    let stopped = false;

    // We always fire an initial ping regardless of visibility so the
    // server knows "the tab is open" even if it was opened in the
    // background. Further pings are suppressed when the tab is hidden
    // so a backgrounded tab still counts as idle after 15 minutes.
    const ping = (force = false) => {
      if (stopped) return;
      if (!force && document.hidden) return;
      fetch("/api/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ t: Date.now() }),
        keepalive: true,
      }).catch(() => {
        // Server shut down? Nothing we can do from the client.
      });
    };

    // Fire immediately (force=true) so the server sees us right after
    // page load. This also clears any pending closingSince left by a
    // pagehide from the previous page lifecycle (reload case).
    ping(true);
    const intervalId = window.setInterval(() => ping(false), HEARTBEAT_INTERVAL_MS);

    // Also ping when the tab regains visibility (user came back from
    // another tab or restored a minimized window).
    const onVisibilityChange = () => {
      if (!document.hidden) ping(true);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const onUnload = () => {
      stopped = true;
      try {
        const payload = JSON.stringify({ unload: true });
        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: "application/json" });
          navigator.sendBeacon("/api/heartbeat", blob);
        } else {
          fetch("/api/heartbeat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      } catch {}
    };
    window.addEventListener("pagehide", onUnload);
    window.addEventListener("beforeunload", onUnload);

    return () => {
      stopped = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onUnload);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, []);
}
