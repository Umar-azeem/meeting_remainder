// app/api/cron/send-reminders/route.ts
// ─────────────────────────────────────────────────────────────────
// TRIGGERED BY: Vercel Cron — runs automatically every 5 minutes
// WHAT IT DOES:
//   Checks ALL saved meetings in Redis and sends an email for each
//   reminder stage that is due:
//     72h before → sends "72 hours to go" email
//     48h before → sends "48 hours to go" email
//     24h before → sends "24 hours to go" email
//     12h before → sends "12 hours to go" email
//     30min before → sends "30 minutes to go" email
//     5min before  → sends "5 minutes — starting now!" email
//   Each stage is only sent ONCE per meeting (tracked in Redis)
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getPendingReminders, markStageSent } from "@/components/lib/meetingsStore";
import { sendReminderEmail } from "@/components/lib/email";

export async function GET(req: NextRequest) {
  // Security: only Vercel Cron (or you) can call this
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pending = await getPendingReminders();
  let sent = 0;
  let failed = 0;

  for (const { meeting, stage } of pending) {
    try {
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
    } catch (err) {
      console.error(`Failed ${stage.key} reminder for ${meeting.id}:`, err);
      failed++;
    }
  }

  return NextResponse.json({ checked: pending.length, sent, failed });
}