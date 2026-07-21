// lib/meetingsStore.ts
// Saves meeting data to Upstash Redis so the cron job can find them later

import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export const REMINDER_STAGES = [
  { key: "72h",   minutesBefore: 72 * 60, label: "72 hours"   },
  { key: "48h",   minutesBefore: 48 * 60, label: "48 hours"   },
  { key: "24h",   minutesBefore: 24 * 60, label: "24 hours"   },
  { key: "12h",   minutesBefore: 12 * 60, label: "12 hours"   },
  { key: "30min", minutesBefore: 30,       label: "30 minutes" },
  { key: "5min",  minutesBefore: 5,        label: "5 minutes"  },
  { key: "1min",  minutesBefore: 1,        label: "1 minutes"  },

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

export async function getPendingReminders(): Promise<
  { meeting: Meeting; stage: (typeof REMINDER_STAGES)[number] }[]
> {
  const ids = (await redis.smembers("meetings:all")) as string[];
  if (!ids.length) return [];

  const pending: { meeting: Meeting; stage: (typeof REMINDER_STAGES)[number] }[] = [];
  const now = Date.now();

  for (const id of ids) {
    const raw = await redis.get(`meeting:${id}`);
    if (!raw) continue;
    const meeting: Meeting = typeof raw === "string" ? JSON.parse(raw) : raw;

    const meetingMs = new Date(meeting.startTime).getTime();
    if (meetingMs < now) continue; // past meeting, skip

    for (const stage of REMINDER_STAGES) {
      if (meeting.remindersSent?.[stage.key]) continue; // already sent this stage

      const minutesUntil = (meetingMs - now) / 60_000;
      // fire within ±4 min of the target (cron runs every 5 min)
      if (minutesUntil <= stage.minutesBefore + 4 && minutesUntil > stage.minutesBefore - 4) {
        pending.push({ meeting, stage });
      }
    }
  }

  return pending;
}

export async function markStageSent(meetingId: string, stageKey: string): Promise<void> {
  const raw = await redis.get(`meeting:${meetingId}`);
  if (!raw) return;
  const meeting: Meeting = typeof raw === "string" ? JSON.parse(raw) : raw;
  meeting.remindersSent = { ...meeting.remindersSent, [stageKey]: true };
  await redis.set(`meeting:${meetingId}`, JSON.stringify(meeting));
}