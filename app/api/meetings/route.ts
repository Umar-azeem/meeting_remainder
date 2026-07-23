// app/api/meetings/route.ts
// ─────────────────────────────────────────────────────────────────
// TRIGGERED BY: The form when you click "Schedule Meeting"
// WHAT IT DOES:
//   1. Creates a Google Meet event on YOUR Google Calendar
//   2. Sends a calendar invite to the client (Google does this automatically)
//   3. Saves the meeting to Upstash Redis so auto reminders can fire later
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createMeeting } from "@/components/lib/googleCalendar";
import { saveMeeting } from "@/components/lib/meetingsStore";

export async function POST(req: NextRequest) {
  try {
    const {
      summary,
      startTime,
      endTime,
      clientName,
      clientEmail,
      timeZone,
    } = await req.json();

    // Validation
    if (!summary || !startTime || !endTime || !clientEmail) {
      return NextResponse.json(
        {
          error:
            "summary, startTime, endTime and clientEmail are required",
        },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────
    // Step 1: Create Google Meet Event
    // ─────────────────────────────────────────
    const { meetLink, htmlLink } = await createMeeting({
      summary,
      startTime,
      endTime,
      clientEmail,
      clientName,
      timeZone,
    });

    console.log("Google Calendar Event Created:", {
      summary,
      meetLink,
      htmlLink,
    });

    // ─────────────────────────────────────────
    // Step 2: Save Meeting in Redis
    // ─────────────────────────────────────────
    const meetingId = randomUUID();

    const meetingData = {
      id: meetingId,
      summary,
      clientName: clientName || "",
      clientEmail,
      startTime,
      meetLink,
      timeZone: timeZone || "America/New_York", // 👈 changed fallback
      remindersSent: {},
    };

    console.log("Received from frontend:", {
      startTime,
      endTime,
      timeZone,
    });
    console.log("Saving Meeting To Redis:", meetingData);

    await saveMeeting(meetingData);

    console.log("Meeting Saved Successfully:", meetingId);

    // ─────────────────────────────────────────
    // Step 3: Return Response
    // ─────────────────────────────────────────
    return NextResponse.json(
      {
        success: true,
        meetingId,
        meetLink,
        htmlLink,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[/api/meetings ERROR]", err);

    return NextResponse.json(
      {
        error: "Failed to create meeting",
        message: err.message,
      },
      { status: 500 }
    );
  }
}