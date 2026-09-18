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

// ─── 7-stage color theme system ───────────────────────────────────
// Reminders move from calm/cool (far out) to hot/urgent (imminent).
// Each stage gets its own accent, gradient, badge copy, and headline tone.
interface StageTheme {
  accent: string;
  accentDark: string;
  gradientFrom: string;
  gradientTo: string;
  soft: string; // pale tint for backgrounds/cards
  border: string;
  badge: string;
  emoji: string;
  urgency: "calm" | "building" | "urgent";
}

const STAGE_THEMES: Record<string, StageTheme> = {
  "72h": {
    accent: "#182D88",
    accentDark: "#101F63",
    gradientFrom: "#182D88",
    gradientTo: "#34C3F0",
    soft: "#EEF1FC",
    border: "#C7D0F5",
    badge: "On the calendar",
    emoji: "🗓️",
    urgency: "calm",
  },
  "48h": {
    accent: "#6507E9",
    accentDark: "#4A05AD",
    gradientFrom: "#6507E9",
    gradientTo: "#182D88",
    soft: "#F3EBFE",
    border: "#D9C2FB",
    badge: "Coming up",
    emoji: "📅",
    urgency: "calm",
  },
  "24h": {
    accent: "#34C3F0",
    accentDark: "#1C9FC9",
    gradientFrom: "#34C3F0",
    gradientTo: "#6507E9",
    soft: "#E8F8FE",
    border: "#B9E9FA",
    badge: "Tomorrow",
    emoji: "⏳",
    urgency: "building",
  },
  "12h": {
    accent: "#63F807",
    accentDark: "#3FA800",
    gradientFrom: "#63F807",
    gradientTo: "#34C3F0",
    soft: "#EFFEE6",
    border: "#C9F7A9",
    badge: "Later today",
    emoji: "⏰",
    urgency: "building",
  },
  "1h": {
    accent: "#9D283F",
    accentDark: "#77192E",
    gradientFrom: "#9D283F",
    gradientTo: "#ED2C28",
    soft: "#FBEAED",
    border: "#F0C4CC",
    badge: "Within the hour",
    emoji: "⚡",
    urgency: "urgent",
  },
  "30min": {
    accent: "#ED2C28",
    accentDark: "#B81C19",
    gradientFrom: "#ED2C28",
    gradientTo: "#F71607",
    soft: "#FDEAEA",
    border: "#F8BEBD",
    badge: "Starting soon",
    emoji: "🔥",
    urgency: "urgent",
  },
  "5min": {
    accent: "#F71607",
    accentDark: "#B80F04",
    gradientFrom: "#F71607",
    gradientTo: "#9D283F",
    soft: "#FDE9E7",
    border: "#F8B9B3",
    badge: "Starting now",
    emoji: "🚨",
    urgency: "urgent",
  },
};

// Fallback for any stage label that doesn't exactly match a key above
// (e.g. different casing/spacing) — keeps the email from ever looking broken.
const DEFAULT_THEME: StageTheme = {
  accent: "#182D88",
  accentDark: "#101F63",
  gradientFrom: "#182D88",
  gradientTo: "#34C3F0",
  soft: "#EEF1FC",
  border: "#C7D0F5",
  badge: "Reminder",
  emoji: "🔔",
  urgency: "calm",
};

function getTheme(stageLabel: string): StageTheme {
  const key = stageLabel.trim().toLowerCase();
  const match = Object.entries(STAGE_THEMES).find(
    ([k]) => k.toLowerCase() === key
  );
  return match ? match[1] : DEFAULT_THEME;
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

    const theme = getTheme(stageLabel);
    const urgent = theme.urgency === "urgent";

    const safe = {
      clientName: esc(clientName),
      meetingTitle: esc(meetingTitle),
      stageLabel: esc(stageLabel),
      when: esc(when),
      meetLink: esc(meetLink),
    };

    const subject = urgent
      ? `${theme.emoji} Starting in ${stageLabel} — ${meetingTitle}`
      : `${theme.emoji} Reminder: ${meetingTitle} is ${stageLabel} away`;

    console.log("📨 Preparing reminder email:", {
      to,
      from: FROM,
      replyTo: REPLY_TO,
      clientName,
      meetingTitle,
      stageLabel,
      theme: theme.accent,
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
        <div style="background:#F4F6F8; padding:32px 16px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
          <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid ${theme.border}; box-shadow:0 4px 24px rgba(0,0,0,0.06);">

            <!-- Gradient header -->
            <div style="background-color:${theme.accent}; background-image:linear-gradient(135deg, ${theme.gradientFrom} 0%, ${theme.gradientTo} 100%); padding:28px 28px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:13px; font-weight:600; color:rgba(255,255,255,0.85); letter-spacing:0.02em;">
                    MeetFlow
                  </td>
                  <td align="right">
                    <span style="display:inline-block; background:rgba(255,255,255,0.2); color:#ffffff; font-size:11px; font-weight:700; padding:5px 12px; border-radius:20px; letter-spacing:0.02em;">
                      ${theme.emoji} ${esc(theme.badge)}
                    </span>
                  </td>
                </tr>
              </table>

              <h1 style="font-size:24px; font-weight:700; color:#ffffff; margin:20px 0 0; line-height:1.3;">
                ${urgent ? `Your meeting starts in ${safe.stageLabel}` : `${safe.stageLabel} until your meeting`}
              </h1>
            </div>

            <!-- Body -->
            <div style="padding:28px;">
              <p style="font-size:15px; line-height:1.6; margin:0 0 16px; color:#111111;">
                Hi ${safe.clientName},
              </p>

              <p style="font-size:15px; line-height:1.6; margin:0 0 20px; color:#111111;">
                Just a heads up — <strong>${safe.meetingTitle}</strong> is coming up. Here are the details:
              </p>

              <!-- Meeting card -->
              <div style="background:${theme.soft}; border:1px solid ${theme.border}; border-radius:12px; padding:18px 20px; margin:0 0 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-bottom:10px;">
                      <div style="font-size:11px; font-weight:700; letter-spacing:0.04em; color:${theme.accentDark}; text-transform:uppercase; margin-bottom:4px;">
                        Meeting
                      </div>
                      <div style="font-size:15px; font-weight:600; color:#111111;">
                        ${safe.meetingTitle}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div style="font-size:11px; font-weight:700; letter-spacing:0.04em; color:${theme.accentDark}; text-transform:uppercase; margin-bottom:4px;">
                        When
                      </div>
                      <div style="font-size:15px; font-weight:600; color:#111111;">
                        ${safe.when}
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
                <tr>
                  <td style="border-radius:10px; background-color:${theme.accent}; background-image:linear-gradient(135deg, ${theme.gradientFrom} 0%, ${theme.gradientTo} 100%);">
                    <a href="${safe.meetLink}" style="display:inline-block; padding:13px 28px; color:#ffffff; text-decoration:none; font-weight:700; font-size:14px; border-radius:10px;">
                      Join Google Meet →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size:12px; color:#8A8F98; margin:0 0 4px;">
                Or copy this link into your browser:
              </p>
              <p style="font-size:12px; color:${theme.accentDark}; margin:0 0 28px; word-break:break-all;">
                ${safe.meetLink}
              </p>

              <hr style="border:none; border-top:1px solid #EEF1F2; margin:0 0 16px;" />

              <p style="font-size:11px; color:#9AA0A6; line-height:1.6; margin:0;">
                MeetFlow · discoverymeetingcall.com<br />
                You received this email because a meeting was scheduled with your address.
                <br />
                <a href="mailto:${UNSUBSCRIBE_MAILTO}" style="color:#9AA0A6;">
                  Unsubscribe
                </a>
              </p>
            </div>
          </div>
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