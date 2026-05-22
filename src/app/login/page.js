"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "เข้าสู่ระบบไม่สำเร็จ");
        setLoading(false);
        return;
      }
      const dest = data.must_change
        ? "/change-password"
        : data.role === "admin" ? "/admin" : data.role === "head" ? "/dashboard" : "/my";
      router.push(dest);
      router.refresh();
    } catch {
      setErr("เกิดข้อผิดพลาด ลองใหม่อีกครั้ง");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* ฝั่งซ้าย: แบรนด์ */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-brand-950 p-12 text-white">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #3361f6 0, transparent 40%), radial-gradient(circle at 80% 60%, #1a2c8a 0, transparent 45%)",
          }}
        />
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-xl font-bold ring-1 ring-white/20">ส</div>
            <div className="text-sm font-medium leading-tight text-white/80">
              วิทยาลัยเทคโนโลยีสันตพล
            </div>
          </div>
        </div>
        <div className="relative">
          <h1 className="font-display text-4xl font-extrabold leading-tight">
            ระบบติดตามงาน<br />อาจารย์
          </h1>
          <p className="mt-4 max-w-sm text-white/70">
            แผนกอุตสาหกรรมดิจิทัลและเทคโนโลยีสารสนเทศ — บริหารงาน มอบหมาย ติดตามความคืบหน้า และประเมินผลในที่เดียว
          </p>
        </div>
        <div className="relative text-xs text-white/50">© {new Date().getFullYear()} Santapol Technological College</div>
      </div>

      {/* ฝั่งขวา: ฟอร์ม */}
      <div className="flex min-h-screen items-center justify-center p-6 lg:min-h-0">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-brand-600 text-xl font-bold text-white">ส</div>
            <h1 className="font-display text-xl font-bold">ระบบติดตามงานอาจารย์</h1>
          </div>

          <h2 className="font-display text-2xl font-bold text-ink-900">เข้าสู่ระบบ</h2>
          <p className="mt-1 text-sm text-ink-500">กรุณาเข้าสู่ระบบด้วยบัญชีที่ได้รับ</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <div>
              <label className="label">ชื่อผู้ใช้</label>
              <input className="input" type="text" value={username} required autoComplete="username"
                onChange={(e) => setUsername(e.target.value)} placeholder="username" />
            </div>
            <div>
              <label className="label">รหัสผ่าน</label>
              <input className="input" type="password" value={password} required
                onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            {err && (
              <div className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-rose-600/20">
                {err}
              </div>
            )}
            <button className="btn-primary w-full py-3" disabled={loading}>
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-ink-400">
            ผู้ใช้ใหม่: รหัสผ่านเริ่มต้นคือ <span className="font-mono font-semibold text-ink-600">123456</span> (ระบบจะให้เปลี่ยนเมื่อเข้าครั้งแรก)
          </p>
        </div>
      </div>
    </div>
  );
}
