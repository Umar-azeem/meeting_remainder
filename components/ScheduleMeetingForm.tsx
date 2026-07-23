"use client";
// components/ScheduleMeetingForm.tsx
// Shows two sections after scheduling:
// AUTO  → tells user reminders will fire automatically
// MANUAL → button to send an instant reminder right now

import React, { useState } from "react";

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

  /**
   * Convert a date+time string (interpreted as America/New_York)
   * to an ISO 8601 string with the correct UTC offset.
   */
  function getStartTimeISO(dateStr: string, timeStr: string): string {
    // 1. Build a UTC Date for the given date/time (as if it were UTC)
    const utcDate = new Date(`${dateStr}T${timeStr}:00Z`);

    // 2. Get the time zone offset (in minutes) for America/New_York on that date
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(utcDate);
    const offsetPart = parts.find((p) => p.type === "timeZoneName");
    if (!offsetPart) {
      throw new Error("Could not determine time zone offset");
    }

    // 3. Parse offset like "GMT-4" or "GMT-5"
    const offsetStr = offsetPart.value;
    const match = offsetStr.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (!match) {
      throw new Error(`Unexpected offset format: ${offsetStr}`);
    }
    const sign = match[1] === "+" ? 1 : -1;
    const hours = parseInt(match[2], 10);
    const minutes = match[3] ? parseInt(match[3], 10) : 0;
    const offsetMinutes = sign * (hours * 60 + minutes);

    // 4. Adjust UTC time to get the wall time in New York
    const nyTime = utcDate.getTime() - offsetMinutes * 60000;
    const nyDate = new Date(nyTime);

    // 5. Build the ISO string with the correct offset
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
  }

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <h1 style={s.title}>Schedule Client Meeting</h1>
        <p style={s.subtitle}>
          Creates a Google Meet event and sends automatic reminder emails to your client.
          All times are in <strong>America/New_York</strong>.
        </p>

        {status !== "success" && (
          <form onSubmit={handleSchedule} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Meeting title</label>
              <input
                style={s.input}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="e.g. Project Kickoff"
                required
              />
            </div>

            <div style={s.row}>
              <div style={s.field}>
                <label style={s.label}>Client name</label>
                <input
                  style={s.input}
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="John Smith"
                  required
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Client email</label>
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

            <div style={s.row}>
              <div style={s.field}>
                <label style={s.label}>Date</label>
                <input
                  type="date"
                  style={s.input}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Time</label>
                <input
                  type="time"
                  style={s.input}
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
              <div style={{ ...s.field, maxWidth: 120 }}>
                <label style={s.label}>Duration (min)</label>
                <input
                  type="number"
                  min={15}
                  step={15}
                  style={s.input}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                />
              </div>
            </div>

            <button
              style={s.btnBlue}
              disabled={status === "submitting"}
              type="submit"
            >
              {status === "submitting" ? "Scheduling..." : "📅 Schedule Meeting"}
            </button>

            {status === "error" && (
              <div style={s.errorBox}>❌ {errorMsg}</div>
            )}
          </form>
        )}

        {/* SUCCESS STATE */}
        {status === "success" && (
          <div style={s.results}>
            {/* AUTO block */}
            <div style={s.autoBox}>
              <div style={s.boxHeader}>
                <span style={s.tagBlue}>AUTO</span>
                <span style={s.boxTitle}>Google Calendar event created</span>
              </div>
              <p style={s.boxDesc}>
                Your client <strong>{clientEmail}</strong> received a calendar invite
                from Google. Reminder emails will be sent automatically at:
              </p>
              <div style={s.stageRow}>
                {["72h", "48h", "24h", "12h", "30min", "5min"].map((t) => (
                  <span key={t} style={s.stageTag}>
                    {t}
                  </span>
                ))}
              </div>
              <a
                href={resultLink!}
                target="_blank"
                rel="noreferrer"
                style={s.calLink}
              >
                View in Google Calendar →
              </a>
            </div>

            {/* MANUAL block */}
            <div style={s.manualBox}>
              <div style={s.boxHeader}>
                <span style={s.tagPurple}>MANUAL</span>
                <span style={s.boxTitle}>Send a reminder right now</span>
              </div>
              <p style={s.boxDesc}>
                Click below to instantly send a reminder email to{" "}
                <strong>{clientEmail}</strong> with the Google Meet link. Use this
                anytime you want to notify them manually.
              </p>
              <button
                style={{ ...s.btnPurple, opacity: manualSending ? 0.7 : 1 }}
                onClick={handleSendNow}
                disabled={manualSending}
              >
                {manualSending ? "Sending..." : "⚡ Send Reminder Email Now"}
              </button>
              {manualSent && (
                <p style={s.sentMsg}>✅ Reminder sent to {clientEmail}</p>
              )}
            </div>

            <button style={s.resetBtn} onClick={handleReset}>
              + Schedule Another Meeting
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
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: 32,
    maxWidth: 520,
    width: "100%",
    boxShadow: "0 2px 16px rgba(0,0,0,0.09)",
  },
  title: { fontSize: 22, fontWeight: 700, margin: "0 0 6px", color: "#111" },
  subtitle: { fontSize: 13, color: "#666", margin: "0 0 24px", lineHeight: 1.6 },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  row: { display: "flex", gap: 12 },
  field: { display: "flex", flexDirection: "column", gap: 5, flex: 1 },
  label: { fontSize: 13, fontWeight: 500, color: "#444" },
  input: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #e0e3e8",
    fontSize: 14,
    outline: "none",
    background: "#fafafa",
    color: "#111",
    width: "100%",
    boxSizing: "border-box" as const,
  },
  btnBlue: {
    marginTop: 6,
    padding: "13px 16px",
    borderRadius: 10,
    border: "none",
    background: "#1a73e8",
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    width: "100%",
  },
  errorBox: {
    padding: "12px 16px",
    borderRadius: 8,
    background: "#fff0f0",
    border: "1px solid #fca5a5",
    fontSize: 13,
    color: "#c0392b",
  },
  results: { display: "flex", flexDirection: "column", gap: 16 },
  autoBox: {
    padding: 20,
    borderRadius: 12,
    background: "#f0f7ff",
    border: "1px solid #bfdbfe",
  },
  manualBox: {
    padding: 20,
    borderRadius: 12,
    background: "#faf5ff",
    border: "1px solid #e9d5ff",
  },
  boxHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  boxTitle: { fontSize: 14, fontWeight: 700, color: "#111" },
  boxDesc: { fontSize: 13, color: "#555", margin: "0 0 12px", lineHeight: 1.5 },
  tagBlue: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.06em",
    background: "#1a73e8",
    color: "#fff",
    padding: "3px 8px",
    borderRadius: 20,
  },
  tagPurple: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.06em",
    background: "#7c3aed",
    color: "#fff",
    padding: "3px 8px",
    borderRadius: 20,
  },
  stageRow: { display: "flex", flexWrap: "wrap" as const, gap: 6, marginBottom: 12 },
  stageTag: {
    fontSize: 11,
    fontWeight: 600,
    color: "#1a73e8",
    background: "#dbeafe",
    padding: "3px 10px",
    borderRadius: 20,
  },
  calLink: { fontSize: 13, color: "#1a73e8", fontWeight: 600 },
  btnPurple: {
    padding: "11px 20px",
    borderRadius: 8,
    border: "none",
    background: "#7c3aed",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  sentMsg: { margin: "10px 0 0", fontSize: 13, color: "#5b21b6" },
  resetBtn: {
    padding: "11px 16px",
    borderRadius: 8,
    border: "1px solid #e0e3e8",
    background: "#fff",
    color: "#444",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    width: "100%",
  },
};