// app/api/sync-calendar/route.ts
// Manual trigger to sync Google Calendar events into Redis.
// (The cron job also calls this same logic automatically before
// checking for pending reminders — this route is just for on-demand
// manual syncing, e.g. testing or a "Sync now" button.)

import { NextResponse } from "next/server";
import { syncCalendarEvents } from "@/components/lib/syncCalendar";

export async function GET() {
  try {
    const result = await syncCalendarEvents();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("FULL ERROR:", error);

    return NextResponse.json(
      {
        error: "Sync failed",
        message: error.message,
        details: error.response?.data || error.errors || null,
      },
      {
        status: 500,
      }
    );
  }
}