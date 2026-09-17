"use client";

import { useState } from "react";
import ScheduleMeetingForm from "@/components/ScheduleMeetingForm";
import MeetingLists from "@/components/meetingList";
import LiveWatch from "@/components/Livewatch";
import HelpGuide from "@/components/Helpguide";
import { CalendarPlus, HelpCircle, Users, Video } from "lucide-react";
import Link from "next/link";

type Tab = "schedule" | "meetings" | "help";

const TABS: { id: Tab; label: string; icon: typeof CalendarPlus }[] = [
  { id: "schedule", label: "Schedule", icon: CalendarPlus },
  { id: "meetings", label: "Meetings", icon: Users },
  { id: "help", label: "Help", icon: HelpCircle },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("schedule");

  return (
    <div className="min-h-screen bg-[#F7FBFC]">
      {/* Loads the type pairing used across this page — move into your root layout if you prefer. */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .font-display { font-family: 'Space Grotesk', sans-serif; }
      `}</style>

      <header className="sticky top-0 z-40 border-b border-[#D6ECEF] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#30ACBF]">
              <Video className="h-[18px] w-[18px] text-white" />
            </div>
            <span className="font-display text-base font-bold text-[#0B3C42]">
              MeetFlow
            </span>
          </div>

          <nav className="flex items-center gap-1 rounded-xl bg-[#F0FAFB] p-1">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-[#30ACBF] text-white shadow-[0_2px_8px_rgba(48,172,191,0.35)]"
                      : "text-[#5C7D82] hover:text-[#0B3C42]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right side: Privacy / Terms links + LiveWatch clock */}
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-3 text-xs font-semibold text-[#5C7D82]">
              <Link
                href="/privacy"
                className="transition-colors hover:text-[#0B3C42]"
              >
                Privacy
              </Link>
              <span className="text-[#D6ECEF]">·</span>
              <Link
                href="/terms"
                className="transition-colors hover:text-[#0B3C42]"
              >
                Terms
              </Link>
            </div>

            <div className="hidden md:block">
              <LiveWatch />
            </div>
          </div>
        </div>
      </header>

      <main>
        {tab === "schedule" && <ScheduleMeetingForm />}
        {tab === "meetings" && <MeetingLists />}
        {tab === "help" && <HelpGuide />}
      </main>
    </div>
  );
}