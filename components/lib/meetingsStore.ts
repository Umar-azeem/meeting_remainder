// lib/meetingsStore.ts
// Saves meeting data to Upstash Redis so the cron job can find them later

import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export const REMINDER_STAGES = [
  { key: "72h", minutesBefore: 72 * 60, label: "72 hours" },
  { key: "48h", minutesBefore: 48 * 60, label: "48 hours" },
  { key: "24h", minutesBefore: 24 * 60, label: "24 hours" },
  { key: "12h", minutesBefore: 12 * 60, label: "12 hours" },
  { key: "30min", minutesBefore: 30, label: "30 minutes" },
  { key: "5min", minutesBefore: 5, label: "5 minutes" },
  { key: "1min", minutesBefore: 1, label: "1 minute" },
];

export interface Meeting {
  id: string;
  summary: string;
  clientName: string;
  clientEmail: string;
  startTime: string; // ISO string
  meetLink: string;
  timeZone: string;
  remindersSent: Record<string, boolean>;
}

export async function saveMeeting(meeting: Meeting): Promise<void> {
  await redis.set(`meeting:${meeting.id}`, JSON.stringify(meeting));
  await redis.sadd("meetings:all", meeting.id);
}

export async function getMeeting(id: string): Promise<Meeting | null> {
  const raw = await redis.get(`meeting:${id}`);
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : (raw as Meeting);
}

export async function getPendingReminders(): Promise<
  { meeting: Meeting; stage: (typeof REMINDER_STAGES)[number] }[]
> {
  const ids = (await redis.smembers("meetings:all")) as string[];
  if (!ids.length) {
    console.log("📭 No meetings found in Redis.");
    return [];
  }

  const pending: {
    meeting: Meeting;
    stage: (typeof REMINDER_STAGES)[number];
  }[] = [];
  const now = Date.now();

  for (const id of ids) {
    const raw = await redis.get(`meeting:${id}`);
    if (!raw) continue;
    const meeting: Meeting = typeof raw === "string" ? JSON.parse(raw) : raw;

    const meetingMs = new Date(meeting.startTime).getTime();
    if (meetingMs < now) {
      console.log(
        `⏭️ Skipping past meeting: ${meeting.summary} (${meeting.startTime})`,
      );
      continue; // past meeting, skip
    }

    for (const stage of REMINDER_STAGES) {
      if (meeting.remindersSent?.[stage.key]) {
        continue; // already sent this stage
      }

      const minutesUntil = (meetingMs - now) / 60_000;

      // A stage is "due" once we're at or past its threshold and hasn't
      // been sent yet. With 1-minute polling this fires within ~1 min
      // of the real target time. NOTE: if the cron hasn't run in a while
      // (e.g. dev server was off), any backlogged stages will all fire
      // together in the same run — there's no upper bound cutoff here
      // by design, so nothing gets silently skipped.
      if (minutesUntil <= stage.minutesBefore) {
        pending.push({ meeting, stage });

        console.log(
          `✅ Found pending: ${stage.key} for "${meeting.summary}" (${minutesUntil.toFixed(1)} min from now)`,
        );
      }
    }
  }

  console.log(`📋 Total pending reminders found: ${pending.length}`);
  return pending;
}

export async function markStageSent(
  meetingId: string,
  stageKey: string,
): Promise<void> {
  const raw = await redis.get(`meeting:${meetingId}`);
  if (!raw) return;
  const meeting: Meeting = typeof raw === "string" ? JSON.parse(raw) : raw;
  meeting.remindersSent = { ...meeting.remindersSent, [stageKey]: true };
  await redis.set(`meeting:${meetingId}`, JSON.stringify(meeting));
  console.log(`✅ Marked ${stageKey} as sent for meeting ${meetingId}`);
}