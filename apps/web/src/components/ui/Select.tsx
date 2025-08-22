import * as React from "react";
export function Select({
  value,
  onChange,
  options,
  disabled,
  className,
}: {
  value?: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  className?: string;
}) {
  return (
    <select
      className={
        "border rounded-lg px-2 py-1.5 text-sm disabled:opacity-50 bg-white " +
        (className || "")
      }
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
