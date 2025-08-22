// import * as React from "react";
// import { supabase } from "../lib/supabase";

// export default function Login() {
//   const [email, setEmail] = React.useState("");
//   const [password, setPassword] = React.useState("");
//   const [err, setErr] = React.useState<string | null>(null);
//   return (
//     <div className="min-h-screen grid place-items-center p-6">
//       <div className="w-full max-w-sm space-y-3">
//         <h1 className="text-2xl font-semibold">Sign in</h1>
//         <input
//           className="w-full border rounded p-2"
//           placeholder="Email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//         />
//         <input
//           className="w-full border rounded p-2"
//           placeholder="Password"
//           type="password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//         />
//         {err && <div className="text-red-600 text-sm">{err}</div>}
//         <button
//           className="w-full bg-black text-white rounded p-2"
//           onClick={async () => {
//             const { error } = await supabase.auth.signInWithPassword({
//               email,
//               password,
//             });
//             if (error) setErr(error.message);
//             else window.location.href = "/app";
//           }}
//         >
//           Continue
//         </button>
//       </div>
//     </div>
//   );
// }

// apps/web/src/pages/Login.tsx
import * as React from "react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [showPw, setShowPw] = React.useState(false);

  const canSubmit = email.trim() !== "" && password.trim() !== "";
  const isValidEmail = (v: string) => /^\S+@\S+\.\S+$/.test(v);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setErr(null);

    if (!isValidEmail(email)) {
      setErr("Please enter a valid email address.");
      return;
    }
    if (!password.trim()) {
      setErr("Please enter your password.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      setErr(error.message || "Sign in failed. Please try again.");
      return;
    }
    window.location.href = "/app";
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 p-6">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="card overflow-hidden">
          <div className="h-1 bg-brand-600" />
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold">Sign in</h1>
              <p className="text-sm text-gray-600">
                Welcome back. Please enter your details.
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm text-gray-700">Email</label>
              <div className="mt-1 relative">
                <input
                  className={`input w-full pr-10 ${err && !isValidEmail(email) ? "border-red-400" : ""}`}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  inputMode="email"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  ✉️
                </span>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm text-gray-700">Password</label>
              <div className="mt-1 relative">
                <input
                  className={`input w-full pr-10 ${err && !password ? "border-red-400" : ""}`}
                  placeholder="••••••••"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
              <div className="mt-2 text-right">
                <a
                  href="/reset-password"
                  className="text-sm text-brand-700 hover:underline"
                >
                  Forgot password?
                </a>
              </div>
            </div>

            {/* Error */}
            {err && (
              <div className="text-red-600 text-sm bg-red-50 border border-red-100 rounded px-3 py-2">
                {err}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary w-full inline-flex items-center justify-center gap-2"
              disabled={!canSubmit || loading}
            >
              {loading && (
                <span className="inline-block h-4 w-4 border-2 border-current border-b-transparent rounded-full animate-spin" />
              )}
              Continue
            </button>
          </form>
        </div>

        {/* Small footer */}
        <div className="text-center text-xs text-gray-500 mt-3">
          Need help? Contact your manager or admin.
        </div>
      </div>
    </div>
  );
}
