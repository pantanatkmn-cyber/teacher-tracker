"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export default function ManageTasks() {
  const [tasks, setTasks] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  async function load() {
    const [tRes, uRes] = await Promise.all([
      fetch("/api/tasks").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ]);
    setTasks(tRes.tasks || []);
    setTeachers((uRes.users || []).filter((u) => ["teacher", "head"].includes(u.role) && u.is_active));
  }
  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">จัดการงาน</h1>
          <p className="mt-1 text-sm text-ink-500">โพสต์งานใหม่และติดตามความคืบหน้ารายบุคคล</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">+ โพสต์งานใหม่</button>
      </div>

      {showForm && (
        <NewTaskForm
          teachers={teachers}
          onClose={() => setShowForm(false)}
          onDone={() => { setShowForm(false); load(); }}
        />
      )}

      <div className="space-y-3">
        {tasks.length === 0 && (
          <div className="card p-12 text-center text-ink-400">ยังไม่มีงาน คลิก "โพสต์งานใหม่" เพื่อเริ่ม</div>
        )}
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} onClick={() => router.push(`/dashboard/tasks/${t.id}`)} />
        ))}
      </div>
    </div>
  );
}

/* ─── Task summary card ─── */
function TaskCard({ task: t, onClick }) {
  const deadline = t.end_date || t.due_date;
  const isOverdue = deadline && new Date() > new Date(deadline);
  const submitPct = t.total > 0 ? Math.round(((t.submitted + t.late) / t.total) * 100) : 0;

  return (
    <div
      onClick={onClick}
      className="card group cursor-pointer p-5 transition-all hover:shadow-md hover:ring-2 hover:ring-brand-200 active:scale-[0.99]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-semibold text-ink-900 group-hover:text-brand-700 transition-colors">
              {t.title}
            </h3>
            {t.attachment_url && (
              <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-xs text-brand-600">📎</span>
            )}
          </div>
          {t.description && (
            <p className="mt-0.5 line-clamp-1 text-sm text-ink-500">{t.description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-400">
            {t.start_date && <span>เริ่ม: {formatDate(t.start_date)}</span>}
            {deadline && (
              <span className={isOverdue ? "font-semibold text-rose-500" : ""}>
                สิ้นสุด: {formatDate(deadline)}{isOverdue ? " ⚠️" : ""}
              </span>
            )}
            {t.term && <span>เทอม: {t.term}</span>}
            <span>จำนวน: {t.total_parts || 1} ส่วน</span>
            <span>โพสต์: {formatDate(t.created_at)}</span>
          </div>
        </div>
        <span className="text-xs text-brand-500 group-hover:text-brand-700 transition-colors">ดูรายละเอียด →</span>
      </div>

      {/* progress bar รวม */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs text-ink-400">
          <div className="flex gap-3">
            <span className="text-emerald-600 font-medium">ส่งแล้ว {t.submitted}</span>
            <span className="text-rose-500 font-medium">ส่งช้า {t.late}</span>
            <span className="text-amber-500 font-medium">รอ {t.pending}</span>
          </div>
          <span>{submitPct}% ({t.submitted + t.late}/{t.total} คน)</span>
        </div>
        {/* multi-color bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
          {t.total > 0 && (
            <div className="flex h-full">
              <div className="bg-emerald-500 transition-all" style={{ width: `${(t.submitted / t.total) * 100}%` }} />
              <div className="bg-rose-400 transition-all" style={{ width: `${(t.late / t.total) * 100}%` }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   ฟอร์มโพสต์งานใหม่
───────────────────────────────────────── */
function NewTaskForm({ teachers, onClose, onDone }) {
  const [f, setF] = useState({
    title: "", description: "",
    start_date: "", end_date: "",
    term: "1/2568",
    total_parts: 1,
    target: "all",
    attach_type: "none",
    attachment_url: "",
    attachment_name: "",
  });
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  function toggle(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) =>
      setF((prev) => ({ ...prev, attachment_url: ev.target.result, attachment_name: file.name }));
    reader.readAsDataURL(file);
  }

  async function save() {
    setSaving(true);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: f.title,
        description: f.description,
        start_date: f.start_date || undefined,
        end_date: f.end_date || undefined,
        term: f.term,
        total_parts: Number(f.total_parts),
        target: f.target,
        teacher_ids: f.target === "some" ? selected : undefined,
        attachment_url: f.attach_type !== "none" ? f.attachment_url || undefined : undefined,
        attachment_name: f.attach_type !== "none" ? f.attachment_name || undefined : undefined,
      }),
    });
    onDone();
  }

  const canSave =
    f.title.trim() &&
    (f.target === "all" || selected.length > 0) &&
    (f.attach_type === "none" || f.attachment_url);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card max-h-[92vh] w-full max-w-lg overflow-y-auto p-6">
        <h2 className="font-display text-xl font-bold text-ink-900">โพสต์งานใหม่</h2>

        <div className="mt-4 space-y-4">
          <div>
            <label className="label">ชื่องาน *</label>
            <input className="input" value={f.title}
              onChange={(e) => setF({ ...f, title: e.target.value })}
              placeholder="เช่น ส่งแผนการสอนภาคเรียนที่ 1" />
          </div>

          <div>
            <label className="label">รายละเอียด</label>
            <textarea className="input" rows={3} value={f.description}
              onChange={(e) => setF({ ...f, description: e.target.value })}
              placeholder="คำอธิบายเพิ่มเติม (ถ้ามี)" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">วันที่เริ่ม</label>
              <input type="date" className="input" value={f.start_date}
                onChange={(e) => setF({ ...f, start_date: e.target.value })} />
            </div>
            <div>
              <label className="label">วันที่สิ้นสุด</label>
              <input type="date" className="input" value={f.end_date} min={f.start_date}
                onChange={(e) => setF({ ...f, end_date: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">เทอม</label>
              <input className="input" value={f.term} placeholder="1/2568"
                onChange={(e) => setF({ ...f, term: e.target.value })} />
            </div>
            <div>
              <label className="label">จำนวนงานทั้งหมด (ส่วน)</label>
              <input type="number" min={1} max={999} className="input" value={f.total_parts}
                onChange={(e) => setF({ ...f, total_parts: Math.max(1, parseInt(e.target.value) || 1) })} />
            </div>
          </div>

          {/* แนบไฟล์ / ลิ้งค์ */}
          <div>
            <label className="label">แนบไฟล์หรือลิ้งค์</label>
            <div className="flex gap-2">
              {["none", "url", "file"].map((t) => (
                <button key={t} type="button"
                  onClick={() => setF({ ...f, attach_type: t, attachment_url: "", attachment_name: "" })}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm transition-colors ${
                    f.attach_type === t
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-ink-200 text-ink-600 hover:bg-ink-50"
                  }`}>
                  {t === "none" ? "ไม่มี" : t === "url" ? "🔗 ลิ้งค์" : "📄 PDF"}
                </button>
              ))}
            </div>
            {f.attach_type === "url" && (
              <div className="mt-2 space-y-2">
                <input className="input" placeholder="https://drive.google.com/..."
                  value={f.attachment_url}
                  onChange={(e) => setF({
                    ...f, attachment_url: e.target.value,
                    attachment_name: f.attachment_name || e.target.value.split("/").pop() || "ลิ้งค์",
                  })} />
                <input className="input" placeholder="ชื่อที่แสดง (เช่น เอกสารแนบ)"
                  value={f.attachment_name}
                  onChange={(e) => setF({ ...f, attachment_name: e.target.value })} />
              </div>
            )}
            {f.attach_type === "file" && (
              <div className="mt-2">
                <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={handleFile} />
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full rounded-xl border-2 border-dashed border-ink-200 py-4 text-sm text-ink-500 hover:border-brand-400 hover:text-brand-600 transition-colors">
                  {f.attachment_name
                    ? <span className="flex items-center justify-center gap-2">📄 <span className="font-medium text-ink-800">{f.attachment_name}</span></span>
                    : "คลิกเพื่อเลือกไฟล์ PDF"}
                </button>
              </div>
            )}
          </div>

          {/* มอบหมาย */}
          <div>
            <label className="label">มอบหมายให้</label>
            <div className="flex gap-2">
              {["all", "some"].map((t) => (
                <button key={t} type="button" onClick={() => setF({ ...f, target: t })}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm transition-colors ${
                    f.target === t ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-200 hover:bg-ink-50"
                  }`}>
                  {t === "all" ? "ทุกคน" : "เลือกรายคน"}
                </button>
              ))}
            </div>
          </div>

          {f.target === "some" && (
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-ink-200 p-2">
              {teachers.map((t) => (
                <label key={t.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-ink-50">
                  <input type="checkbox" checked={selected.includes(t.id)} onChange={() => toggle(t.id)}
                    className="h-4 w-4 rounded accent-brand-600" />
                  <Avatar name={t.full_name} color={t.avatar_color} size={7} />
                  <span className="text-sm">{t.full_name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">ยกเลิก</button>
          <button onClick={save} disabled={saving || !canSave} className="btn-primary">
            {saving ? "กำลังบันทึก..." : "โพสต์งาน"}
          </button>
        </div>
      </div>
    </div>
  );
}
