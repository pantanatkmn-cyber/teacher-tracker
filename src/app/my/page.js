"use client";
import { useEffect, useState } from "react";
import ScheduleViewer from "@/components/ScheduleViewer";

export default function MySchedule() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/schedules");
    const data = await res.json();
    setFiles(data.files || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink-900">ตารางสอนของฉัน</h1>
        <p className="mt-1 text-sm text-ink-500">อัปโหลดไฟล์ตารางสอน (รูปหรือ PDF) เพื่อแสดงผล</p>
      </div>
      {loading ? (
        <div className="card p-12 text-center text-ink-400">กำลังโหลด...</div>
      ) : (
        <ScheduleViewer files={files} editable={true} onChange={load} />
      )}
    </div>
  );
}
