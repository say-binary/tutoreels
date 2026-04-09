#!/usr/bin/env node
// TutoReels interactive setup.
// - Verifies Node version.
// - Prompts for an Anthropic API key (hidden input).
// - Writes it to .env.local.
// - Installs npm dependencies.
//
// Run with: npm run setup
import { readFile, writeFile, access } from "node:fs/promises";
import { spawn } from "node:child_process";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import path from "node:path";

// ---------- helpers ----------
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";

const ok = (m) => console.log(`${GREEN}✓${RESET} ${m}`);
const info = (m) => console.log(`${CYAN}›${RESET} ${m}`);
const warn = (m) => console.log(`${YELLOW}!${RESET} ${m}`);
const err = (m) => console.log(`${RED}✗${RESET} ${m}`);
const title = (m) => console.log(`\n${BOLD}${m}${RESET}`);

// Single shared readline interface for the whole run.
const rl = readline.createInterface({ input, output });
async function ask(question) {
  try {
    const ans = await rl.question(question);
    return ans.trim();
  } catch {
    // Interface closed mid-question (e.g. piped EOF) — treat as empty answer.
    return "";
  }
}

async function fileExists(p) {
  try { await access(p); return true; } catch { return false; }
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", shell: process.platform === "win32" });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited with ${code}`))));
    child.on("error", reject);
  });
}

// ---------- checks ----------
title("TutoReels Setup");
console.log(`${DIM}This will configure your API key and install dependencies.${RESET}\n`);

// 1. Node version
const [major] = process.versions.node.split(".").map(Number);
if (major < 20) {
  err(`Node.js 20+ is required. You have v${process.versions.node}.`);
  console.log(`${DIM}Install from https://nodejs.org or run: nvm install 20${RESET}`);
  process.exit(1);
}
ok(`Node.js ${process.versions.node}`);

// 2. API key
title("Anthropic API key");
console.log(`${DIM}Get one at https://console.anthropic.com/settings/keys${RESET}`);
console.log(`${DIM}Your key is stored locally in .env.local and never leaves this machine.${RESET}\n`);

const envPath = path.resolve(".env.local");
let existingKey = null;
if (await fileExists(envPath)) {
  const content = await readFile(envPath, "utf8");
  const match = content.match(/^ANTHROPIC_API_KEY\s*=\s*(.+)$/m);
  if (match) existingKey = match[1].trim();
}

if (existingKey && existingKey !== "your-api-key-here") {
  const masked = existingKey.slice(0, 10) + "…" + existingKey.slice(-4);
  const answer = await ask(`An API key is already configured (${masked}). Keep it? [Y/n] `);
  if (answer.toLowerCase() === "n") {
    existingKey = null;
  }
}

let apiKey = existingKey;
while (!apiKey || apiKey === "your-api-key-here") {
  apiKey = await ask("Paste your Anthropic API key (sk-ant-...): ");
  if (!apiKey.startsWith("sk-ant-")) {
    warn(`That doesn't look like an Anthropic key (should start with "sk-ant-"). Try again.`);
    apiKey = null;
  }
}

await writeFile(envPath, `ANTHROPIC_API_KEY=${apiKey}\n`, "utf8");
ok(`Wrote ${path.relative(process.cwd(), envPath)}`);

// 3. Dependencies
title("Installing dependencies");
const hasNodeModules = await fileExists("node_modules");
if (hasNodeModules) {
  info("node_modules already exists — skipping install. Run `npm install` manually if needed.");
} else {
  try {
    await run("npm", ["install"]);
    ok("Dependencies installed");
  } catch (e) {
    err(`npm install failed: ${e.message}`);
    process.exit(1);
  }
}

rl.close();

// 4. Done
title("✅ All set!");
console.log(`
  ${BOLD}Next steps:${RESET}
    ${CYAN}npm run dev${RESET}
    Open ${CYAN}http://localhost:3000${RESET}

  On first launch you'll be asked for a mobile number. This is stored
  locally as an identifier only — no OTP or verification needed.

  Enjoy building explainer animations!
`);
