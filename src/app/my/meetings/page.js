"use client";
import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";

export default function MyMeetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch("/api/meetings").then(r => r.json()).then(d => {
      setMeetings(d.meetings ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink-900">ประชุมแผนก</h1>
        <p className="mt-1 text-sm text-ink-500">บันทึกการประชุมและเอกสารประกอบของแผนก</p>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-ink-400">กำลังโหลด...</div>
      ) : meetings.length === 0 ? (
        <div className="card p-12 text-center text-ink-400">ยังไม่มีบันทึกการประชุม</div>
      ) : (
        <div className="space-y-3">
          {meetings.map(m => <MeetingCard key={m.id} meeting={m} />)}
        </div>
      )}
    </div>
  );
}

function MeetingCard({ meeting: m }) {
  const [open, setOpen] = useState(false);
  const isPdf = m.attachment_url?.startsWith("data:application/pdf");
  const today = new Date().toISOString().slice(0, 10);
  const dateStr = m.meeting_date?.slice?.(0, 10) ?? m.meeting_date;
  const isUpcoming = dateStr && dateStr >= today;

  return (
    <div className="card overflow-hidden">
      <div className="p-5">
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold
                ${isUpcoming ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-600"}`}>
                📋 {formatDate(m.meeting_date)}
              </span>
              {m.end_date && m.end_date !== m.meeting_date && (
                <span className="text-xs text-ink-400">– {formatDate(m.end_date)}</span>
              )}
              {isUpcoming && (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                  กำลังจะมาถึง
                </span>
              )}
            </div>

            <h3 className="mt-2 font-display text-lg font-semibold text-ink-900">{m.title}</h3>
            {m.location && <p className="mt-0.5 text-sm text-ink-400">📍 {m.location}</p>}
            {m.description && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink-600 leading-relaxed">{m.description}</p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-3">
              {m.attachment_url && (
                <button onClick={() => setOpen(o => !o)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors">
                  📎 {m.attachment_name || "ดูเอกสารแนบ"} {open ? "▲" : "▼"}
                </button>
              )}
              <span className="text-xs text-ink-400">บันทึกโดย: {m.created_by_name}</span>
            </div>
          </div>
        </div>
      </div>

      {open && m.attachment_url && (
        <div className="border-t border-ink-100">
          {isPdf ? (
            <iframe src={m.attachment_url} className="h-[520px] w-full" title="เอกสารประชุม" />
          ) : (
            <div className="flex flex-col items-center gap-4 py-10">
              <div className="text-5xl">🔗</div>
              <a href={m.attachment_url} target="_blank" rel="noreferrer" className="btn-primary">
                เปิดลิ้งค์
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
