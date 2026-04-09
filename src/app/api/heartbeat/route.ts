// POST /api/heartbeat — called by the browser on a timer (every 30s) and
// once more as a sendBeacon when the tab is closing. Keeps the dev server's
// idle watcher (instrumentation.ts) alive.
//
// Dev-only. In production we no-op so this route is effectively a stub.
import { NextResponse } from "next/server";

type IdleState = { lastSeen: number; hasSeen: boolean };

function getState(): IdleState {
  const g = globalThis as unknown as { __tutoreelsIdle?: IdleState };
  if (!g.__tutoreelsIdle) {
    g.__tutoreelsIdle = { lastSeen: 0, hasSeen: false };
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
    // Mark the connection as nearly-stale so the idle watcher fires soon.
    // It'll still be overridden if another tab is still pinging.
    state.lastSeen = Date.now() - 55_000;
  } else {
    state.lastSeen = Date.now();
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
  });
}
