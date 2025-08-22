import * as React from "react";

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
) {
  return (
    <button
      {...props}
      className={
        "px-4 py-2 rounded-xl shadow text-sm font-medium border border-gray-300 hover:bg-gray-50 " +
        (props.className || "")
      }
    />
  );
}