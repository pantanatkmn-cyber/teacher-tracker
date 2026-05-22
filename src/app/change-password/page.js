"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [cur, setCur] = useState("");
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then(setMe).catch(() => {});
  }, []);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (pwd.length < 6) return setErr("รหัสผ่านใหม่ต้องยาวอย่างน้อย 6 ตัว");
    if (pwd !== confirm) return setErr("รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน");
    setSaving(true);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current_password: cur, new_password: pwd }),
    });
    if (!res.ok) {
      const e = await res.json();
      setErr(e.error || "เปลี่ยนรหัสไม่สำเร็จ");
      setSaving(false);
      return;
    }
    const dest = me?.role === "admin" ? "/admin" : me?.role === "head" ? "/dashboard" : "/my";
    router.push(dest);
    router.refresh();
  }

  const forced = me?.must_change;

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 p-6">
      <div className="card w-full max-w-sm p-7">
        <h1 className="font-display text-2xl font-bold text-ink-900">เปลี่ยนรหัสผ่าน</h1>
        <p className="mt-1 text-sm text-ink-500">
          {forced
            ? "กรุณาตั้งรหัสผ่านใหม่ก่อนเริ่มใช้งานระบบ"
            : "ตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ"}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {!forced && (
            <div>
              <label className="label">รหัสผ่านเดิม</label>
              <input type="password" className="input" value={cur}
                onChange={(e) => setCur(e.target.value)} />
            </div>
          )}
          <div>
            <label className="label">รหัสผ่านใหม่</label>
            <input type="password" className="input" value={pwd}
              onChange={(e) => setPwd(e.target.value)} placeholder="อย่างน้อย 6 ตัว" />
          </div>
          <div>
            <label className="label">ยืนยันรหัสผ่านใหม่</label>
            <input type="password" className="input" value={confirm}
              onChange={(e) => setConfirm(e.target.value)} />
          </div>
          {err && <div className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{err}</div>}
          <button className="btn-primary w-full" disabled={saving}>
            {saving ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
          </button>
        </form>
      </div>
    </div>
  );
}
