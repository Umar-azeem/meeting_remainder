"use client";

import {
  CalendarPlus,
  Clock3,
  Video,
  BellRing,
  Zap,
  CheckCircle2,
  HelpCircle,
  Mail,
} from "lucide-react";

const steps = [
  {
    icon: CalendarPlus,
    title: "Fill in the meeting details",
    body: "Open the Schedule tab and enter a meeting title, your client's name, and their email address. This is who receives the calendar invite and every reminder.",
  },
  {
    icon: Clock3,
    title: "Pick a date, time, and duration",
    body: "Use the calendar to choose a date and set a start time. Every time you enter is treated as America/New_York — your client sees it converted to their own local time automatically.",
  },
  {
    icon: Video,
    title: 'Click "Schedule Meeting"',
    body: "This creates a Google Calendar event with a Google Meet link and sends your client a calendar invite instantly — no separate email needed.",
  },
  {
    icon: BellRing,
    title: "Automatic reminders take over",
    body: "Once scheduled, reminder emails go out on their own at 72h, 48h, 24h, 12h, 30min, and 5min before the meeting. You don't need to do anything else.",
  },
  {
    icon: Zap,
    title: "Send a manual nudge anytime",
    body: 'Need to remind someone right now, outside the automatic schedule? Use "Send Reminder Email Now" on the confirmation screen, or the Send Reminder button in the Meetings tab.',
  },
];

const faqs = [
  {
    q: "What timezone are meetings scheduled in?",
    a: "All times you enter are interpreted as America/New_York. The live watch in the header always shows the current time in that zone so you know exactly what your client will see.",
  },
  {
    q: "Can I resend a reminder after the meeting is created?",
    a: 'Yes. Every meeting in the Meetings tab has its own "Send Reminder" button that fires an instant email with the Meet link.',
  },
  {
    q: "What happens if scheduling fails?",
    a: "You'll see an error message inline on the form explaining why. Nothing is created until Google Calendar confirms the event, so it's always safe to try again.",
  },
];

export default function HelpGuide() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF7F9]">
          <HelpCircle className="h-6 w-6 text-[#30ACBF]" />
        </div>
        <h1 className="text-2xl font-bold text-[#0B3C42]">How meeting scheduling works</h1>
        <p className="mt-2 text-sm text-[#5C7D82]">
          A quick walkthrough of setting up a meeting and how reminders are handled.
        </p>
      </div>

      <ol className="relative space-y-8 border-l border-[#D6ECEF] pl-8">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <li key={step.title} className="relative">
              <span className="absolute -left-[41px] flex h-8 w-8 items-center justify-center rounded-full bg-[#30ACBF] text-white shadow-[0_2px_8px_rgba(48,172,191,0.35)]">
                <Icon className="h-4 w-4" />
              </span>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#30ACBF]">
                Step {i + 1}
              </p>
              <h3 className="mt-1 text-base font-semibold text-[#0B3C42]">{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[#5C7D82]">{step.body}</p>
            </li>
          );
        })}
      </ol>

      <div className="mt-12 rounded-2xl border border-[#D6ECEF] bg-[#F0FAFB] p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#0B3C42]">
          <CheckCircle2 className="h-4 w-4 text-[#30ACBF]" />
          Frequently asked questions
        </h2>
        <div className="space-y-5">
          {faqs.map((f) => (
            <div key={f.q}>
              <p className="text-sm font-medium text-[#0B3C42]">{f.q}</p>
              <p className="mt-1 text-sm leading-relaxed text-[#5C7D82]">{f.a}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#D6ECEF] bg-white p-5">
        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#30ACBF]" />
        <p className="text-sm text-[#5C7D82]">
          Still stuck? Reminder emails and calendar invites are sent from the Google account
          connected to this app — double-check that account first if a client says they
          didn't receive anything.
        </p>
      </div>
    </div>
  );
}