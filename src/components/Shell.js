"use client";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ROLE_LABEL, initials } from "@/lib/utils";

export default function Shell({ session, nav, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 transform bg-ink-950 text-white transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-3 px-5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 font-bold">ส</div>
          <div className="text-sm font-semibold leading-tight">
            ติดตามงานอาจารย์
            <div className="text-[11px] font-normal text-white/50">วท.สันตพล</div>
          </div>
        </div>

        <nav className="mt-4 space-y-1 px-3">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                  active ? "bg-brand-600 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute inset-x-0 bottom-0 border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold"
              style={{ background: "rgba(255,255,255,.12)" }}>
              {initials(session.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{session.name}</div>
              <div className="text-[11px] text-white/50">@{session.username} · {ROLE_LABEL[session.role]}</div>
            </div>
          </div>
          <Link href="/change-password"
            className="mt-1 flex w-full items-center rounded-xl px-3.5 py-2.5 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white">
            🔑 เปลี่ยนรหัสผ่าน
          </Link>
          <button onClick={logout}
            className="w-full rounded-xl px-3.5 py-2.5 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white">
            ↪ ออกจากระบบ
          </button>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Main */}
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-ink-100 bg-white/80 px-4 backdrop-blur lg:px-8 no-print">
          <button className="rounded-lg p-2 hover:bg-ink-100 lg:hidden" onClick={() => setOpen(true)}>
            ☰
          </button>
          <div className="flex-1" />
          <div className="grid h-9 w-9 place-items-center rounded-full text-sm font-semibold text-white"
            style={{ background: "#3361f6" }}>
            {initials(session.name)}
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
