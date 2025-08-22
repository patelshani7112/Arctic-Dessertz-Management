import * as React from "react";
export function Avatar({ name }: { name?: string }) {
  const initials = (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() || "")
    .join("");
  return (
    <div className="w-9 h-9 rounded-full bg-brand-600 text-white grid place-items-center text-xs font-semibold">
      {initials || "?"}
    </div>
  );
}
