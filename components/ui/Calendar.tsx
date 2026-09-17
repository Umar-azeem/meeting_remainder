"use client";

import * as React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { DayPicker } from "react-day-picker";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Self-contained: no dependency on "@/lib/utils" or any other path, so a
// mismatched cn() import can't break this file.
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function CustomDropdown({ value, onChange, children, ...rest }: any) {
  const options = React.Children.toArray(children) as React.ReactElement<
    React.HTMLProps<HTMLOptionElement>
  >[];
  const selected = options.find((child) => child.props.value === value);

  return (
    <div className="relative inline-flex items-center rounded-md border border-[#D6ECEF] bg-white px-2 py-1 transition-colors hover:border-[#30ACBF]">
      <select
        {...rest}
        value={value}
        onChange={onChange}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      >
        {children}
      </select>
      <span className="pointer-events-none flex items-center gap-1 text-sm font-semibold text-[#0B3C42]">
        {selected?.props?.children}
        <ChevronDown className="h-3.5 w-3.5 text-[#30ACBF]" />
      </span>
    </div>
  );
}

// Typed loosely on purpose: react-day-picker's DayPicker props are a
// discriminated union keyed on `mode`, which is awkward to re-export and
// destructure precisely. `any` here trades a bit of type safety for a
// component that compiles cleanly against v8.x regardless of exact minor
// version, and matches how the component is actually used (mode="single").
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "dropdown",
  onSelect,
  selected,
  ...props
}: any) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      selected={selected}
      onSelect={onSelect}
      className={cn("p-4", className)}
      classNames={{
        months: "flex flex-col",
        month: "space-y-3",
        caption: "flex justify-between items-center pt-1 pb-2 relative",
        caption_label: "text-sm font-semibold text-[#0B3C42]",
        caption_dropdowns: "flex items-center gap-1.5",
        nav: "flex items-center gap-1",
        nav_button:
          "h-7 w-7 flex items-center justify-center rounded-md border border-[#D6ECEF] text-[#30ACBF] bg-white hover:bg-[#F0FAFB] hover:border-[#30ACBF] transition-colors disabled:opacity-30 disabled:pointer-events-none",
        nav_button_previous: "",
        nav_button_next: "",
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell: "text-[#5C7D82] rounded-md w-9 font-medium text-[0.75rem]",
        row: "flex w-full mt-1",
        cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
        day: "h-9 w-9 p-0 font-normal rounded-md text-[#10262A] hover:bg-[#EAF7F9] transition-colors aria-selected:opacity-100",
        day_selected:
          "!bg-[#30ACBF] !text-white hover:!bg-[#279AAC] focus:!bg-[#30ACBF] rounded-md font-semibold",
        day_today: "border border-[#30ACBF] text-[#0B3C42] font-semibold",
        day_outside: "text-[#B9CDD0] opacity-50",
        day_disabled: "text-[#B9CDD0] opacity-40",
        day_hidden: "invisible",
        vis_hidden: "hidden",
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronUp className="h-4 w-4" />,
        IconRight: () => <ChevronDown className="h-4 w-4" />,
        Dropdown: CustomDropdown,
      }}
      footer={
        <div className="mt-3 flex items-center justify-between border-t border-[#EEF5F6] pt-3">
          <button
            type="button"
            onClick={() => onSelect?.(undefined)}
            className="text-sm font-semibold text-[#279AAC] hover:text-[#1E7C8C]"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => onSelect?.(new Date())}
            className="text-sm font-semibold text-[#279AAC] hover:text-[#1E7C8C]"
          >
            Today
          </button>
        </div>
      }
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };