"use client";
import { useEffect, useRef, useState } from "react";
import { formatDate } from "@/lib/utils";

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null); // meeting object กำลังแก้ไข

  async function load() {
    const res  = await fetch("/api/meetings");
    const data = await res.json();
    setMeetings(data.meetings ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function deleteMeeting(id) {
    if (!confirm("ลบบันทึกการประชุมนี้?")) return;
    await fetch(`/api/meetings/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">ประชุมแผนก</h1>
          <p className="mt-1 text-sm text-ink-500">บันทึกการประชุมและเอกสารประกอบ</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary">
          + เพิ่มบันทึกประชุม
        </button>
      </div>

      {(showForm || editing) && (
        <MeetingForm
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onDone={() => { setShowForm(false); setEditing(null); load(); }}
        />
      )}

      {loading ? (
        <div className="card p-12 text-center text-ink-400">กำลังโหลด...</div>
      ) : meetings.length === 0 ? (
        <div className="card p-12 text-center text-ink-400">ยังไม่มีบันทึกการประชุม</div>
      ) : (
        <div className="space-y-3">
          {meetings.map(m => (
            <MeetingCard key={m.id} meeting={m}
              onEdit={() => { setEditing(m); setShowForm(false); }}
              onDelete={() => deleteMeeting(m.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Meeting Card ── */
function MeetingCard({ meeting: m, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const isPdf = m.attachment_url?.startsWith("data:application/pdf");

  return (
    <div className="card overflow-hidden">
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                📋 {formatDate(m.meeting_date)}
              </span>
              {m.end_date && m.end_date !== m.meeting_date && (
                <span className="text-xs text-ink-400">– {formatDate(m.end_date)}</span>
              )}
            </div>
            <h3 className="mt-2 font-display text-lg font-semibold text-ink-900">{m.title}</h3>
            {m.location && <p className="mt-0.5 text-sm text-ink-400">📍 {m.location}</p>}
            {m.description && <p className="mt-1.5 text-sm text-ink-600 leading-relaxed">{m.description}</p>}

            <div className="mt-2 flex flex-wrap items-center gap-3">
              {m.attachment_url && (
                <button onClick={() => setOpen(o => !o)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors">
                  📎 {m.attachment_name || "ดูเอกสารแนบ"} {open ? "▲" : "▼"}
                </button>
              )}
              <span className="text-xs text-ink-400">บันทึกโดย: {m.created_by_name}</span>
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            <button onClick={onEdit}
              className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs text-ink-600 hover:bg-ink-50 transition-colors">
              แก้ไข
            </button>
            <button onClick={onDelete}
              className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs text-rose-500 hover:bg-rose-50 transition-colors">
              ลบ
            </button>
          </div>
        </div>
      </div>

      {/* Attachment preview */}
      {open && m.attachment_url && (
        <div className="border-t border-ink-100">
          {isPdf ? (
            <iframe src={m.attachment_url} className="h-[560px] w-full" title="เอกสารประชุม" />
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

/* ── Form เพิ่ม/แก้ไข ── */
function MeetingForm({ initial, onClose, onDone }) {
  const isEdit = !!initial;
  const [f, setF] = useState({
    title:           initial?.title           ?? "",
    description:     initial?.description     ?? "",
    meeting_date:    initial?.meeting_date ? initial.meeting_date.slice(0,10) : "",
    end_date:        initial?.end_date     ? initial.end_date.slice(0,10)     : "",
    location:        initial?.location        ?? "",
    attach_type:     initial?.attachment_url  ? (initial.attachment_url.startsWith("data:") ? "file" : "url") : "none",
    attachment_url:  initial?.attachment_url  ?? "",
    attachment_name: initial?.attachment_name ?? "",
  });
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setF(p => ({ ...p, attachment_url: ev.target.result, attachment_name: file.name }));
    reader.readAsDataURL(file);
  }

  async function save() {
    setSaving(true);
    const body = {
      title:           f.title,
      description:     f.description || null,
      meeting_date:    f.meeting_date,
      end_date:        f.end_date || null,
      location:        f.location || null,
      attachment_url:  f.attach_type !== "none" ? f.attachment_url || null : null,
      attachment_name: f.attach_type !== "none" ? f.attachment_name || null : null,
    };

    if (isEdit) {
      await fetch(`/api/meetings/${initial.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/meetings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
    onDone();
  }

  const canSave = f.title.trim() && f.meeting_date && (f.attach_type === "none" || f.attachment_url);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card max-h-[92vh] w-full max-w-lg overflow-y-auto p-6">
        <h2 className="font-display text-xl font-bold text-ink-900">
          {isEdit ? "แก้ไขบันทึกประชุม" : "เพิ่มบันทึกประชุม"}
        </h2>

        <div className="mt-4 space-y-4">
          <div>
            <label className="label">หัวข้อประชุม *</label>
            <input className="input" value={f.title} placeholder="เช่น ประชุมวางแผนภาคเรียนที่ 1"
              onChange={e => setF(p => ({ ...p, title: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">วันที่ประชุม *</label>
              <input type="date" className="input" value={f.meeting_date}
                onChange={e => setF(p => ({ ...p, meeting_date: e.target.value }))} />
            </div>
            <div>
              <label className="label">วันสิ้นสุด (ถ้ามี)</label>
              <input type="date" className="input" value={f.end_date} min={f.meeting_date}
                onChange={e => setF(p => ({ ...p, end_date: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="label">สถานที่</label>
            <input className="input" value={f.location} placeholder="เช่น ห้องประชุมชั้น 3"
              onChange={e => setF(p => ({ ...p, location: e.target.value }))} />
          </div>

          <div>
            <label className="label">บันทึก / วาระการประชุม</label>
            <textarea className="input" rows={4} value={f.description}
              placeholder="สรุปวาระ ผลการประชุม มติที่ประชุม ฯลฯ"
              onChange={e => setF(p => ({ ...p, description: e.target.value }))} />
          </div>

          {/* แนบไฟล์ */}
          <div>
            <label className="label">แนบเอกสาร</label>
            <div className="flex gap-2">
              {["none","url","file"].map(t => (
                <button key={t} type="button"
                  onClick={() => setF(p => ({ ...p, attach_type: t, attachment_url: "", attachment_name: "" }))}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm transition-colors
                    ${f.attach_type===t?"border-brand-500 bg-brand-50 text-brand-700":"border-ink-200 text-ink-600 hover:bg-ink-50"}`}>
                  {t==="none"?"ไม่มี":t==="url"?"🔗 ลิ้งค์":"📄 PDF"}
                </button>
              ))}
            </div>
            {f.attach_type === "url" && (
              <div className="mt-2 space-y-2">
                <input className="input" placeholder="https://drive.google.com/..." value={f.attachment_url}
                  onChange={e => setF(p => ({ ...p, attachment_url: e.target.value, attachment_name: p.attachment_name || e.target.value.split("/").pop() || "ลิ้งค์" }))} />
                <input className="input" placeholder="ชื่อที่แสดง" value={f.attachment_name}
                  onChange={e => setF(p => ({ ...p, attachment_name: e.target.value }))} />
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
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">ยกเลิก</button>
          <button onClick={save} disabled={saving || !canSave} className="btn-primary">
            {saving ? "กำลังบันทึก..." : isEdit ? "บันทึกการแก้ไข" : "เพิ่มบันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}
