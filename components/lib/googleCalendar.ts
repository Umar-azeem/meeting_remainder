// lib/googleCalendar.ts
import { google } from "googleapis";
import { randomUUID } from "crypto";
import type { Attendee, RsvpStatus } from "./meetingsStore";

function getAuth() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return auth;
}

export type SendUpdates = "all" | "none" | "externalOnly";

export async function createMeeting(data: {
  summary: string;
  startTime: string;
  endTime: string;
  clientEmail: string;
  clientName?: string;
  timeZone?: string;
  sendUpdates?: SendUpdates; // 👈 NEW
}) {
  const calendar = google.calendar({ version: "v3", auth: getAuth() });

  const response = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    sendUpdates: data.sendUpdates ?? "all", // 👈 NEW
    requestBody: {
      summary: data.summary,
      description: data.clientName ? `Client: ${data.clientName}` : "Meeting",
      start: {
        dateTime: data.startTime,
        timeZone: data.timeZone || "America/New_York",
      },
      end: {
        dateTime: data.endTime,
        timeZone: data.timeZone || "America/New_York",
      },
      attendees: [{ email: data.clientEmail }],
      conferenceData: {
        createRequest: {
          requestId: randomUUID(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    },
  });

  // 👇 NEW: normalize attendees + RSVP
  const attendees: Attendee[] = (response.data.attendees ?? []).map((a) => ({
    email: a.email ?? "",
    displayName: a.displayName ?? undefined,
    responseStatus: (a.responseStatus ?? "needsAction") as RsvpStatus,
    self: a.self ?? false,
    organizer: a.organizer ?? false,
  }));

  const clientRsvp: RsvpStatus =
    attendees.find((a) => a.email === data.clientEmail)?.responseStatus ??
    "needsAction";

  return {
    id: response.data.id || "",
    meetLink: response.data.hangoutLink || "",
    htmlLink: response.data.htmlLink || "",
    startTime: response.data.start?.dateTime || data.startTime,
    endTime: response.data.end?.dateTime || data.endTime,
    timeZone:
      response.data.start?.timeZone || data.timeZone || "America/New_York",
    summary: response.data.summary || data.summary,
    attendees,                                       // 👈 NEW
    rsvpStatus: clientRsvp,                          // 👈 NEW
    inviteSent: (data.sendUpdates ?? "all") !== "none", // 👈 NEW
  };
}