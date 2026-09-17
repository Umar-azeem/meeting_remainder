import { config } from 'dotenv';
import path from 'path';

config({ path: path.join(__dirname, '..', '.env.local') });
config({ path: path.join(__dirname, '..', '.env') });

const CRON_SECRET = process.env.CRON_SECRET;
const BASE_URL = process.env.DEV_URL || 'http://localhost:3000';
const INTERVAL_MS = 60 * 1000; // 1 minute

if (!CRON_SECRET) {
  console.error('❌ CRON_SECRET not found in .env.local – check the file path and content.');
  process.exit(1);
}

async function runCronCheck() {
  const time = new Date().toLocaleTimeString();
  try {
    const res = await fetch(`${BASE_URL}/api/cron/send-reminders`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    const data = await res.json();
    console.log(`[${time}] ✅ Cron ran:`, data);
  } catch (err) {
    console.error(`[${time}] ❌ Cron request failed:`, err instanceof Error ? err.message : err);
  }
}

console.log(`🕒 Dev cron simulator started – hitting ${BASE_URL}/api/cron/send-reminders every 1 min`);
runCronCheck();
setInterval(runCronCheck, INTERVAL_MS);