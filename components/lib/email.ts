// lib/email.ts
// Sends reminder emails via Resend.
// Server-only — never import this from a "use client" component.

import { Resend } from "resend";

// ─── Env validation (fail fast at module load) ───────────────────
const RESEND_API_KEY = process.env.RESEND_API_KEY;
if (!RESEND_API_KEY) {
  throw new Error("Missing RESEND_API_KEY");
}

// Read env var, then narrow to a plain `string` constant.
const FROM_ENV = process.env.REMINDER_FROM_EMAIL;
if (!FROM_ENV) {
  throw new Error(
    "REMINDER_FROM_EMAIL is not set. Refusing to send from the Resend sandbox. " +
      "Set it to something like: reminders@discoverymeetingcall.com"
  );
}
const FROM: string = FROM_ENV;

const REPLY_TO: string =
  process.env.REMINDER_REPLY_TO || "support@discoverymeetingcall.com";

const UNSUBSCRIBE_MAILTO: string =
  process.env.REMINDER_UNSUBSCRIBE_EMAIL ||
  "unsubscribe@discoverymeetingcall.com";

const resend = new Resend(RESEND_API_KEY);

// ─── HTML escaping for anything injected into the template ───────
function esc(input: string | undefined | null): string {
  return String(input ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── Type for the function arguments ─────────────────────────────
export interface SendReminderEmailArgs {
  to: string;
  clientName: string;
  meetingTitle: string;
  startTime: string;
  meetLink: string;
  timeZone: string;
  stageLabel: string;
}

export async function sendReminderEmail({
  to,
  clientName,
  meetingTitle,
  startTime,
  meetLink,
  timeZone,
  stageLabel,
}: SendReminderEmailArgs) {
  try {
    const when = new Date(startTime).toLocaleString("en-GB", {
      timeZone,
      dateStyle: "full",
      timeStyle: "short",
    });

    const urgent =
      stageLabel.includes("minute") ||
      stageLabel.includes("minutes") ||
      stageLabel.includes("hours");

    const safe = {
      clientName: esc(clientName),
      meetingTitle: esc(meetingTitle),
      stageLabel: esc(stageLabel),
      when: esc(when),
      meetLink: esc(meetLink),
    };

    const subject = urgent
      ? `Meeting starts in ${stageLabel} — ${meetingTitle}`
      : `Reminder: ${meetingTitle} is ${stageLabel} away`;

    console.log("📨 Preparing reminder email:", {
      to,
      from: FROM,
      replyTo: REPLY_TO,
      clientName,
      meetingTitle,
      stageLabel,
    });

    const response = await resend.emails.send({
      from: FROM,
      to,
      replyTo: REPLY_TO,

      headers: {
        "List-Unsubscribe": `<mailto:${UNSUBSCRIBE_MAILTO}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        "X-Entity-Ref-ID": `meetflow-${Date.now()}`,
      } as Record<string, string>,

      subject,

      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif; max-width:560px; margin:0 auto; padding:24px; background:#ffffff; color:#111111;">
          <p style="font-size:13px; color:#666; margin:0 0 24px;">
            MeetFlow · Meeting reminder
          </p>

          <h1 style="font-size:20px; font-weight:600; margin:0 0 16px; color:#0B3C42;">
            ${urgent ? `Starts in ${safe.stageLabel}` : `Coming up in ${safe.stageLabel}`}
          </h1>

          <p style="font-size:15px; line-height:1.6; margin:0 0 16px;">
            Hi ${safe.clientName},
          </p>

          <p style="font-size:15px; line-height:1.6; margin:0 0 16px;">
            Your meeting <strong>${safe.meetingTitle}</strong> is scheduled for:
          </p>

          <p style="font-size:15px; line-height:1.6; margin:0 0 24px; padding:12px 16px; background:#F0FAFB; border-left:3px solid #30ACBF;">
            ${safe.when}
          </p>

          <p style="font-size:15px; line-height:1.6; margin:0 0 24px;">
            <a href="${safe.meetLink}" style="display:inline-block; background:#30ACBF; color:#ffffff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600; font-size:14px;">
              Join Google Meet
            </a>
          </p>

          <p style="font-size:13px; color:#666; margin:0 0 8px;">
            Or copy this link into your browser:
          </p>
          <p style="font-size:13px; color:#666; margin:0 0 32px; word-break:break-all;">
            ${safe.meetLink}
          </p>

          <hr style="border:none; border-top:1px solid #EEF5F6; margin:32px 0 16px;" />

          <p style="font-size:11px; color:#999; line-height:1.5; margin:0;">
            MeetFlow · discoverymeetingcall.com<br />
            You received this email because a meeting was scheduled with your address.
            <br />
            <a href="mailto:${UNSUBSCRIBE_MAILTO}" style="color:#999;">
              Unsubscribe
            </a>
          </p>
        </div>
      `,
    });

    if (response.error) {
      console.error("❌ RESEND REJECTED:", {
        name: response.error.name,
        message: response.error.message,
        to,
        from: FROM,
      });
      throw new Error(`Resend rejected: ${response.error.message}`);
    }

    console.log("✅ Resend accepted:", {
      id: response.data?.id,
      to,
      subject,
    });

    return response;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("❌ SEND EMAIL ERROR:", msg);
    throw error;
  }
}