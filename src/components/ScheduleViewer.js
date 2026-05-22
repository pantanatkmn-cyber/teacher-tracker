"use client";
import { useState, useRef } from "react";
import { formatDateTime } from "@/lib/utils";

export default function ScheduleViewer({ files, editable, teacherId, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [term, setTerm] = useState("");
  const [err, setErr] = useState("");
  const inputRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    setErr("");
    if (file.size > 4 * 1024 * 1024) {
      setErr("ไฟล์ใหญ่เกินไป (จำกัด 4MB)");
      return;
    }
    setUploading(true);

    // อ่านเป็น base64 data URL
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const res = await fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teacher_id: teacherId,
        file_name: file.name,
        mime_type: file.type,
        data_url: dataUrl,
        term,
      }),
    });
    setUploading(false);
    if (!res.ok) {
      const e = await res.json();
      setErr(e.error || "อัปโหลดไม่สำเร็จ");
      return;
    }
    if (inputRef.current) inputRef.current.value = "";
    onChange?.();
  }

  async function remove(id) {
    if (!confirm("ลบไฟล์ตารางสอนนี้?")) return;
    await fetch(`/api/schedules?id=${id}`, { method: "DELETE" });
    onChange?.();
  }

  return (
    <div>
      {editable && (
        <div className="card mb-5 p-5 no-print">
          <h4 className="mb-3 font-display font-semibold">อัปโหลดตารางสอน</h4>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <label className="label">เทอม (ไม่บังคับ)</label>
              <input className="input" value={term} placeholder="1/2568"
                onChange={(e) => setTerm(e.target.value)} />
            </div>
            <div>
              <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,application/pdf"
                className="hidden" id="sched-upload"
                onChange={(e) => handleFile(e.target.files?.[0])} />
              <label htmlFor="sched-upload" className="btn-primary cursor-pointer">
                {uploading ? "กำลังอัปโหลด..." : "📎 เลือกไฟล์ (รูป/PDF)"}
              </label>
            </div>
          </div>
          {err && <div className="mt-3 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{err}</div>}
          <p className="mt-2 text-xs text-ink-400">รองรับ PNG, JPG, WEBP, PDF ขนาดไม่เกิน 4MB</p>
        </div>
      )}

      {files.length === 0 ? (
        <div className="card p-12 text-center text-ink-400">ยังไม่มีไฟล์ตารางสอน</div>
      ) : (
        <div className="space-y-5">
          {files.map((f) => (
            <div key={f.id} className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-5 py-3 no-print">
                <div className="text-sm">
                  <span className="font-medium text-ink-900">{f.file_name}</span>
                  {f.term && <span className="ml-2 text-ink-400">เทอม {f.term}</span>}
                  <span className="ml-2 text-xs text-ink-400">· {formatDateTime(f.uploaded_at)}</span>
                </div>
                {editable && (
                  <button onClick={() => remove(f.id)} className="text-xs text-rose-500 hover:underline">ลบ</button>
                )}
              </div>
              <div className="bg-ink-50 p-3">
                {f.mime_type === "application/pdf" ? (
                  <object data={f.data_url} type="application/pdf"
                    className="h-[70vh] w-full rounded-lg">
                    <div className="p-8 text-center text-sm text-ink-500">
                      ไม่สามารถแสดง PDF ได้ —{" "}
                      <a href={f.data_url} download={f.file_name} className="text-brand-600 underline">ดาวน์โหลดไฟล์</a>
                    </div>
                  </object>
                ) : (
                  <img src={f.data_url} alt={f.file_name}
                    className="mx-auto max-h-[80vh] w-auto rounded-lg" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
