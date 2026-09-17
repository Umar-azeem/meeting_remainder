// lib/meetingsStore.ts
// Saves meeting data to MongoDB so the cron job can find them later

import { getDb } from "./mongo";
import { computeReminderSchedule, ReminderSlot } from "./reminderSchedule";

const COLLECTION = "meetings";

export type RsvpStatus = "needsAction" | "accepted" | "declined" | "tentative";

export interface Attendee {
  email: string;
  displayName?: string;
  responseStatus: RsvpStatus;
  self?: boolean;
  organizer?: boolean;
}

export interface Meeting {
  id: string;
  summary: string;
  clientName: string;
  clientEmail: string;
  startTime: string; // ISO string
  meetLink: string;
  timeZone: string;
  createdAt: string; // ISO string, set once at creation
  reminders: ReminderSlot[];
  /** @deprecated kept only so old records don't break consumers */
  remindersSent?: Record<string, boolean>;

  // ── NEW: RSVP / invite tracking ──
  attendees: Attendee[];
  rsvpStatus: RsvpStatus;
  inviteSent: boolean;
  updatedAt: string;
}

export async function saveMeeting(meeting: Meeting): Promise<void> {
  try {
    console.log(`💾 Saving meeting ${meeting.id} to collection "${COLLECTION}"...`);
    const db = await getDb();
    const result = await db
      .collection<Meeting>(COLLECTION)
      .updateOne({ id: meeting.id }, { $set: meeting }, { upsert: true });
    console.log(
      `✅ Meeting ${meeting.id} saved. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}, Upserted: ${result.upsertedCount}`
    );
  } catch (err) {
    console.error(`❌ saveMeeting failed for ${meeting.id}:`, err);
    throw err;
  }
}

export async function getMeeting(id: string): Promise<Meeting | null> {
  try {
    const db = await getDb();
    const doc = await db.collection<Meeting>(COLLECTION).findOne({ id });
    if (!doc) return null;
    const { _id, ...meeting } = doc as any;
    return meeting as Meeting;
  } catch (err) {
    console.error(`❌ getMeeting failed for ${id}:`, err);
    return null;
  }
}

/**
 * Meetings written before this refactor won't have a reminder schedule yet.
 * Rather than throwing, compute one now using "now" as the effective creation
 * time and persist it.
 */
async function ensureSchedule(meeting: Meeting, now: number): Promise<Meeting> {
  if (meeting.reminders && meeting.reminders.length > 0) return meeting;

  const createdAtMs = meeting.createdAt ? new Date(meeting.createdAt).getTime() : now;
  const startMs = new Date(meeting.startTime).getTime();
  const reminders = computeReminderSchedule(createdAtMs, startMs);

  const patched: Meeting = {
    ...meeting,
    createdAt: meeting.createdAt || new Date(createdAtMs).toISOString(),
    reminders,
  };
  await saveMeeting(patched);
  console.log(`🩹 Backfilled reminder schedule for legacy meeting ${meeting.id}`);
  return patched;
}

export async function getPendingReminders(): Promise<
  { meeting: Meeting; stage: ReminderSlot }[]
> {
  const db = await getDb();
  const now = Date.now();

  console.log(`🔍 Fetching all meetings from collection "${COLLECTION}"...`);
  const cursor = db.collection<Meeting>(COLLECTION).find({});
  const docs = await cursor.toArray();

  if (!docs.length) {
    console.log("📭 No meetings found in MongoDB.");
    return [];
  }

  console.log(`📋 Found ${docs.length} meetings in MongoDB.`);

  const pending: { meeting: Meeting; stage: ReminderSlot }[] = [];

  for (const doc of docs) {
    const { _id, ...raw } = doc as any;
    let meeting: Meeting = raw;

    const meetingMs = new Date(meeting.startTime).getTime();
    if (meetingMs < now) {
      console.log(`⏭️ Skipping past meeting: ${meeting.summary} (${meeting.startTime})`);
      continue;
    }

    meeting = await ensureSchedule(meeting, now);

    for (const stage of meeting.reminders) {
      if (stage.sent) continue;

      const sendAtMs = new Date(stage.sendAt).getTime();
      if (sendAtMs <= now) {
        pending.push({ meeting, stage });
        console.log(
          `✅ Found pending: ${stage.key} for "${meeting.summary}" (due at ${stage.sendAt})`
        );
      }
    }
  }

  console.log(`📋 Total pending reminders found: ${pending.length}`);
  return pending;
}

/**
 * Atomic update — marks a single reminder stage as sent without
 * rewriting the whole document (avoids race conditions in the cron).
 */
export async function markStageSent(
  meetingId: string,
  stageKey: string
): Promise<void> {
  try {
    const db = await getDb();
    const result = await db.collection(COLLECTION).updateOne(
      { id: meetingId, "reminders.key": stageKey },
      {
        $set: {
          "reminders.$.sent": true,
          [`remindersSent.${stageKey}`]: true,
          updatedAt: new Date().toISOString(),
        },
      }
    );
    if (result.matchedCount === 0) {
      console.warn(`⚠️ markStageSent: no match for ${meetingId}/${stageKey}`);
      return;
    }
    console.log(`✅ Marked ${stageKey} as sent for meeting ${meetingId}`);
  } catch (err) {
    console.error(`❌ markStageSent failed for ${meetingId}:`, err);
  }
}