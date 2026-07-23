// app/api/send-now/route.ts
// ─────────────────────────────────────────────────────────────────
// TRIGGERED BY: "Send Reminder Now" button on the form
// WHAT IT DOES:
//   Sends ONE instant reminder email to the client RIGHT NOW
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { sendReminderEmail } from "@/components/lib/email";

export async function POST(req: NextRequest) {
  try {
    const {
      clientName,
      clientEmail,
      summary,
      meetLink,
      startTime,
      timeZone,
    } = await req.json();

    console.log("SEND NOW REQUEST:", {
      clientName,
      clientEmail,
      summary,
      meetLink,
      startTime,
      timeZone,
    });

    if (!clientEmail || !summary || !meetLink) {
      return NextResponse.json(
        {
          error: "Missing required fields",
        },
        {
          status: 400,
        }
      );
    }

    const result = await sendReminderEmail({
      to: clientEmail,
      clientName: clientName || "Client",
      meetingTitle: summary,
      startTime,
      meetLink,
      timeZone: timeZone || "America/New_York", // 👈 changed fallback
      stageLabel: "manual reminder",
    });

    console.log("EMAIL RESULT:", result);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err: any) {
    console.error("[/api/send-now ERROR]", err);

    return NextResponse.json(
      {
        error: "Failed to send reminder",
        message: err.message,
      },
      {
        status: 500,
      }
    );
  }
}