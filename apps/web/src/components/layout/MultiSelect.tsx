// apps/web/src/components/ui/MultiSelect.tsx
import * as React from "react";

type Opt = { value: string; label: string };

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder,
  className = "",
  size = 6,
}: {
  options: Opt[];
  value: string[];
  onChange: (vals: string[]) => void;
  placeholder?: string;
  className?: string;
  size?: number; // visible rows
}) {
  return (
    <div className={`w-full ${className}`}>
      {placeholder && (
        <div className="text-xs text-gray-500 mb-1">{placeholder}</div>
      )}
      <select
        multiple
        size={size}
        className="input h-auto"
        value={value}
        onChange={(e) => {
          const vals = Array.from(e.target.selectedOptions).map((o) => o.value);
          onChange(vals);
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
