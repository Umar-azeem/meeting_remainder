// lib/syncCalendar.ts
// Pulls ALL upcoming events from Google Calendar (including ones created
// manually in Calendar, not just through the app's form) and saves them
// to Redis so the reminder cron can find them.
//
// IMPORTANT: if a meeting was already synced before and some reminder
// stages were already sent, this preserves that `remindersSent` state
// instead of wiping it back to {} — otherwise every sync would cause
// already-sent reminders to fire again.

import { google } from "googleapis";
import { randomUUID } from "crypto";
import { saveMeeting, getMeeting, Meeting } from "@/components/lib/meetingsStore";

function getAuth() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  auth.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  return auth;
}

export async function syncCalendarEvents(): Promise<{
  synced: number;
  skipped: number;
}> {
  const calendar = google.calendar({
    version: "v3",
    auth: getAuth(),
  });

  const result = await calendar.events.list({
    calendarId: "primary",
    timeMin: new Date().toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  const events = result.data.items || [];
  let synced = 0;
  let skipped = 0;

  for (const event of events) {
    const clientEmail = event.attendees?.find(
      (a) => a.email !== process.env.GOOGLE_OWNER_EMAIL
    )?.email;

    if (!clientEmail || !event.start?.dateTime) {
      skipped++;
      continue; // no attendee or no confirmed start time — nothing to remind
    }

    const meetLink =
      event.conferenceData?.entryPoints?.find(
        (e) => e.entryPointType === "video"
      )?.uri || "";

    const meetingId = event.id || randomUUID();

    // Preserve any reminder progress already recorded for this event.
    const existing = await getMeeting(meetingId);

    const meeting: Meeting = {
      id: meetingId,
      summary: event.summary || "Google Meeting",
      clientName: event.attendees?.[0]?.displayName || "",
      clientEmail,
      startTime: event.start.dateTime,
      meetLink,
      timeZone: event.start.timeZone || "America/New_York",
      remindersSent: existing?.remindersSent || {},
    };

    await saveMeeting(meeting);
    synced++;
  }

  console.log(`🔄 Calendar sync: ${synced} synced, ${skipped} skipped`);
  return { synced, skipped };
}