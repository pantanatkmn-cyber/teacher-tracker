"use client";
import { useEffect, useState } from "react";
import { ProgressBar, StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/tasks");
    const data = await res.json();
    setTasks(data.tasks || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink-900">งานที่ได้รับมอบหมาย</h1>
        <p className="mt-1 text-sm text-ink-500">รายการงานทั้งหมดที่ต้องดำเนินการ</p>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-ink-400">กำลังโหลด...</div>
      ) : tasks.length === 0 ? (
        <div className="card p-12 text-center text-ink-400">ยังไม่มีงานที่ได้รับมอบหมาย 🎉</div>
      ) : (
        <div className="space-y-4">
          {tasks.map((t) => {
            const totalParts  = t.total_parts || 1;
            const currentParts = t.current_parts ?? Math.round((t.progress / 100) * totalParts);
            const pct          = Math.round((currentParts / totalParts) * 100);
            const deadline     = t.end_date || t.due_date;
            const isOverdue    = deadline && t.status === "pending" && new Date() > new Date(deadline);

            return (
              <div key={t.assignment_id} className="card p-5">
                {/* ── ชื่องาน + สถานะ ── */}
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-semibold text-ink-900">{t.title}</h3>
                  <StatusBadge status={t.status} />
                </div>

                {t.description && (
                  <p className="mt-1 text-sm text-ink-600">{t.description}</p>
                )}

                {/* เอกสารแนบ */}
                {t.attachment_url && (
                  <a
                    href={t.attachment_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100 transition-colors"
                  >
                    📎 {t.attachment_name || "เปิดเอกสารแนบ"}
                  </a>
                )}

                {/* metadata */}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-400">
                  <span>มอบโดย: {t.created_by_name}</span>
                  {t.start_date && <span>เริ่ม: {formatDate(t.start_date)}</span>}
                  {deadline && (
                    <span className={isOverdue ? "font-semibold text-rose-500" : ""}>
                      สิ้นสุด: {formatDate(deadline)}{isOverdue ? " ⚠️ เลยกำหนด" : ""}
                    </span>
                  )}
                  {t.term && <span>เทอม: {t.term}</span>}
                </div>

                {/* progress (read-only) */}
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs text-ink-500">ความคืบหน้า</span>
                    <span className="text-sm font-semibold text-ink-800">
                      {currentParts}
                      <span className="text-xs font-normal text-ink-400">/{totalParts} ส่วน</span>
                      <span className="ml-2 text-xs text-ink-400">({pct}%)</span>
                    </span>
                  </div>
                  <ProgressBar value={pct} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
