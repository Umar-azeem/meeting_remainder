"use client";

import { useEffect, useState } from "react";

const TIME_ZONE = "America/New_York";

function getZonedParts(date: Date) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const parts = fmt.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  return {
    hour: Number(get("hour")) % 24,
    minute: Number(get("minute")),
    second: Number(get("second")),
    weekday: get("weekday"),
    month: get("month"),
    day: get("day"),
  };
}

/** A real ticking analog watch — always shows current time in America/New_York,
 *  the timezone every meeting on this app is scheduled against. */
export default function LiveWatch() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    return <div className="h-14 w-14 rounded-full border border-[#D6ECEF]" />;
  }

  const { hour, minute, second, weekday, month, day } = getZonedParts(now);
  const hourAngle = (hour % 12) * 30 + minute * 0.5;
  const minuteAngle = minute * 6 + second * 0.1;
  const secondAngle = second * 6;
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour >= 12 ? "PM" : "AM";
  const mm = String(minute).padStart(2, "0");

  const toXY = (angleDeg: number, r: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: 50 + r * Math.sin(rad), y: 50 - r * Math.cos(rad) };
  };
  const h = toXY(hourAngle, 22);
  const m = toXY(minuteAngle, 32);
  const sHand = toXY(secondAngle, 36);

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-14 w-14 shrink-0 rounded-full border-2 border-[#30ACBF] bg-white shadow-[0_2px_10px_rgba(48,172,191,0.28)]">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          {Array.from({ length: 12 }).map((_, i) => {
            const p1 = toXY(i * 30, 40);
            const p2 = toXY(i * 30, 45);
            return (
              <line
                key={i}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#0B3C42"
                strokeWidth={i % 3 === 0 ? 2.2 : 1}
                strokeLinecap="round"
                opacity={i % 3 === 0 ? 0.85 : 0.35}
              />
            );
          })}
          <line x1="50" y1="50" x2={h.x} y2={h.y} stroke="#0B3C42" strokeWidth="4" strokeLinecap="round" />
          <line x1="50" y1="50" x2={m.x} y2={m.y} stroke="#0B3C42" strokeWidth="2.6" strokeLinecap="round" />
          <line
            x1="50"
            y1="50"
            x2={sHand.x}
            y2={sHand.y}
            stroke="#30ACBF"
            strokeWidth="1.4"
            strokeLinecap="round"
            style={{ transition: "all 0.15s cubic-bezier(0.4,2.3,0.5,1)" }}
          />
          <circle cx="50" cy="50" r="3" fill="#30ACBF" />
        </svg>
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold tabular-nums text-[#0B3C42]">
          {hour12}:{mm} {ampm}
        </p>
        <p className="text-[11px] text-[#5C7D82]">
          {weekday}, {month} {day} · ET
        </p>
      </div>
    </div>
  );
}