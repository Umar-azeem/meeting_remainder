// app/api/meetings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/components/lib/mongo";
import { createMeeting, SendUpdates } from "@/components/lib/googleCalendar";
import { saveMeeting, Meeting } from "@/components/lib/meetingsStore";
import { computeReminderSchedule } from "@/components/lib/reminderSchedule";

// ───────────────────────── GET ─────────────────────────
export async function GET() {
  try {
    console.log("📡 GET /api/meetings - Fetching all meetings...");
    const db = await getDb();
    const meetings = await db
      .collection("meetings")
      .find({})
      .sort({ startTime: -1 })
      .toArray();

    console.log(`✅ Found ${meetings.length} meetings`);

    const sanitized = meetings.map(({ _id, ...rest }) => ({
      ...rest,
      id: rest.id || _id.toString(),
    }));

    return NextResponse.json(sanitized, { status: 200 });
  } catch (error: any) {
    console.error("❌ GET /api/meetings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch meetings", message: error.message },
      { status: 500 }
    );
  }
}

// ───────────────────────── POST ─────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      summary,
      clientName,
      clientEmail,
      startTime,
      endTime,
      timeZone,
      sendUpdates = "all", // 👈 NEW from form
    } = body as {
      summary: string;
      clientName?: string;
      clientEmail: string;
      startTime: string;
      endTime: string;
      timeZone?: string;
      sendUpdates?: SendUpdates;
    };

    console.log("📝 Creating meeting:", {
      summary,
      clientName,
      clientEmail,
      sendUpdates,
    });

    if (!summary || !startTime || !endTime || !clientEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ── Step 1: Create the REAL Google Calendar event ──
    let googleEvent;
    try {
      googleEvent = await createMeeting({
        summary,
        clientName,
        clientEmail,
        startTime,
        endTime,
        timeZone: timeZone || "America/New_York",
        sendUpdates,
      });
      console.log("✅ Google Calendar event created:", googleEvent.id);
    } catch (err: any) {
      console.error("❌ Google Calendar creation failed:", err);
      return NextResponse.json(
        { error: "Google Calendar creation failed", message: err.message },
        { status: 502 }
      );
    }

    // ── Step 2: Build the Mongo doc the SAME WAY sync does ──
    const now = Date.now();
    const createdAt = new Date(now).toISOString();
    const startMs = new Date(googleEvent.startTime).getTime();

    const meeting: Meeting = {
      id: googleEvent.id,
      summary: googleEvent.summary,
      clientName: clientName || "",
      clientEmail,
      startTime: googleEvent.startTime,
      meetLink: googleEvent.meetLink,
      timeZone: googleEvent.timeZone,
      createdAt,
      reminders: computeReminderSchedule(now, startMs),

      // 👇 NEW
      attendees: googleEvent.attendees,
      rsvpStatus: googleEvent.rsvpStatus,
      inviteSent: googleEvent.inviteSent,
      updatedAt: new Date(now).toISOString(),
    };

    // ── Step 3: Save via shared saveMeeting (upsert, same as sync) ──
    await saveMeeting(meeting);
    console.log("✅ Meeting saved:", meeting.id);

    return NextResponse.json(
      {
        success: true,
        meeting,
        htmlLink: googleEvent.htmlLink,
        meetLink: googleEvent.meetLink,
        id: googleEvent.id,
        rsvpStatus: googleEvent.rsvpStatus,
        inviteSent: googleEvent.inviteSent,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ POST /api/meetings error:", error);
    return NextResponse.json(
      { error: "Failed to create meeting", message: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    { headers: { Allow: "GET, POST, OPTIONS" } }
  );
}