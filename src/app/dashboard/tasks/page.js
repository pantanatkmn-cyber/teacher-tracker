"use client";
import { useEffect, useState } from "react";
import { ProgressBar, StatusBadge, Avatar, ScoreStars } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export default function ManageTasks() {
  const [tasks, setTasks] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState(null);

  async function load() {
    const [tRes, uRes] = await Promise.all([
      fetch("/api/tasks").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ]);
    setTasks(tRes.tasks || []);
    setTeachers((uRes.users || []).filter((u) => ["teacher", "head"].includes(u.role) && u.is_active));
  }
  useEffect(() => { load(); }, []);

  async function deleteTask(id) {
    if (!confirm("ลบงานนี้และข้อมูลการมอบหมายทั้งหมด?")) return;
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    load();
  }

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
        <NewTaskForm teachers={teachers} onClose={() => setShowForm(false)} onDone={() => { setShowForm(false); load(); }} />
      )}

      <div className="space-y-4">
        {tasks.length === 0 && (
          <div className="card p-12 text-center text-ink-400">ยังไม่มีงาน คลิก "โพสต์งานใหม่" เพื่อเริ่ม</div>
        )}
        {tasks.map((t) => (
          <div key={t.id} className="card overflow-hidden">
            <div className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg font-semibold text-ink-900">{t.title}</h3>
                  {t.description && <p className="mt-1 text-sm text-ink-600">{t.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-400">
                    {t.due_date && <span>กำหนดส่ง: {formatDate(t.due_date)}</span>}
                    {t.term && <span>เทอม: {t.term}</span>}
                    <span>โพสต์: {formatDate(t.created_at)}</span>
                  </div>
                </div>
                <button onClick={() => deleteTask(t.id)} className="text-xs text-rose-500 hover:underline">ลบ</button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="badge bg-emerald-50 text-emerald-700 ring-emerald-600/20">ส่งแล้ว {t.submitted}</span>
                <span className="badge bg-rose-50 text-rose-700 ring-rose-600/20">ส่งช้า {t.late}</span>
                <span className="badge bg-amber-50 text-amber-700 ring-amber-600/20">รอส่ง {t.pending}</span>
                <span className="badge bg-ink-100 text-ink-600 ring-ink-600/10">ทั้งหมด {t.total} คน</span>
              </div>

              <button
                onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                className="mt-3 text-sm text-brand-600 hover:underline">
                {expanded === t.id ? "ซ่อนรายชื่อ ▲" : "จัดการรายบุคคล ▼"}
              </button>
            </div>

            {expanded === t.id && <TaskAssignments taskId={t.id} onChange={load} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- ฟอร์มโพสต์งานใหม่ ----------
function NewTaskForm({ teachers, onClose, onDone }) {
  const [f, setF] = useState({ title: "", description: "", due_date: "", term: "", target: "all" });
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  function toggle(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function save() {
    setSaving(true);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...f,
        teacher_ids: f.target === "some" ? selected : undefined,
      }),
    });
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
        <h2 className="font-display text-xl font-bold text-ink-900">โพสต์งานใหม่</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="label">ชื่องาน *</label>
            <input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })}
              placeholder="เช่น ส่งแผนการสอนภาคเรียนที่ 1" />
          </div>
          <div>
            <label className="label">รายละเอียด</label>
            <textarea className="input" rows={3} value={f.description}
              onChange={(e) => setF({ ...f, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">กำหนดส่ง</label>
              <input type="date" className="input" value={f.due_date}
                onChange={(e) => setF({ ...f, due_date: e.target.value })} />
            </div>
            <div>
              <label className="label">เทอม</label>
              <input className="input" value={f.term} placeholder="1/2568"
                onChange={(e) => setF({ ...f, term: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="label">มอบหมายให้</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setF({ ...f, target: "all" })}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm ${f.target === "all" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-200"}`}>
                ทุกคน
              </button>
              <button type="button" onClick={() => setF({ ...f, target: "some" })}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm ${f.target === "some" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-200"}`}>
                เลือกรายคน
              </button>
            </div>
          </div>

          {f.target === "some" && (
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-ink-200 p-2">
              {teachers.map((t) => (
                <label key={t.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-ink-50">
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
          <button onClick={save} disabled={saving || !f.title || (f.target === "some" && selected.length === 0)}
            className="btn-primary">
            {saving ? "กำลังบันทึก..." : "โพสต์งาน"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- รายชื่อผู้รับมอบหมาย + จัดการ ----------
function TaskAssignments({ taskId, onChange }) {
  const [assignments, setAssignments] = useState([]);

  async function load() {
    const data = await fetch(`/api/tasks/${taskId}`).then((r) => r.json());
    setAssignments(data.assignments || []);
  }
  useEffect(() => { load(); }, [taskId]);

  async function patch(id, body) {
    await fetch(`/api/assignments/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    load();
    onChange?.();
  }

  return (
    <div className="border-t border-ink-100 bg-ink-50/50 p-5">
      <div className="space-y-3">
        {assignments.map((a) => (
          <div key={a.id} className="card p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Avatar name={a.full_name} color={a.avatar_color} />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-ink-900">{a.full_name}</div>
                <StatusBadge status={a.status} />
              </div>
            </div>

            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {/* progression */}
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs text-ink-500">
                  <span>ความคืบหน้า</span><span className="font-medium">{a.progress}%</span>
                </div>
                <ProgressBar value={a.progress} />
                <div className="mt-2 flex gap-1.5">
                  <button onClick={() => patch(a.id, { progress: a.progress - 10 })}
                    className="rounded-lg bg-ink-100 px-3 py-1 text-sm hover:bg-ink-200">−10</button>
                  <button onClick={() => patch(a.id, { progress: a.progress + 10 })}
                    className="rounded-lg bg-brand-100 px-3 py-1 text-sm text-brand-700 hover:bg-brand-200">+10</button>
                  <button onClick={() => patch(a.id, { progress: 100 })}
                    className="rounded-lg bg-emerald-100 px-3 py-1 text-sm text-emerald-700 hover:bg-emerald-200">ครบ</button>
                </div>
              </div>

              {/* คะแนน */}
              <div>
                <div className="mb-1.5 text-xs text-ink-500">ให้คะแนน (0–5)</div>
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => patch(a.id, { score: s })}
                      className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${
                        Number(a.score) === s ? "bg-amber-500 text-white" : "bg-ink-100 text-ink-600 hover:bg-amber-100"
                      }`}>{s}</button>
                  ))}
                </div>
                {a.score != null && <div className="mt-1.5"><ScoreStars score={a.score} /></div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
