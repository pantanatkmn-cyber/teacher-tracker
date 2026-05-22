"use client";
import { useEffect, useState } from "react";
import ScheduleViewer from "@/components/ScheduleViewer";
import { Avatar } from "@/components/ui";

export default function SchedulesPage() {
  const [teachers, setTeachers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then((d) => {
      const list = (d.users || []).filter((u) => ["teacher", "head"].includes(u.role));
      setTeachers(list);
      if (list[0]) setSelected(list[0].id);
    });
  }, []);

  async function load(id) {
    const data = await fetch(`/api/schedules?teacher_id=${id}`).then((r) => r.json());
    setFiles(data.files || []);
  }
  useEffect(() => { if (selected) load(selected); }, [selected]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink-900">ตารางสอนอาจารย์</h1>
        <p className="mt-1 text-sm text-ink-500">ดูและจัดการไฟล์ตารางสอนของอาจารย์แต่ละคน</p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2 no-print">
        {teachers.map((t) => (
          <button key={t.id} onClick={() => setSelected(t.id)}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
              selected === t.id ? "bg-brand-600 text-white" : "bg-white ring-1 ring-ink-200 hover:bg-ink-50"
            }`}>
            <Avatar name={t.full_name} color={selected === t.id ? "#ffffff33" : t.avatar_color} size={6} />
            {t.full_name}
          </button>
        ))}
      </div>

      {selected && (
        <ScheduleViewer files={files} editable={true} teacherId={selected} onChange={() => load(selected)} />
      )}
    </div>
  );
}
