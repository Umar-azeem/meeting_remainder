// app/api/cron/send-reminders/route.ts
// ─────────────────────────────────────────────────────────────────
// TRIGGERED BY: Vercel Cron (or your dev-cron.ts script) — runs every
//               1 minute
// WHAT IT DOES:
//   1. Syncs Google Calendar so meetings created directly in Calendar
//      (not just through the app's form) are picked up too
//   2. Checks ALL saved meetings in Redis and sends an email for each
//      reminder stage that is due:
//        72h / 48h / 24h / 12h / 30min / 5min / 1min before
//   Each stage is only sent ONCE per meeting (tracked in Redis)
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import {
  getPendingReminders,
  markStageSent,
} from "@/components/lib/meetingsStore";
import { sendReminderEmail } from "@/components/lib/email";
import { syncCalendarEvents } from "@/components/lib/syncCalendar";
// import { syncCalendarEvents } from "@/components/lib/syncCalendar";

export async function GET(req: NextRequest) {
  console.log(`🕒 CRON TRIGGERED at ${new Date().toISOString()}`);

  // Security: only Vercel Cron (or you) can call this
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    console.log("❌ Unauthorized cron attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // ── Step 1: Sync calendar so manually-created meetings are included ──
    try {
      const syncResult = await syncCalendarEvents();
      console.log(
        `🔄 Pre-reminder sync: ${syncResult.synced} synced, ${syncResult.skipped} skipped`,
      );
    } catch (syncErr) {
      // Don't let a sync failure block sending reminders for meetings
      // we already know about — just log it and continue.
      console.error("⚠️ Calendar sync failed (continuing anyway):", syncErr);
    }

    // ── Step 2: Check and send pending reminders ──
    const pending = await getPendingReminders();
    let sent = 0;
    let failed = 0;

    for (const { meeting, stage } of pending) {
      console.log(
        `📧 Sending ${stage.key} to ${meeting.clientEmail} for meeting "${meeting.summary}"`,
      );
      try {
        console.log("AUTO REMINDER DATA:", {
          to: meeting.clientEmail,
          clientName: meeting.clientName,
          meetingTitle: meeting.summary,
          startTime: meeting.startTime,
          meetLink: meeting.meetLink,
          timeZone: meeting.timeZone,
          stageLabel: stage.label,
        });
        await sendReminderEmail({
          to: meeting.clientEmail,
          clientName: meeting.clientName,
          meetingTitle: meeting.summary,
          startTime: meeting.startTime,
          meetLink: meeting.meetLink,
          timeZone: meeting.timeZone,
          stageLabel: stage.label,
        });
        await markStageSent(meeting.id, stage.key);
        sent++;
        console.log(`✅ Sent ${stage.key} to ${meeting.clientEmail}`);
      } catch (err) {
        console.error(`❌ Failed ${stage.key} for ${meeting.id}:`, err);
        failed++;
      }
    }

    console.log(
      `✅ CRON finished – checked ${pending.length}, sent ${sent}, failed ${failed}`,
    );
    return NextResponse.json({ checked: pending.length, sent, failed });
  } catch (err) {
    console.error("🔥 CRON handler crashed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}