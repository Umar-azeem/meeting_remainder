// // lib/reminderSchedule.ts
// // Computes the 7-reminder schedule for a meeting at creation time.
// //
// // Rules:
// //  - Always exactly 7 reminders.
// //  - Last two are fixed: 30min-before and 5min-before (when there's room).
// //  - First 5 are dynamic: spread across (createdAt -> 30min-before).
// //  - If <30min remaining at creation: drop the 30min stage, keep 5min,
// //    spread 6 dynamic reminders across (createdAt -> 5min-before).
// //  - If <=5min remaining at creation: fire all 7 immediately (same
// //    sendAt), each with a distinct key so nothing is skipped/duped.

// export interface ReminderSlot {
//   key: string;
//   label: string;
//   sendAt: string; // ISO timestamp, fixed at creation time
//   sent: boolean;
// }

// export function computeReminderSchedule(
//   createdAtMs: number,
//   startMs: number,
// ): ReminderSlot[] {
//   const at30 = startMs - 30 * 60_000;
//   const at5 = startMs - 5 * 60_000;

//   // ── Case A: normal — more than 30 min remaining at creation ──
//   if (at30 > createdAtMs) {
//     const span = at30 - createdAtMs;
//     const segments = 6; // 5 interior points, so none collide with the 30min mark
//     const dynamic: ReminderSlot[] = Array.from({ length: 5 }, (_, i) => {
//       const idx = i + 1;
//       return {
//         key: `d${idx}`,
//         label: `Reminder ${idx}`,
//         sendAt: new Date(createdAtMs + (span * idx) / segments).toISOString(),
//         sent: false,
//       };
//     });

//     return [
//       ...dynamic,
//       { key: "30min", label: "30 minutes", sendAt: new Date(at30).toISOString(), sent: false },
//       { key: "5min", label: "5 minutes", sendAt: new Date(at5).toISOString(), sent: false },
//     ];
//   }

//   // ── Case B: less than 30 min but more than 5 min remaining ──
//   if (at5 > createdAtMs) {
//     const span = at5 - createdAtMs;
//     const segments = 7; // 6 interior points, so none collide with the 5min mark
//     const dynamic: ReminderSlot[] = Array.from({ length: 6 }, (_, i) => {
//       const idx = i + 1;
//       return {
//         key: `d${idx}`,
//         label: `Reminder ${idx}`,
//         sendAt: new Date(createdAtMs + (span * idx) / segments).toISOString(),
//         sent: false,
//       };
//     });

//     return [
//       ...dynamic,
//       { key: "5min", label: "5 minutes", sendAt: new Date(at5).toISOString(), sent: false },
//     ];
//   }

//   // ── Case C: 5 min or less remaining (or meeting already effectively "now") ──
//   // Fire all 7 immediately, in order, each with a distinct key — the cron
//   // will send them all on its next pass with no duplicates.
//   const nowIso = new Date(createdAtMs).toISOString();
//   return Array.from({ length: 7 }, (_, i) => ({
//     key: `d${i + 1}`,
//     label: `Reminder ${i + 1}`,
//     sendAt: nowIso,
//     sent: false,
//   }));
// }

// lib/reminderSchedule.ts
// Computes 7 reminders: 5 dynamic (spread across creation→start) + 30min + 5min.

export interface ReminderSlot {
  key: string;
  label: string;
  sendAt: string; // ISO timestamp, fixed at creation time
  sent: boolean;
}

export function computeReminderSchedule(
  createdAtMs: number,
  startMs: number,
): ReminderSlot[] {
  // If meeting is already in the past (or exactly now), send all immediately.
  if (startMs <= createdAtMs) {
    const nowIso = new Date(createdAtMs).toISOString();
    return Array.from({ length: 7 }, (_, i) => ({
      key: `d${i + 1}`,
      label: `Reminder ${i + 1}`,
      sendAt: nowIso,
      sent: false,
    }));
  }

  const span = startMs - createdAtMs;
  const dynamic: ReminderSlot[] = [];

  // 5 dynamic reminders evenly spaced from createdAt to startMs.
  // Use fractions: 1/6, 2/6, 3/6, 4/6, 5/6 of the span.
  for (let i = 1; i <= 5; i++) {
    const sendAtMs = createdAtMs + (span * i) / 6;
    dynamic.push({
      key: `d${i}`,
      label: `Reminder ${i}`,
      sendAt: new Date(sendAtMs).toISOString(),
      sent: false,
    });
  }

  // Fixed reminders, capped to createdAt if they would be earlier.
  const fixed30 = Math.max(createdAtMs, startMs - 30 * 60 * 1000);
  const fixed5 = Math.max(createdAtMs, startMs - 5 * 60 * 1000);

  const fixedReminders: ReminderSlot[] = [
    {
      key: "30min",
      label: "30 minutes before",
      sendAt: new Date(fixed30).toISOString(),
      sent: false,
    },
    {
      key: "5min",
      label: "5 minutes before",
      sendAt: new Date(fixed5).toISOString(),
      sent: false,
    },
  ];

  // Combine all 7 reminders (dynamic + fixed) and sort by sendAt (optional).
  const all = [...dynamic, ...fixedReminders];
  all.sort((a, b) => new Date(a.sendAt).getTime() - new Date(b.sendAt).getTime());

  return all;
}