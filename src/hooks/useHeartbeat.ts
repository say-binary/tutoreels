"use client";
import { useEffect } from "react";

// Pings /api/heartbeat so the dev server's idle watcher knows the app is open.
//
// Rules:
//   - Heartbeat every 30s while the tab is visible AND the user has
//     interacted (mouse/keyboard/scroll) within the last 15 minutes.
//   - Stop pinging when the user goes idle for > 15 min (interpreted as
//     "abandoned") — the server's 60s no-heartbeat rule will then shut it
//     down, for a total of ~16 min from last interaction to shutdown.
//   - On `pagehide`, send a final beacon with `unload: true` so the server
//     can shut down within ~15s of the tab closing instead of waiting 60s.
//
// Production builds are detected via process.env.NODE_ENV and become a no-op.
export function useHeartbeat() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const HEARTBEAT_INTERVAL_MS = 30_000;
    const IDLE_THRESHOLD_MS = 15 * 60 * 1000; // stop pinging after 15 min idle

    let lastInteraction = Date.now();
    let stopped = false;

    const bump = () => { lastInteraction = Date.now(); };
    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
      "focus",
    ];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));

    const ping = () => {
      if (stopped) return;
      if (document.hidden) return;
      if (Date.now() - lastInteraction > IDLE_THRESHOLD_MS) return;
      fetch("/api/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ t: Date.now() }),
        keepalive: true,
      }).catch(() => {
        // Server shut down? Nothing we can do from the client.
      });
    };

    // Fire one immediately so instrumentation.ts sees us quickly.
    ping();
    const intervalId = window.setInterval(ping, HEARTBEAT_INTERVAL_MS);

    const onUnload = () => {
      stopped = true;
      try {
        const payload = JSON.stringify({ unload: true });
        // sendBeacon survives tab close — fetch does not.
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
      events.forEach((e) => window.removeEventListener(e, bump));
      window.removeEventListener("pagehide", onUnload);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, []);
}
