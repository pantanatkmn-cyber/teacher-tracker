"use client";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui";
import { ROLE_LABEL } from "@/lib/utils";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const d = await fetch("/api/users").then((r) => r.json());
    setUsers(d.users || []);
  }
  useEffect(() => { load(); }, []);

  async function patch(id, body) {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) { const e = await res.json(); alert(e.error); }
    load();
  }

  async function remove(id) {
    if (!confirm("ลบบัญชีนี้ถาวร? ข้อมูลงานที่เกี่ยวข้องจะถูกลบด้วย")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (!res.ok) { const e = await res.json(); alert(e.error); }
    load();
  }

  async function resetPwd(id, name) {
    if (!confirm(`รีเซ็ตรหัสผ่านของ ${name} กลับเป็น 123456?`)) return;
    await patch(id, { reset_password: true });
    alert("รีเซ็ตรหัสผ่านเป็น 123456 แล้ว (ผู้ใช้จะต้องเปลี่ยนเมื่อเข้าครั้งถัดไป)");
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">จัดการผู้ใช้</h1>
          <p className="mt-1 text-sm text-ink-500">เพิ่ม ลบ แก้ไข และแต่งตั้งบทบาทผู้ใช้ในระบบ</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">+ เพิ่มผู้ใช้</button>
      </div>

      {showForm && <NewUserForm onClose={() => setShowForm(false)} onDone={() => { setShowForm(false); load(); }} />}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-left text-xs text-ink-500">
              <tr>
                <th className="px-5 py-3">ผู้ใช้</th>
                <th className="px-3 py-3">บทบาท</th>
                <th className="px-3 py-3">สถานะ</th>
                <th className="px-5 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.full_name} color={u.avatar_color} />
                      <div>
                        <div className="font-medium text-ink-900">{u.full_name}</div>
                        <div className="text-xs text-ink-400">
                          @{u.username}
                          {u.must_change_password && (
                            <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">ยังไม่เปลี่ยนรหัส</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <select value={u.role} onChange={(e) => patch(u.id, { role: e.target.value })}
                      className="rounded-lg border border-ink-200 bg-white px-2 py-1 text-sm">
                      <option value="teacher">{ROLE_LABEL.teacher}</option>
                      <option value="head">{ROLE_LABEL.head}</option>
                      <option value="admin">{ROLE_LABEL.admin}</option>
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <button onClick={() => patch(u.id, { is_active: !u.is_active })}
                      className={`badge ${u.is_active ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-ink-100 text-ink-500 ring-ink-600/10"}`}>
                      {u.is_active ? "ใช้งาน" : "ระงับ"}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-3 text-xs">
                      <button onClick={() => resetPwd(u.id, u.full_name)} className="text-brand-600 hover:underline">รีเซ็ตรหัส</button>
                      <button onClick={() => remove(u.id)} className="text-rose-500 hover:underline">ลบ</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function NewUserForm({ onClose, onDone }) {
  const [f, setF] = useState({ full_name: "", username: "", role: "teacher" });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true); setErr("");
    const res = await fetch("/api/users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    if (!res.ok) { const e = await res.json(); setErr(e.error); setSaving(false); return; }
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-md p-6">
        <h2 className="font-display text-xl font-bold">เพิ่มผู้ใช้ใหม่</h2>
        <div className="mt-4 space-y-4">
          <div><label className="label">ชื่อ-สกุล</label>
            <input className="input" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
          <div><label className="label">ชื่อผู้ใช้ (สำหรับเข้าสู่ระบบ)</label>
            <input className="input" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} placeholder="เช่น somchai" /></div>
          <div><label className="label">บทบาท</label>
            <select className="input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
              <option value="teacher">{ROLE_LABEL.teacher}</option>
              <option value="head">{ROLE_LABEL.head}</option>
              <option value="admin">{ROLE_LABEL.admin}</option>
            </select></div>
          <div className="rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-700">
            รหัสผ่านเริ่มต้นคือ <span className="font-mono font-semibold">123456</span> — ผู้ใช้จะต้องเปลี่ยนเมื่อเข้าสู่ระบบครั้งแรก
          </div>
          {err && <div className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{err}</div>}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">ยกเลิก</button>
          <button onClick={save} disabled={saving || !f.full_name || !f.username} className="btn-primary">
            {saving ? "กำลังบันทึก..." : "เพิ่มผู้ใช้"}
          </button>
        </div>
      </div>
    </div>
  );
}
