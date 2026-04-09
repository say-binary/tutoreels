// POST /api/heartbeat — called by the browser every 60s while the tab
// is open, and once more as a sendBeacon when the tab is closing. Keeps
// the dev server's idle watcher (src/server/idleWatcher.ts) alive.
//
// Dev-only. In production this route is a no-op stub.
import { NextResponse } from "next/server";

type IdleState = {
  lastSeen: number;
  hasSeen: boolean;
  // When a tab fires pagehide we set closingSince = now. The idle
  // watcher gives reloads a short grace window to re-arm with a fresh
  // heartbeat before triggering shutdown. A normal POST heartbeat
  // clears closingSince.
  closingSince: number;
};

function getState(): IdleState {
  const g = globalThis as unknown as { __tutoreelsIdle?: IdleState };
  if (!g.__tutoreelsIdle) {
    g.__tutoreelsIdle = { lastSeen: 0, hasSeen: false, closingSince: 0 };
  }
  // Back-compat: fill in missing fields if an older instrumentation already
  // created a partial state.
  if (g.__tutoreelsIdle.closingSince === undefined) {
    g.__tutoreelsIdle.closingSince = 0;
  }
  return g.__tutoreelsIdle;
}

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ ok: true });
  }

  const state = getState();
  let body: { unload?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    // sendBeacon may send a Blob — try text fallback
    try {
      const text = await req.text();
      if (text) body = JSON.parse(text);
    } catch {}
  }

  if (body.unload) {
    // Tab is closing OR reloading. Record the timestamp so the idle
    // watcher can shut down after a short grace if no new heartbeat
    // arrives. Do NOT touch lastSeen — that would kill reloads mid-flight.
    if (state.closingSince === 0) {
      state.closingSince = Date.now();
    }
  } else {
    // Normal heartbeat: reset everything.
    state.lastSeen = Date.now();
    state.closingSince = 0;
  }
  state.hasSeen = true;

  return NextResponse.json({ ok: true });
}

// GET is handy for sanity-checking the route from curl.
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ ok: true });
  }
  const state = getState();
  return NextResponse.json({
    ok: true,
    hasSeen: state.hasSeen,
    lastSeenAgo: state.lastSeen ? Date.now() - state.lastSeen : null,
    closingSinceAgo: state.closingSince ? Date.now() - state.closingSince : null,
  });
}
