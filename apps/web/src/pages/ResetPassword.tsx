// apps/web/src/pages/ResetPassword.tsx
import * as React from "react";
import { supabase } from "../lib/supabase"; // your existing browser client
import { useNavigate } from "react-router-dom";

function useToast() {
  const [msg, setMsg] = React.useState<string | null>(null);
  const timer = React.useRef<number | null>(null);
  const show = (m: string) => {
    setMsg(m);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), 5000);
  };
  const hide = () => {
    if (timer.current) window.clearTimeout(timer.current);
    setMsg(null);
  };
  const node = msg ? (
    <div className="fixed top-4 right-4 z-[1000]">
      <div className="rounded-lg shadow-lg border bg-white px-4 py-3 flex items-start gap-3">
        <div className="mt-0.5">✅</div>
        <div className="text-sm text-gray-800">{msg}</div>
        <button
          className="ml-2 text-gray-500 hover:text-gray-700"
          onClick={hide}
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  ) : null;
  return { show, hide, node };
}

export default function ResetPasswordPage() {
  const nav = useNavigate();
  const toast = useToast();
  const [pw1, setPw1] = React.useState("");
  const [pw2, setPw2] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function onSubmit() {
    if (!pw1 || pw1 !== pw2) {
      toast.show("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { data: session } = await supabase.auth.getSession(); // should exist from recovery link
    if (!session?.session) {
      setLoading(false);
      toast.show("Recovery link expired or invalid. Please request a new one.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    setLoading(false);
    if (error) {
      toast.show(error.message || "Failed to reset password");
      return;
    }
    toast.show("Password updated. You can now sign in.");
    setTimeout(() => nav("/login", { replace: true }), 1000);
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      {toast.node}
      <h1 className="text-xl font-semibold">Set a new password</h1>
      <input
        type="password"
        className="input w-full"
        placeholder="New password"
        value={pw1}
        onChange={(e) => setPw1(e.target.value)}
      />
      <input
        type="password"
        className="input w-full"
        placeholder="Confirm new password"
        value={pw2}
        onChange={(e) => setPw2(e.target.value)}
      />
      <button
        className="btn btn-primary w-full"
        onClick={onSubmit}
        disabled={loading}
      >
        {loading ? "Saving…" : "Save password"}
      </button>
      <div className="text-xs text-gray-600">
        Tip: If you got here without clicking an email link, request a reset
        from the Login page.
      </div>
    </div>
  );
}
