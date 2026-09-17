"use client";

import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  RefreshCw,
  Send,
  ExternalLink,
  Loader2,
  Video,
  Inbox,
  CheckCircle2,
  XCircle,
  User,
  CalendarClock,
  Users,
  ChevronLeft,
  ChevronRight,
  BellOff,
} from "lucide-react";

type RsvpStatus = "needsAction" | "accepted" | "declined" | "tentative";

interface Meeting {
  id: string;
  summary: string;
  clientName: string;
  clientEmail: string;
  startTime: string;
  meetLink: string;
  timeZone: string;
  reminders: any[];
  rsvpStatus?: RsvpStatus;
  inviteSent?: boolean;
}

type Msg = { id: string; text: string; success?: boolean } | null;

const PAGE_SIZE = 50;

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageStart: number;
  totalCount: number;
  setPage: Dispatch<SetStateAction<number>>;
}

function Pagination({
  currentPage,
  totalPages,
  pageStart,
  totalCount,
  setPage,
}: PaginationProps) {
  if (totalCount <= PAGE_SIZE) return null;

  const pages: (number | "…")[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs text-[#5C7D82]">
        Showing{" "}
        <span className="font-semibold text-[#0B3C42]">{pageStart + 1}</span>–
        <span className="font-semibold text-[#0B3C42]">
          {Math.min(pageStart + PAGE_SIZE, totalCount)}
        </span>{" "}
        of <span className="font-semibold text-[#0B3C42]">{totalCount}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D6ECEF] bg-white text-[#30ACBF] transition-colors hover:bg-[#F0FAFB] disabled:opacity-30"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((p, i) =>
          p === "…" ? (
            <span
              key={`ellipsis-${i}`}
              className="px-1.5 text-sm text-[#9BB6BA]"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-semibold transition-colors ${
                p === currentPage
                  ? "bg-[#30ACBF] text-white"
                  : "border border-[#D6ECEF] bg-white text-[#4C6A6F] hover:bg-[#F0FAFB]"
              }`}
            >
              {p}
            </button>
          ),
        )}

        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D6ECEF] bg-white text-[#30ACBF] transition-colors hover:bg-[#F0FAFB] disabled:opacity-30"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   RSVP badge — shows invite acceptance status from the API
   ───────────────────────────────────────────────────────────── */
function RsvpBadge({ status }: { status?: RsvpStatus }) {
  const resolved: RsvpStatus = status ?? "needsAction";

  const map: Record<
    RsvpStatus,
    { label: string; bg: string; fg: string; dot: string }
  > = {
    accepted:    { label: "Accepted",  bg: "#E6F7EC", fg: "#1B7F3A", dot: "#22C55E" },
    declined:    { label: "Declined",  bg: "#FDECEC", fg: "#B91C1C", dot: "#EF4444" },
    tentative:   { label: "Tentative", bg: "#FFF6E5", fg: "#92610A", dot: "#F59E0B" },
    needsAction: { label: "Pending",   bg: "#EEF2F4", fg: "#4C6A6F", dot: "#94A3B8" },
  };

  const m = map[resolved];

  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide"
      style={{ background: m.bg, color: m.fg }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: m.dot }}
      />
      {m.label}
    </span>
  );
}

function InviteWarning() {
  return (
    <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#B45309]">
      <BellOff className="h-2.5 w-2.5" />
      Invite not sent
    </span>
  );
}

function MeetingLists() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [message, setMessage] = useState<Msg>(null);
  const [page, setPage] = useState(1);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/meetings");
      const data = await res.json();

      if (Array.isArray(data)) {
        setMeetings(data);
        setPage(1);
      } else {
        console.error("API returned non-array:", data);
        setMeetings([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  // Only meetings starting from yesterday through the next 30 days,
  // oldest first (yesterday's meetings at the top, furthest-out at the bottom).
  const sortedMeetings = useMemo(() => {
    const now = new Date();
    const rangeStart = new Date(now);
    rangeStart.setDate(rangeStart.getDate() - 1);
    rangeStart.setHours(0, 0, 0, 0);

    const rangeEnd = new Date(now);
    rangeEnd.setDate(rangeEnd.getDate() + 30);
    rangeEnd.setHours(23, 59, 59, 999);

    return meetings
      .filter((m) => {
        const t = new Date(m.startTime).getTime();
        return t >= rangeStart.getTime() && t <= rangeEnd.getTime();
      })
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );
  }, [meetings]);

  const totalPages = Math.max(1, Math.ceil(sortedMeetings.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageMeetings = sortedMeetings.slice(pageStart, pageStart + PAGE_SIZE);

  const sendReminder = async (meeting: Meeting) => {
    setSending(meeting.id);
    setMessage(null);
    try {
      const payload = {
        clientName: meeting.clientName,
        clientEmail: meeting.clientEmail,
        summary: meeting.summary,
        meetLink: meeting.meetLink,
        startTime: meeting.startTime,
        timeZone: meeting.timeZone,
      };
      const res = await fetch("/api/send-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ id: meeting.id, text: "Reminder sent!", success: true });
      } else {
        setMessage({
          id: meeting.id,
          text: `Failed: ${data.error || data.message}`,
          success: false,
        });
      }
    } catch (err: any) {
      setMessage({
        id: meeting.id,
        text: `Error: ${err.message}`,
        success: false,
      });
    } finally {
      setSending(null);
    }
  };

  const ReminderButton = ({
    meeting,
    full = false,
  }: {
    meeting: Meeting;
    full?: boolean;
  }) => (
    <button
      onClick={() => sendReminder(meeting)}
      disabled={sending === meeting.id}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#30ACBF] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#279AAC] disabled:opacity-60 ${
        full ? "w-full py-2" : "w-fit"
      }`}
    >
      {sending === meeting.id ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending
        </>
      ) : (
        <>
          <Send className="h-3.5 w-3.5" /> Send reminder
        </>
      )}
    </button>
  );

  const StatusMsg = ({ id }: { id: string }) =>
    message && message.id === id ? (
      <span
        className={`inline-flex items-center gap-1 text-xs font-medium ${
          message.success ? "text-[#1E7C8C]" : "text-red-600"
        }`}
      >
        {message.success ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : (
          <XCircle className="h-3.5 w-3.5" />
        )}
        {message.text}
      </span>
    ) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF7F9] sm:flex">
            <Users className="h-5 w-5 text-[#30ACBF]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#0B3C42]">Meetings</h2>
            <p className="text-sm text-[#5C7D82]">
              {loading ? "Loading…" : `${sortedMeetings.length} scheduled`}
            </p>
          </div>
        </div>
        <button
          onClick={fetchMeetings}
          disabled={loading}
          className="flex shrink-0 items-center gap-2 rounded-xl border border-[#D6ECEF] bg-white px-3 py-2 text-sm font-semibold text-[#279AAC] transition-colors hover:bg-[#F0FAFB] disabled:opacity-60 sm:px-3.5"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-[#D6ECEF] bg-white py-16">
          <Loader2 className="h-5 w-5 animate-spin text-[#30ACBF]" />
        </div>
      ) : sortedMeetings.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#D6ECEF] bg-[#FAFEFE] px-4 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF7F9]">
            <Inbox className="h-6 w-6 text-[#30ACBF]" />
          </div>
          <p className="text-sm font-medium text-[#0B3C42]">No meetings yet</p>
          <p className="max-w-xs text-sm text-[#5C7D82]">
            Meetings you schedule will show up here with their reminder history.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: stacked cards (below sm) */}
          <div className="flex flex-col gap-3 sm:hidden">
            {pageMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="rounded-2xl border border-[#D6ECEF] bg-white p-4 shadow-[0_2px_14px_rgba(11,60,66,0.05)]"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold leading-snug text-[#0B3C42]">
                    {meeting.summary}
                  </h3>
                  <a
                    href={meeting.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex shrink-0 items-center gap-1 rounded-lg bg-[#F0FAFB] px-2 py-1 text-xs font-semibold text-[#279AAC]"
                  >
                    <Video className="h-3.5 w-3.5" />
                    Join
                  </a>
                </div>

                <div className="mb-3 space-y-1.5 text-xs text-[#4C6A6F]">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 shrink-0 text-[#30ACBF]" />
                    <span className="font-medium text-[#0B3C42]">
                      {meeting.clientName}
                    </span>
                    <span className="text-[#9BB6BA]">
                      · {meeting.clientEmail}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5 shrink-0 text-[#30ACBF]" />
                    {new Date(meeting.startTime).toLocaleString()}
                  </div>
                </div>

                {/* RSVP badge + invite warning (mobile) */}
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <RsvpBadge status={meeting.rsvpStatus} />
                  {meeting.inviteSent === false && <InviteWarning />}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <ReminderButton meeting={meeting} full />
                </div>
                <div className="mt-2">
                  <StatusMsg id={meeting.id} />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop / tablet: table (sm and up) */}
          <div className="hidden overflow-hidden rounded-2xl border border-[#D6ECEF] bg-white shadow-[0_2px_20px_rgba(11,60,66,0.06)] sm:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse">
                <thead>
                  <tr className="border-b border-[#D6ECEF] bg-[#FAFEFE]">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5C7D82]">
                      Meeting
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5C7D82]">
                      Client
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5C7D82]">
                      RSVP
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5C7D82]">
                      Start (local)
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5C7D82]">
                      Meet link
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5C7D82]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageMeetings.map((meeting, i) => (
                    <tr
                      key={meeting.id}
                      className={`${
                        i !== pageMeetings.length - 1
                          ? "border-b border-[#EEF5F6]"
                          : ""
                      } transition-colors hover:bg-[#FAFEFE]`}
                    >
                      <td className="px-5 py-4 text-sm font-semibold text-[#0B3C42]">
                        {meeting.summary}
                      </td>
                      <td className="px-5 py-4 text-sm text-[#4C6A6F]">
                        <div>{meeting.clientName}</div>
                        <div className="text-xs text-[#9BB6BA]">
                          {meeting.clientEmail}
                        </div>
                      </td>

                      {/* RSVP cell */}
                      <td className="px-5 py-4 text-sm">
                        <RsvpBadge status={meeting.rsvpStatus} />
                        {meeting.inviteSent === false && <InviteWarning />}
                      </td>

                      <td className="px-5 py-4 text-sm text-[#4C6A6F]">
                        {new Date(meeting.startTime).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-sm">
                        <a
                          href={meeting.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-semibold text-[#279AAC] hover:text-[#1E7C8C]"
                        >
                          <Video className="h-3.5 w-3.5" /> Join
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                      <td className="px-5 py-4 text-sm">
                        <div className="flex flex-col gap-1.5">
                          <ReminderButton meeting={meeting} />
                          <StatusMsg id={meeting.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageStart={pageStart}
            totalCount={sortedMeetings.length}
            setPage={setPage}
          />
        </>
      )}
    </div>
  );
}

export default MeetingLists;