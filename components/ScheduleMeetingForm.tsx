"use client";
// components/ScheduleMeetingForm.tsx
// Shows two sections after scheduling:
// AUTO  → tells user reminders will fire automatically
// MANUAL → button to send an instant reminder right now
//
// 👇 Responsive pass: rows stack on narrow screens, card padding/typography
// scale down, and touch targets stay comfortable on mobile.

import React, { useState } from "react";
import {
  CalendarDays,
  Clock,
  User,
  Mail,
  Video,
  Send,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  Loader2,
  AlertCircle,
  Hourglass,
  BellRing,
  BellOff,
} from "lucide-react";

const TIME_ZONE = "America/New_York";

type Status = "idle" | "submitting" | "success" | "error";

export default function ScheduleMeetingForm() {
  const [summary, setSummary] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [status, setStatus] = useState<Status>("idle");
  const [resultLink, setResultLink] = useState<string | null>(null);
  const [savedMeetLink, setSavedMeetLink] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualSending, setManualSending] = useState(false);
  const [manualSent, setManualSent] = useState(false);
  const [sendInvite, setSendInvite] = useState(true);

  /**
   * Convert a date+time string (interpreted as America/New_York)
   * to an ISO 8601 string with the correct UTC offset.
   */
  function getStartTimeISO(dateStr: string, timeStr: string): string {
    const utcDate = new Date(`${dateStr}T${timeStr}:00Z`);

    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(utcDate);
    const offsetPart = parts.find((p) => p.type === "timeZoneName");
    if (!offsetPart) {
      throw new Error("Could not determine time zone offset");
    }

    const offsetStr = offsetPart.value;
    const match = offsetStr.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (!match) {
      throw new Error(`Unexpected offset format: ${offsetStr}`);
    }
    const sign = match[1] === "+" ? 1 : -1;
    const hours = parseInt(match[2], 10);
    const minutes = match[3] ? parseInt(match[3], 10) : 0;
    const offsetMinutes = sign * (hours * 60 + minutes);

    const nyTime = utcDate.getTime() - offsetMinutes * 60000;
    const nyDate = new Date(nyTime);

    const year = nyDate.getUTCFullYear();
    const month = String(nyDate.getUTCMonth() + 1).padStart(2, "0");
    const day = String(nyDate.getUTCDate()).padStart(2, "0");
    const hh = String(nyDate.getUTCHours()).padStart(2, "0");
    const mm = String(nyDate.getUTCMinutes()).padStart(2, "0");
    const ss = String(nyDate.getUTCSeconds()).padStart(2, "0");

    const absOffset = Math.abs(offsetMinutes);
    const offsetH = String(Math.floor(absOffset / 60)).padStart(2, "0");
    const offsetM = String(absOffset % 60).padStart(2, "0");
    const offsetSign = offsetMinutes >= 0 ? "+" : "-";
    const offset = `${offsetSign}${offsetH}:${offsetM}`;

    return `${year}-${month}-${day}T${hh}:${mm}:${ss}${offset}`;
  }

  // STEP 1 ── Schedule meeting via Google Calendar
  async function handleSchedule(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg(null);

    const startTimeISO = getStartTimeISO(date, time);
    const startTime = new Date(startTimeISO);
    const endTime = new Date(startTime.getTime() + duration * 60_000);

    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary,
          clientName,
          clientEmail,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          timeZone: TIME_ZONE,
          sendUpdates: sendInvite ? "all" : "none",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      setResultLink(data.htmlLink);
      setSavedMeetLink(data.meetLink);
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to schedule meeting");
      setStatus("error");
    }
  }

  // STEP 2 ── Send a manual reminder email right now
  async function handleSendNow() {
    if (!savedMeetLink) return;
    setManualSending(true);
    setManualSent(false);

    const startTimeISO = getStartTimeISO(date, time);

    try {
      const res = await fetch("/api/send-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          clientEmail,
          summary,
          meetLink: savedMeetLink,
          startTime: startTimeISO,
          timeZone: TIME_ZONE,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setManualSent(true);
    } catch {
      alert("Manual reminder failed — check terminal for error.");
    } finally {
      setManualSending(false);
    }
  }

  function handleReset() {
    setStatus("idle");
    setResultLink(null);
    setSavedMeetLink(null);
    setManualSent(false);
    setSummary("");
    setClientName("");
    setClientEmail("");
    setDate("");
    setTime("");
    setDuration(30);
    setSendInvite(true);
  }

  return (
    <div style={s.wrap} className="smf-wrap">
      <div style={s.card} className="smf-card">
        <h1 style={s.title} className="smf-title">
          Schedule Client Meeting
        </h1>
        <p style={s.subtitle}>
          Creates a Google Meet event and sends automatic reminder emails to your client.
          All times are in <strong style={{ color: "#30ACBF" }}>America/New_York</strong>.
        </p>

        {status !== "success" && (
          <form onSubmit={handleSchedule} style={s.form}>
            {/* Meeting Title */}
            <div style={s.field}>
              <label style={s.label}>Meeting title</label>
              <div style={s.inputWrapper}>
                <Video size={16} style={s.iconLeft} color="#30ACBF" />
                <input
                  style={s.input}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="e.g. Project Kickoff"
                  required
                />
              </div>
            </div>

            {/* Client Name & Email */}
            <div style={s.row} className="smf-row">
              <div style={s.field}>
                <label style={s.label}>Client name</label>
                <div style={s.inputWrapper}>
                  <User size={16} style={s.iconLeft} color="#30ACBF" />
                  <input
                    style={s.input}
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="John Smith"
                    required
                  />
                </div>
              </div>
              <div style={s.field}>
                <label style={s.label}>Client email</label>
                <div style={s.inputWrapper}>
                  <Mail size={16} style={s.iconLeft} color="#30ACBF" />
                  <input
                    type="email"
                    style={s.input}
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="john@company.com"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Date, Time, Duration */}
            <div style={s.row} className="smf-row smf-row-3">
              <div style={{ ...s.field, flex: 1.3 }} className="smf-field-date">
                <label style={s.label}>Date</label>
                <div style={s.inputWrapper}>
                  <CalendarDays size={16} style={s.iconLeft} color="#30ACBF" />
                  <input
                    type="date"
                    style={{ ...s.input, paddingLeft: 38 }}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div style={{ ...s.field, flex: 1 }} className="smf-field-time">
                <label style={s.label}>Time</label>
                <div style={s.inputWrapper}>
                  <Clock size={16} style={s.iconLeft} color="#30ACBF" />
                  <input
                    type="time"
                    style={{ ...s.input, paddingLeft: 38 }}
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div style={{ ...s.field, maxWidth: 120 }} className="smf-field-duration">
                <label style={s.label}>Duration</label>
                <div style={s.inputWrapper}>
                  <Hourglass size={16} style={s.iconLeft} color="#30ACBF" />
                  <input
                    type="number"
                    min={15}
                    step={15}
                    style={{ ...s.input, paddingLeft: 38 }}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Send invite toggle */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "12px 14px",
                background: "#f0fbfc",
                border: "1px solid #b3e0e8",
                borderRadius: 10,
              }}
            >
              <input
                id="sendInvite"
                type="checkbox"
                checked={sendInvite}
                onChange={(e) => setSendInvite(e.target.checked)}
                style={{
                  width: 16,
                  height: 16,
                  marginTop: 2,
                  accentColor: "#30ACBF",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              />
              <label
                htmlFor="sendInvite"
                style={{
                  fontSize: 13,
                  color: "#0B3C42",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <strong>Send invitation email to the client</strong>
                <span
                  style={{
                    display: "block",
                    fontSize: 11,
                    color: "#5C7D82",
                    marginTop: 2,
                    fontWeight: 400,
                  }}
                >
                  If off, the event is still added to your Google Calendar, but the
                  guest won&apos;t be notified.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              style={s.btnPrimary}
              disabled={status === "submitting"}
              type="submit"
            >
              {status === "submitting" ? (
                <>
                  <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                  Scheduling...
                </>
              ) : (
                <>
                  <CalendarDays size={18} />
                  Schedule Meeting
                </>
              )}
            </button>

            {status === "error" && (
              <div style={s.errorBox}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                {errorMsg}
              </div>
            )}
          </form>
        )}

        {/* SUCCESS STATE */}
        {status === "success" && (
          <div style={s.results}>
            {/* AUTO block */}
            <div style={s.autoBox} className="smf-box">
              <div style={s.boxHeader}>
                <span style={s.tagPrimary}>AUTO</span>
                <span style={s.boxTitle}>Google Calendar event created</span>
              </div>
              <p style={s.boxDesc}>
                {sendInvite ? (
                  <>
                    Your client <strong>{clientEmail}</strong> received a calendar invite
                    from Google. Reminder emails will be sent automatically at:
                  </>
                ) : (
                  <>
                    The event was added to your Google Calendar. No invite email was sent
                    to <strong>{clientEmail}</strong>. Reminder emails will still be sent
                    automatically at:
                  </>
                )}
              </p>
              <div style={s.stageRow}>
                {["72h", "48h", "24h", "12h", "30min", "5min"].map((t) => (
                  <span key={t} style={s.stageTag}>
                    {t}
                  </span>
                ))}
              </div>

              <p
                style={{
                  ...s.sentMsg,
                  marginTop: 0,
                  marginBottom: 10,
                  color: sendInvite ? "#1E7C8C" : "#B45309",
                }}
              >
                {sendInvite ? (
                  <>
                    <BellRing size={14} /> Invite sent to {clientEmail}
                  </>
                ) : (
                  <>
                    <BellOff size={14} /> Invite not sent — client wasn&apos;t notified
                  </>
                )}
              </p>

              <a
                href={resultLink!}
                target="_blank"
                rel="noreferrer"
                style={s.calLink}
              >
                View in Google Calendar
                <ExternalLink size={14} style={{ marginLeft: 6 }} />
              </a>
            </div>

            {/* MANUAL block */}
            <div style={s.manualBox} className="smf-box">
              <div style={s.boxHeader}>
                <span style={s.tagSecondary}>MANUAL</span>
                <span style={s.boxTitle}>Send a reminder right now</span>
              </div>
              <p style={s.boxDesc}>
                Click below to instantly send a reminder email to{" "}
                <strong>{clientEmail}</strong> with the Google Meet link. Use this
                anytime you want to notify them manually.
              </p>
              <button
                style={{ ...s.btnSecondary, opacity: manualSending ? 0.7 : 1 }}
                className="smf-btn-secondary"
                onClick={handleSendNow}
                disabled={manualSending}
              >
                {manualSending ? (
                  <>
                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send Reminder Email Now
                  </>
                )}
              </button>
              {manualSent && (
                <p style={s.sentMsg}>
                  <CheckCircle2 size={16} />
                  Reminder sent to {clientEmail}
                </p>
              )}
            </div>

            <button style={s.resetBtn} onClick={handleReset}>
              <RotateCcw size={16} />
              Schedule Another Meeting
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f0f2f5",
    padding: 24,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    boxSizing: "border-box" as const,
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: 32,
    maxWidth: 540,
    width: "100%",
    boxShadow: "0 2px 20px rgba(48, 172, 191, 0.08)",
    border: "1px solid #e8f0f1",
    boxSizing: "border-box" as const,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    margin: "0 0 6px",
    color: "#0B3C42",
  },
  subtitle: {
    fontSize: 13,
    color: "#5C7D82",
    margin: "0 0 24px",
    lineHeight: 1.6,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  row: {
    display: "flex",
    gap: 12,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "#0B3C42",
    letterSpacing: "0.02em",
  },
  inputWrapper: {
    position: "relative" as const,
    width: "100%",
  },
  iconLeft: {
    position: "absolute" as const,
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none" as const,
  },
  input: {
    padding: "10px 12px 10px 38px",
    borderRadius: 8,
    border: "1px solid #dce8ea",
    fontSize: 16, // 16px prevents iOS Safari from auto-zooming on focus
    outline: "none",
    background: "#fafefe",
    color: "#10262A",
    width: "100%",
    boxSizing: "border-box" as const,
    transition: "all 0.2s",
    fontFamily: "inherit",
  },
  btnPrimary: {
    marginTop: 6,
    padding: "13px 16px",
    borderRadius: 10,
    border: "none",
    background: "#30ACBF",
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "all 0.2s",
  },
  errorBox: {
    padding: "12px 16px",
    borderRadius: 8,
    background: "#fff0f0",
    border: "1px solid #fca5a5",
    fontSize: 13,
    color: "#c0392b",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  results: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  autoBox: {
    padding: 20,
    borderRadius: 12,
    background: "#f0fbfc",
    border: "1px solid #b3e0e8",
    boxSizing: "border-box" as const,
  },
  manualBox: {
    padding: 20,
    borderRadius: 12,
    background: "#f5fbfc",
    border: "1px solid #d4edf0",
    boxSizing: "border-box" as const,
  },
  boxHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
    flexWrap: "wrap" as const,
  },
  boxTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0B3C42",
  },
  boxDesc: {
    fontSize: 13,
    color: "#4C6A6F",
    margin: "0 0 12px",
    lineHeight: 1.5,
  },
  tagPrimary: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.06em",
    background: "#30ACBF",
    color: "#fff",
    padding: "3px 8px",
    borderRadius: 20,
  },
  tagSecondary: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.06em",
    background: "#1E7C8C",
    color: "#fff",
    padding: "3px 8px",
    borderRadius: 20,
  },
  stageRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 6,
    marginBottom: 12,
  },
  stageTag: {
    fontSize: 11,
    fontWeight: 600,
    color: "#30ACBF",
    background: "#e6f6f8",
    padding: "4px 12px",
    borderRadius: 20,
    border: "1px solid #cdeef2",
  },
  calLink: {
    fontSize: 13,
    color: "#30ACBF",
    fontWeight: 600,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },
  btnSecondary: {
    padding: "11px 20px",
    borderRadius: 8,
    border: "none",
    background: "#30ACBF",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "all 0.2s",
  },
  sentMsg: {
    margin: "10px 0 0",
    fontSize: 13,
    color: "#1E7C8C",
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontWeight: 500,
  },
  resetBtn: {
    padding: "11px 16px",
    borderRadius: 8,
    border: "1px solid #dce8ea",
    background: "#fff",
    color: "#4C6A6F",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "all 0.2s",
  },
};

// Add global styles for animations + responsive breakpoints
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    input:focus {
      border-color: #30ACBF !important;
      background: #ffffff !important;
      box-shadow: 0 0 0 3px rgba(48, 172, 191, 0.15) !important;
    }
    button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(48, 172, 191, 0.25);
    }
    button:active {
      transform: translateY(0);
    }
    a:hover {
      color: #1E7C8C !important;
    }

    /* ── Mobile responsiveness ───────────────────────────── */
    @media (max-width: 640px) {
      .smf-wrap {
        padding: 12px !important;
        align-items: flex-start !important;
      }
      .smf-card {
        padding: 20px !important;
        border-radius: 14px !important;
      }
      .smf-title {
        font-size: 19px !important;
      }
      .smf-row {
        flex-direction: column !important;
        gap: 14px !important;
      }
      /* Date/Time stay side by side even when stacked from the 3rd column,
         Duration drops to its own full-width row */
      .smf-row-3 {
        flex-wrap: wrap !important;
        flex-direction: row !important;
      }
      .smf-field-date,
      .smf-field-time {
        flex: 1 1 45% !important;
      }
      .smf-field-duration {
        flex: 1 1 100% !important;
        max-width: 100% !important;
      }
      .smf-box {
        padding: 16px !important;
      }
      .smf-btn-secondary {
        width: 100% !important;
      }
    }

    @media (max-width: 380px) {
      .smf-row-3 {
        flex-direction: column !important;
      }
      .smf-field-date,
      .smf-field-time,
      .smf-field-duration {
        flex: 1 1 100% !important;
        max-width: 100% !important;
      }
    }
  `;
  document.head.appendChild(style);
}