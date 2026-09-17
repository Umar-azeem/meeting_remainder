// lib/syncCalendar.ts



import { NextResponse } from "next/server";
import { syncCalendarEvents } from "@/components/lib/syncCalendar";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await syncCalendarEvents();
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Sync failed", message }, { status: 500 });
  }
}

































// import { google } from "googleapis";
// import { randomUUID } from "crypto";
// import {
//   saveMeeting,
//   getMeeting,
//   Meeting,
//   Attendee,
//   RsvpStatus,
// } from "@/components/lib/meetingsStore";
// import { computeReminderSchedule } from "@/components/lib/reminderSchedule";

// function getAuth() {
//   const clientId = process.env.GOOGLE_CLIENT_ID;
//   const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
//   const redirectUri = process.env.GOOGLE_REDIRECT_URI;
//   const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

//   if (!clientId || !clientSecret || !redirectUri || !refreshToken) {
//     throw new Error(
//       "Missing Google OAuth environment variables. " +
//         "Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, and GOOGLE_REFRESH_TOKEN."
//     );
//   }

//   const auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
//   auth.setCredentials({ refresh_token: refreshToken });
//   return auth;
// }

// /**
//  * Pick the correct client attendee:
//  *   - skip `self: true` (that's us, the owner)
//  *   - skip the organizer (`organizer: true`)
//  *   - skip anything matching GOOGLE_OWNER_EMAIL / event.organizer.email
//  *   - return the first remaining attendee
//  */
// function pickClient(
//   attendees:
//     | {
//         email?: string | null;
//         self?: boolean | null;
//         organizer?: boolean | null;
//         responseStatus?: string | null;
//         displayName?: string | null;
//       }[]
//     | undefined,
//   ownerEmail: string | undefined,
//   organizerEmail: string | undefined
// ) {
//   if (!attendees?.length) return null;

//   const excluded = new Set(
//     [ownerEmail, organizerEmail]
//       .filter(Boolean)
//       .map((e) => e!.toLowerCase())
//   );

//   for (const a of attendees) {
//     const email = (a.email ?? "").toLowerCase();
//     if (!email) continue;
//     if (a.self) continue;
//     if (a.organizer) continue;
//     if (excluded.has(email)) continue;
//     return a;
//   }
//   return null;
// }

// export async function syncCalendarEvents(): Promise<{
//   synced: number;
//   skipped: number;
//   unchanged: number;
// }> {
//   const auth = getAuth();

//   // Resolve the owner email even if the env var isn't set
//   let ownerEmail = process.env.GOOGLE_OWNER_EMAIL?.toLowerCase();

//   const calendar = google.calendar({ version: "v3", auth });

//   if (!ownerEmail) {
//     try {
//       const profile = await calendar.calendars.get({ calendarId: "primary" });
//       ownerEmail = profile.data.id?.toLowerCase();
//       console.log(`🔎 Resolved owner email from Google: ${ownerEmail}`);
//     } catch (err) {
//       console.warn("⚠️ Could not resolve owner email from Google:", err);
//     }
//   }

//   console.log(`🔎 GOOGLE_OWNER_EMAIL (effective):`, ownerEmail || "NOT SET");

//   console.log("🔍 Fetching upcoming calendar events from Google...");
//   const result = await calendar.events.list({
//     calendarId: "primary",
//     timeMin: new Date().toISOString(),
//     singleEvents: true,
//     orderBy: "startTime",
//   });

//   const events = result.data.items || [];
//   console.log(`📅 Found ${events.length} upcoming events`);

//   let synced = 0;
//   let skipped = 0;
//   let unchanged = 0;

//   for (const event of events) {
//     console.log(`\n📄 Processing event: "${event.summary}" (${event.id})`);
//     console.log(
//       `   Attendees:`,
//       event.attendees?.map((a) => ({
//         email: a.email,
//         self: a.self,
//         organizer: a.organizer,
//         status: a.responseStatus,
//       })) ?? "none"
//     );

//     const organizerEmail = event.organizer?.email?.toLowerCase();
//     const clientAttendee = pickClient(
//       event.attendees ?? undefined,
//       ownerEmail,
//       organizerEmail
//     );

//     if (!clientAttendee?.email) {
//       console.log(`   ⏭️ SKIPPED: No guest attendee found`);
//       skipped++;
//       continue;
//     }

//     const clientEmail = clientAttendee.email;
//     const clientRsvp: RsvpStatus = (clientAttendee.responseStatus ??
//       "needsAction") as RsvpStatus;

//     if (!event.start?.dateTime) {
//       console.log(`   ⏭️ SKIPPED: All-day event (no start.dateTime)`);
//       skipped++;
//       continue;
//     }

//     const meetLink =
//       event.conferenceData?.entryPoints?.find(
//         (e) => e.entryPointType === "video"
//       )?.uri || "";

//     const meetingId = event.id || randomUUID();

//     // Normalize attendees for Mongo
//     const attendees: Attendee[] = (event.attendees ?? []).map((a) => ({
//       email: a.email ?? "",
//       displayName: a.displayName ?? undefined,
//       responseStatus: (a.responseStatus ?? "needsAction") as RsvpStatus,
//       self: a.self ?? false,
//       organizer: a.organizer ?? false,
//     }));

//     const existing = await getMeeting(meetingId);

//     if (
//       existing &&
//       existing.reminders?.length > 0 &&
//       existing.startTime === event.start.dateTime &&
//       existing.clientEmail === clientEmail &&
//       existing.summary === (event.summary || "Google Meeting") &&
//       existing.rsvpStatus === clientRsvp
//     ) {
//       console.log(`   ⏭️ UNCHANGED: Already in DB and identical`);
//       unchanged++;
//       continue;
//     }

//     const createdAt = existing?.createdAt || new Date().toISOString();
//     const startMs = new Date(event.start.dateTime).getTime();
//     const reminders = existing?.reminders?.length
//       ? existing.reminders
//       : computeReminderSchedule(new Date(createdAt).getTime(), startMs);

//     const meeting: Meeting = {
//       id: meetingId,
//       summary: event.summary || "Google Meeting",
//       clientName: clientAttendee.displayName || "",
//       clientEmail,
//       startTime: event.start.dateTime,
//       meetLink,
//       timeZone: event.start.timeZone || "America/New_York",
//       createdAt,
//       reminders,
//       attendees,
//       rsvpStatus: clientRsvp,
//       inviteSent: existing?.inviteSent ?? true,
//       updatedAt: new Date().toISOString(),
//     };

//     try {
//       await saveMeeting(meeting);
//       synced++;
//       console.log(
//         `   ✅ SYNCED: "${meeting.summary}" [client=${clientEmail} rsvp=${clientRsvp}]`
//       );
//     } catch (err) {
//       console.error(`   ❌ SAVE FAILED:`, err);
//       skipped++;
//     }
//   }

//   console.log(
//     `\n🔄 Calendar sync finished: ${synced} synced, ${unchanged} unchanged, ${skipped} skipped`
//   );
//   return { synced, skipped, unchanged };
// }