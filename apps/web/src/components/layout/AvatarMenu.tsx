import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Me } from "../../lib/api";
import { supabase } from "../../lib/supabase";
import { Avatar } from "../ui/Avatar";
import { Link } from "react-router-dom";

export function AvatarMenu() {
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: Me.get });
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        className="rounded-full"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar name={me?.full_name} />
      </button>
      <div
        className={`absolute right-0 mt-2 w-56 bg-white border rounded-xl shadow-card p-2 transition
          ${open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"}`}
        role="menu"
      >
        <div className="px-2 py-1.5">
          <div className="text-sm font-medium">{me?.full_name}</div>
          <div className="text-xs text-gray-600">{me?.email}</div>
        </div>
        <hr className="my-2" />
        <Link
          to="/app/profile"
          className="block px-3 py-2 text-sm rounded hover:bg-gray-100"
          onClick={() => setOpen(false)}
        >
          Profile
        </Link>
        <button
          className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100"
          onClick={async () => {
            await supabase.auth.signOut();
            location.href = "/login";
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
