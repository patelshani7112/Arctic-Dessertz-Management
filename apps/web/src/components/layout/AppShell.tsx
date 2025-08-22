import * as React from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  // Persist sidebar state (stays open until user closes)
  const [open, setOpen] = React.useState<boolean>(() => {
    return (
      typeof window !== "undefined" &&
      localStorage.getItem("sidebarOpen") === "1"
    );
  });
  React.useEffect(() => {
    if (typeof window !== "undefined")
      localStorage.setItem("sidebarOpen", open ? "1" : "0");
  }, [open]);

  return (
    <div className="min-h-screen">
      <Header onToggleSidebar={() => setOpen((v) => !v)} />
      {/* Sidebar is fixed; main adds left padding on md+ only when open */}
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <main
        className={`p-4 transition-[padding] duration-200 ${open ? "md:pl-72" : "md:pl-0"}`}
      >
        <div className="max-w-7xl mx-auto space-y-4">{children}</div>
      </main>
    </div>
  );
}
