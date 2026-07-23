// scripts/dev-cron.ts
// Simulates Vercel Cron locally by polling /api/cron/send-reminders
// every 5 minutes while your Next.js dev server is running.
//
// Usage:
//   1. In one terminal: npm run dev
//   2. In another terminal: npm run dev:cron
//
// Reads CRON_SECRET from your .env.local file automatically.

import fs from "fs";
import path from "path";

// --- Load env vars from a .env-style file without extra deps ---
function loadEnv(file: string): Record<string, string> {
  const fullPath = path.join(process.cwd(), file);
  if (!fs.existsSync(fullPath)) return {};
  const content = fs.readFileSync(fullPath, "utf-8");
  const env: Record<string, string> = {};
  content.split("\n").forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      value = value.replace(/^["']|["']$/g, ""); // strip surrounding quotes
      env[key] = value;
    }
  });
  return env;
}

const env: Record<string, string> = {
  ...loadEnv(".env.local"),
  ...loadEnv(".env"),
};

const CRON_SECRET: string | undefined = env.CRON_SECRET || process.env.CRON_SECRET;
const BASE_URL: string = process.env.DEV_URL || "http://localhost:3000";
const INTERVAL_MS = 60 * 1000; // 5 minutes

if (!CRON_SECRET) {
  console.error("❌ CRON_SECRET not found in .env.local or .env — aborting.");
  process.exit(1);
}

async function runCronCheck(): Promise<void> {
  const time = new Date().toLocaleTimeString();
  try {
    const res = await fetch(`${BASE_URL}/api/cron/send-reminders`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    const data = await res.json();
    console.log(`[${time}] ✅ Cron ran:`, data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[${time}] ❌ Cron request failed:`, message);
  }
}

console.log(
  `🕒 Dev cron simulator started — hitting ${BASE_URL}/api/cron/send-reminders every 1 min`
);
console.log(`   (Ctrl+C to stop)\n`);

runCronCheck(); // run once immediately on start
setInterval(runCronCheck, INTERVAL_MS);