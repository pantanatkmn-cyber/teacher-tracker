"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, StatusBadge, ScoreStars, ProgressBar } from "@/components/ui";
import { formatDate } from "@/lib/utils";

/* ─────────────────────────────────────────
   หน้ารายละเอียดงาน
───────────────────────────────────────── */
export default function TaskDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [task, setTask] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch(`/api/tasks/${id}`);
    if (!res.ok) { router.push("/dashboard/tasks"); return; }
    const data = await res.json();
    setTask(data.task);
    setAssignments(data.assignments || []);
    setLoading(false);
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  async function deleteTask() {
    if (!confirm("ลบงานนี้ทั้งหมด?")) return;
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    router.push("/dashboard/tasks");
  }

  if (loading) return <div className="card p-12 text-center text-ink-400">กำลังโหลด...</div>;
  if (!task) return null;

  const totalParts = task.total_parts || 1;
  const isPdf = task.attachment_url?.startsWith("data:application/pdf");

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/tasks")}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-ink-200 text-ink-500 hover:bg-ink-50 transition-colors"
          >
            ←
          </button>
          <div>
            <p className="text-xs text-ink-400">จัดการงาน</p>
            <h1 className="font-display text-2xl font-bold text-ink-900 leading-tight">{task.title}</h1>
          </div>
        </div>
        <button onClick={deleteTask} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-100 transition-colors">
          🗑 ลบงานนี้
        </button>
      </div>

      {/* ── Task info card ── */}
      <div className="card p-6 space-y-4">
        {task.description && (
          <p className="text-sm text-ink-700 leading-relaxed">{task.description}</p>
        )}

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-500">
          {task.start_date && (
            <span className="flex items-center gap-1.5">
              <span className="text-ink-400">📅 เริ่ม</span>
              <span className="font-medium text-ink-700">{formatDate(task.start_date)}</span>
            </span>
          )}
          {(task.end_date || task.due_date) && (
            <span className="flex items-center gap-1.5">
              <span className="text-ink-400">🏁 สิ้นสุด</span>
              <span className="font-medium text-ink-700">{formatDate(task.end_date || task.due_date)}</span>
            </span>
          )}
          {task.term && (
            <span className="flex items-center gap-1.5">
              <span className="text-ink-400">📖 เทอม</span>
              <span className="font-medium text-ink-700">{task.term}</span>
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="text-ink-400">📊 จำนวนงาน</span>
            <span className="font-medium text-ink-700">{totalParts} ส่วน</span>
          </span>
        </div>

        {/* สรุปสถิติ */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Chip color="emerald">ส่งแล้ว {assignments.filter((a) => a.status === "submitted").length}</Chip>
          <Chip color="rose">ส่งช้า {assignments.filter((a) => a.status === "late").length}</Chip>
          <Chip color="amber">รอส่ง {assignments.filter((a) => a.status === "pending").length}</Chip>
          <Chip color="ink">ทั้งหมด {assignments.length} คน</Chip>
        </div>
      </div>

      {/* ── Attachment ── */}
      {task.attachment_url && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3">
            <span className="text-sm font-semibold text-ink-700">
              📎 {task.attachment_name || "เอกสารแนบ"}
            </span>
            <a
              href={task.attachment_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-brand-600 hover:underline"
            >
              เปิดในแท็บใหม่ ↗
            </a>
          </div>
          {isPdf ? (
            <iframe
              src={task.attachment_url}
              className="h-[520px] w-full"
              title="PDF preview"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <div className="text-5xl">🔗</div>
              <p className="text-sm text-ink-500">ลิ้งค์ภายนอก</p>
              <a
                href={task.attachment_url}
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
              >
                เปิดลิ้งค์
              </a>
            </div>
          )}
        </div>
      )}

      {/* ── Assignment list ── */}
      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink-800">
          รายชื่อผู้รับมอบหมาย ({assignments.length} คน)
        </h2>
        <div className="space-y-3">
          {assignments.length === 0 && (
            <div className="card p-8 text-center text-ink-400">ยังไม่มีผู้รับมอบหมาย</div>
          )}
          {assignments.map((a) => (
            <AssignmentCard
              key={a.id}
              assignment={a}
              totalParts={totalParts}
              onRefresh={load}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Assignment card — local state + save/reset/delete
───────────────────────────────────────── */
function AssignmentCard({ assignment: init, totalParts, onRefresh }) {
  const [a, setA] = useState(init);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(""); // "saved" | "error"

  // sync เมื่อ parent refresh
  useEffect(() => { setA(init); setDirty(false); }, [init]);

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  }

  function update(patch) {
    setA((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  }

  function reset() {
    setA(init);
    setDirty(false);
  }

  async function save() {
    setSaving(true);
    const currentParts = a.current_parts ?? 0;
    const progress = Math.round((currentParts / totalParts) * 100);

    await fetch(`/api/assignments/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current_parts: currentParts }),
    });
    if (a.score !== init.score) {
      await fetch(`/api/assignments/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: a.score }),
      });
    }
    setSaving(false);
    setDirty(false);
    flash("saved");
    onRefresh();
  }

  async function deleteAssignment() {
    if (!confirm(`ถอด "${a.full_name}" ออกจากงานนี้?`)) return;
    setDeleting(true);
    await fetch(`/api/assignments/${a.id}`, { method: "DELETE" });
    onRefresh();
  }

  async function toggleSubmit() {
    const action = a.status === "pending" ? "submit" : "unsubmit";
    await fetch(`/api/assignments/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    onRefresh();
  }

  const currentParts = a.current_parts ?? Math.round((a.progress / 100) * totalParts);
  const pct = totalParts > 0 ? Math.round((currentParts / totalParts) * 100) : 0;

  return (
    <div className={`card p-5 transition-all ${dirty ? "ring-2 ring-brand-300" : ""}`}>
      {/* ── top row ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={a.full_name} color={a.avatar_color} />
          <div>
            <div className="font-semibold text-ink-900">{a.full_name}</div>
            <div className="mt-0.5 flex items-center gap-2">
              <StatusBadge status={a.status} />
              {a.submitted_at && (
                <span className="text-xs text-ink-400">ส่งเมื่อ {formatDate(a.submitted_at)}</span>
              )}
            </div>
          </div>
        </div>

        {/* action buttons */}
        <div className="flex items-center gap-2">
          {/* toast */}
          {toast === "saved" && (
            <span className="text-xs font-medium text-emerald-600 animate-pulse">✓ บันทึกแล้ว</span>
          )}
          {dirty && (
            <button onClick={reset} className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs text-ink-500 hover:bg-ink-50 transition-colors">
              รีเซ็ต
            </button>
          )}
          <button
            onClick={save}
            disabled={!dirty || saving}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              dirty
                ? "bg-brand-600 text-white hover:bg-brand-700"
                : "bg-ink-100 text-ink-400 cursor-not-allowed"
            }`}
          >
            {saving ? "..." : "บันทึก"}
          </button>
          <button
            onClick={toggleSubmit}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              a.status === "pending"
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                : "bg-ink-100 text-ink-500 hover:bg-ink-200"
            }`}
          >
            {a.status === "pending" ? "✓ ทำเครื่องหมายส่งแล้ว" : "ยกเลิกการส่ง"}
          </button>
          <button
            onClick={deleteAssignment}
            disabled={deleting}
            className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs text-rose-500 hover:bg-rose-50 transition-colors"
          >
            ลบ
          </button>
        </div>
      </div>

      {/* ── progress + score ── */}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {/* Progress */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-ink-500">ความคืบหน้า</span>
            <span className="text-sm font-bold text-ink-800">
              {currentParts}
              <span className="text-xs font-normal text-ink-400">/{totalParts}</span>
              <span className="ml-1.5 text-xs font-normal text-ink-400">({pct}%)</span>
            </span>
          </div>
          <ProgressBar value={pct} />

          {/* slider */}
          <input
            type="range"
            min={0}
            max={totalParts}
            value={currentParts}
            onChange={(e) => update({ current_parts: Number(e.target.value) })}
            className="mt-2 w-full cursor-pointer"
            style={{ accentColor: "#3361f6" }}
          />

          {/* step buttons */}
          <div className="mt-2 flex gap-1.5">
            <button
              onClick={() => update({ current_parts: Math.max(0, currentParts - 1) })}
              disabled={currentParts === 0}
              className="rounded-lg bg-ink-100 px-3 py-1.5 text-sm font-medium hover:bg-ink-200 disabled:opacity-40 transition-colors"
            >−1</button>
            <button
              onClick={() => update({ current_parts: Math.min(totalParts, currentParts + 1) })}
              disabled={currentParts === totalParts}
              className="rounded-lg bg-brand-100 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-200 disabled:opacity-40 transition-colors"
            >+1</button>
            <button
              onClick={() => update({ current_parts: totalParts })}
              disabled={currentParts === totalParts}
              className="rounded-lg bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-200 disabled:opacity-40 transition-colors"
            >ครบ ✓</button>
            <button
              onClick={() => update({ current_parts: 0 })}
              disabled={currentParts === 0}
              className="ml-auto rounded-lg bg-ink-50 px-2.5 py-1.5 text-xs text-ink-400 hover:bg-ink-100 disabled:opacity-40 transition-colors"
            >รีเซ็ต</button>
          </div>
        </div>

        {/* Score */}
        <div>
          <div className="mb-2 text-xs font-medium text-ink-500">ให้คะแนน (0–5)</div>
          <div className="flex items-center gap-1.5">
            {[0, 1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => update({ score: s })}
                className={`h-10 w-10 rounded-xl text-sm font-semibold transition-all ${
                  Number(a.score) === s
                    ? "bg-amber-500 text-white scale-110 shadow-md"
                    : "bg-ink-100 text-ink-600 hover:bg-amber-100 hover:text-amber-700"
                }`}
              >{s}</button>
            ))}
          </div>
          {a.score != null && (
            <div className="mt-2">
              <ScoreStars score={a.score} />
            </div>
          )}
          {a.scored_at && (
            <p className="mt-1 text-xs text-ink-400">ให้คะแนนเมื่อ {formatDate(a.scored_at)}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* helper */
function Chip({ color, children }) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    rose: "bg-rose-50 text-rose-700 ring-rose-600/20",
    amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
    ink: "bg-ink-100 text-ink-600 ring-ink-600/10",
  };
  return <span className={`badge text-xs ${colors[color]}`}>{children}</span>;
}
