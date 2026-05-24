"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────
   Constants
──────────────────────────────────────────────────────────── */
const DAYS_SHORT = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];
const MONTHS_TH = [
  "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
  "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
];

// palette วนซ้ำตาม task.id
const PALETTE = [
  { bg: "#3361f6", light: "#eef2ff" },
  { bg: "#7c3aed", light: "#f5f3ff" },
  { bg: "#0891b2", light: "#ecfeff" },
  { bg: "#059669", light: "#ecfdf5" },
  { bg: "#d97706", light: "#fffbeb" },
  { bg: "#db2777", light: "#fdf2f8" },
  { bg: "#dc2626", light: "#fef2f2" },
  { bg: "#0d9488", light: "#f0fdfa" },
];
function taskPalette(taskId) { return PALETTE[taskId % PALETTE.length]; }

/* ────────────────────────────────────────────────────────────
   Date utilities
──────────────────────────────────────────────────────────── */
/** แปลงค่าต่างๆ เป็น YYYY-MM-DD */
function normDate(v) {
  if (!v) return null;
  if (typeof v === "string") return v.slice(0, 10);
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return null;
}

function toStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function todayStr() { return toStr(new Date()); }

function taskRange(task) {
  const s = normDate(task.start_date ?? task.end_date ?? task.due_date);
  const e = normDate(task.end_date ?? task.due_date ?? task.start_date);
  return { s, e };
}

/** สร้าง grid สัปดาห์ (เริ่มจันทร์) */
function getCalendarWeeks(year, month) {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const startDow = (first.getDay() + 6) % 7;
  const cur = new Date(year, month, 1 - startDow);
  const weeks = [];
  while (cur <= last) {
    const week = [];
    for (let d = 0; d < 7; d++) { week.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
    weeks.push(week);
  }
  return weeks;
}

/** ตำแหน่ง bar ภายใน week row */
function getPosition(task, week) {
  const ws = toStr(week[0]);
  const we = toStr(week[6]);
  const { s, e } = taskRange(task);
  if (!s) return null;
  if (s > we || e < ws) return null;

  const effS = s < ws ? ws : s;
  const effE = e > we ? we : e;

  const startCol = week.findIndex((d) => toStr(d) === effS);
  const endCol   = week.findIndex((d) => toStr(d) === effE);
  if (startCol === -1 || endCol === -1) return null;

  return {
    startCol,
    span: endCol - startCol + 1,
    startsHere: s >= ws,
    endsHere:   e <= we,
  };
}

/** กำหนด lane ป้องกันซ้อนทับ */
function assignLanes(tasksForWeek) {
  const sorted = [...tasksForWeek].sort((a, b) => {
    const as = taskRange(a).s ?? "";
    const bs = taskRange(b).s ?? "";
    return as < bs ? -1 : as > bs ? 1 : 0;
  });
  const laneEnd = [];
  return sorted.map((task) => {
    const { s, e } = taskRange(task);
    let lane = 0;
    while (laneEnd[lane] && laneEnd[lane] > (s ?? "")) lane++;
    laneEnd[lane] = e ?? s ?? "";
    return { ...task, lane };
  });
}

/** นับวันที่เหลือจากวันนี้ */
function daysFromNow(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr + "T12:00:00");
  const now    = new Date();
  return Math.ceil((target - now) / 86_400_000);
}

/* ────────────────────────────────────────────────────────────
   Main Component
──────────────────────────────────────────────────────────── */
export default function CalendarHome() {
  const router  = useRouter();
  const today   = todayStr();
  const now     = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [tasks, setTasks] = useState([]);
  const [role,  setRole]  = useState("teacher");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    const res  = await fetch("/api/calendar");
    const data = await res.json();
    setTasks(data.tasks ?? []);
    setRole(data.role  ?? "teacher");
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const isManager = role !== "teacher";
  const weeks     = getCalendarWeeks(year, month);

  function prevMonth() { month === 0 ? (setYear(y => y - 1), setMonth(11)) : setMonth(m => m - 1); }
  function nextMonth() { month === 11 ? (setYear(y => y + 1), setMonth(0)) : setMonth(m => m + 1); }

  // งานที่ตกในเดือนนี้
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthFirst = `${monthStr}-01`;
  const monthLast  = `${monthStr}-31`;
  const monthCount = tasks.filter((t) => {
    const { s, e } = taskRange(t);
    if (!s && !e) return false;
    return (s ?? e) <= monthLast && (e ?? s) >= monthFirst;
  }).length;

  // งานค้าง (สำหรับ panel ขวา)
  const pendingTasks = tasks
    .filter((t) =>
      isManager
        ? (t.pending > 0 || t.late > 0)
        : (t.status === "pending" || t.status === "late")
    )
    .sort((a, b) => {
      const ae = taskRange(a).e ?? "9999";
      const be = taskRange(b).e ?? "9999";
      return ae < be ? -1 : ae > be ? 1 : 0;
    });

  if (loading) return <div className="card p-12 text-center text-ink-400">กำลังโหลด...</div>;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">

      {/* ── Calendar ── */}
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <button onClick={prevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 text-ink-500 hover:bg-ink-50 transition-colors text-lg">
              ‹
            </button>
            <h2 className="w-44 text-center font-display text-lg font-bold text-ink-900">
              {MONTHS_TH[month]} {year + 543}
            </h2>
            <button onClick={nextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 text-ink-500 hover:bg-ink-50 transition-colors text-lg">
              ›
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-ink-400">{monthCount} งานในเดือนนี้</span>
            <button
              onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }}
              className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs text-ink-600 hover:bg-ink-50 transition-colors">
              วันนี้
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-ink-100 bg-ink-50/50">
          {DAYS_SHORT.map((d, i) => (
            <div key={d}
              className={`py-2 text-center text-xs font-semibold tracking-wide
                ${i >= 5 ? "text-rose-400" : "text-ink-400"}`}>
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <WeekRow
            key={wi}
            week={week}
            tasks={tasks}
            today={today}
            currentMonth={month}
            selected={selected}
            onSelect={(t) => setSelected(prev => prev?.id === t.id ? null : t)}
          />
        ))}

        {/* Color legend */}
        <div className="flex flex-wrap items-center gap-3 border-t border-ink-100 px-5 py-3">
          <span className="text-xs text-ink-400">สีแต่ละงาน:</span>
          {tasks.slice(0, 6).map((t) => {
            const { bg } = taskPalette(t.id);
            return (
              <div key={t.id} className="flex items-center gap-1.5">
                <div className="h-2.5 w-5 rounded-sm" style={{ backgroundColor: bg }} />
                <span className="max-w-[80px] truncate text-xs text-ink-500">{t.title}</span>
              </div>
            );
          })}
          {tasks.length > 6 && (
            <span className="text-xs text-ink-400">+{tasks.length - 6} อื่นๆ</span>
          )}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="space-y-4">

        {/* Selected task popup */}
        {selected && (
          <SelectedPanel
            task={selected}
            isManager={isManager}
            onClose={() => setSelected(null)}
            onManage={() => router.push(`/dashboard/tasks/${selected.id}`)}
          />
        )}

        {/* งานค้างอยู่ */}
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-ink-100 px-5 py-3.5">
            <h3 className="font-display font-semibold text-ink-900">งานค้างอยู่</h3>
            {pendingTasks.length > 0 && (
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-bold text-white">
                {pendingTasks.length}
              </span>
            )}
          </div>
          {pendingTasks.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <div className="text-3xl">🎉</div>
              <p className="mt-2 text-sm text-ink-400">ไม่มีงานค้างอยู่</p>
            </div>
          ) : (
            <div className="max-h-[420px] divide-y divide-ink-50 overflow-y-auto">
              {pendingTasks.map((t) => (
                <PendingRow
                  key={t.id}
                  task={t}
                  today={today}
                  isManager={isManager}
                  isSelected={selected?.id === t.id}
                  onClick={() => setSelected(prev => prev?.id === t.id ? null : t)}
                />
              ))}
            </div>
          )}
        </div>

        {/* งานไม่มีกำหนด */}
        {(() => {
          const noDate = tasks.filter(t => !taskRange(t).s);
          if (!noDate.length) return null;
          return (
            <div className="card overflow-hidden">
              <div className="border-b border-ink-100 px-5 py-3">
                <h3 className="text-sm font-semibold text-ink-500">งานที่ไม่มีกำหนดวัน</h3>
              </div>
              <div className="divide-y divide-ink-50">
                {noDate.map(t => (
                  <PendingRow
                    key={t.id} task={t} today={today}
                    isManager={isManager}
                    isSelected={selected?.id === t.id}
                    onClick={() => setSelected(prev => prev?.id === t.id ? null : t)}
                  />
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Week Row
──────────────────────────────────────────────────────────── */
function WeekRow({ week, tasks, today, currentMonth, selected, onSelect }) {
  const ws = toStr(week[0]);
  const we = toStr(week[6]);

  const weekTasks = tasks.filter((t) => {
    const { s, e } = taskRange(t);
    if (!s) return false;
    return s <= we && e >= ws;
  });
  const withLanes  = assignLanes(weekTasks);
  const maxLane    = withLanes.length > 0 ? Math.max(...withLanes.map(t => t.lane)) : -1;
  const eventsH    = maxLane >= 0 ? (maxLane + 1) * 26 + 6 : 0;

  return (
    <div className="border-b border-ink-100 last:border-0">
      {/* Day numbers */}
      <div className="grid grid-cols-7">
        {week.map((day, di) => {
          const ds       = toStr(day);
          const isToday  = ds === today;
          const inMonth  = day.getMonth() === currentMonth;
          const isWeekend = di >= 5;
          return (
            <div key={ds} className={`px-1.5 pb-0.5 pt-1.5 text-right ${!inMonth ? "opacity-25" : ""}`}>
              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium
                ${isToday
                  ? "bg-brand-600 font-bold text-white"
                  : isWeekend ? "text-rose-400" : "text-ink-600"}`}>
                {day.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Event bars */}
      {eventsH > 0 && (
        <div className="relative mx-0.5" style={{ height: eventsH + "px" }}>
          {withLanes.map((task) => {
            const pos = getPosition(task, week);
            if (!pos) return null;
            const { bg } = taskPalette(task.id);
            const isSelected = selected?.id === task.id;
            const leftPct  = (pos.startCol / 7) * 100;
            const widthPct = (pos.span / 7) * 100;

            return (
              <button
                key={task.id}
                onClick={() => onSelect(task)}
                title={task.title}
                className="absolute flex items-center overflow-hidden text-left text-xs font-medium text-white transition-all hover:brightness-110"
                style={{
                  backgroundColor: bg,
                  left:   `calc(${leftPct}% + 2px)`,
                  width:  `calc(${widthPct}% - 4px)`,
                  top:    `${task.lane * 26 + 3}px`,
                  height: "22px",
                  borderRadius: `${pos.startsHere ? "6px" : "0"} ${pos.endsHere ? "6px" : "0"} ${pos.endsHere ? "6px" : "0"} ${pos.startsHere ? "6px" : "0"}`,
                  outline: isSelected ? "2px solid white" : "none",
                  outlineOffset: "1px",
                  boxShadow: isSelected ? `0 0 0 3px ${bg}60` : "none",
                  zIndex: isSelected ? 10 : 1,
                }}
              >
                <span className="truncate px-1.5 leading-none">
                  {!pos.startsHere && <span className="mr-0.5 opacity-75">←</span>}
                  {task.title}
                  {!pos.endsHere && <span className="ml-0.5 opacity-75">→</span>}
                </span>
              </button>
            );
          })}
        </div>
      )}
      {eventsH === 0 && <div className="h-1.5" />}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Selected Task Panel
──────────────────────────────────────────────────────────── */
function SelectedPanel({ task, isManager, onClose, onManage }) {
  const { s, e } = taskRange(task);
  const { bg, light } = taskPalette(task.id);
  const days = s && e ? daysFromNow(e) : null;

  return (
    <div className="card overflow-hidden ring-2" style={{ ringColor: bg }}>
      {/* color bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: bg }} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-semibold leading-snug text-ink-900">{task.title}</h3>
          <button onClick={onClose} className="shrink-0 text-ink-400 hover:text-ink-600">✕</button>
        </div>

        {task.description && (
          <p className="mt-1.5 text-sm text-ink-600">{task.description}</p>
        )}

        <div className="mt-3 space-y-1.5">
          {s && (
            <div className="flex items-center gap-2 text-xs text-ink-500">
              <span className="w-16 shrink-0 font-medium">เริ่มต้น</span>
              <span>{formatDate(s)}</span>
            </div>
          )}
          {e && (
            <div className="flex items-center gap-2 text-xs text-ink-500">
              <span className="w-16 shrink-0 font-medium">สิ้นสุด</span>
              <span>{formatDate(e)}</span>
              {days !== null && (
                <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold
                  ${days < 0 ? "bg-rose-100 text-rose-600" : days <= 3 ? "bg-amber-100 text-amber-700" : "bg-ink-100 text-ink-500"}`}>
                  {days < 0 ? `เลย ${Math.abs(days)} วัน` : days === 0 ? "วันนี้" : `อีก ${days} วัน`}
                </span>
              )}
            </div>
          )}
          {task.term && (
            <div className="flex items-center gap-2 text-xs text-ink-500">
              <span className="w-16 shrink-0 font-medium">เทอม</span>
              <span>{task.term}</span>
            </div>
          )}
          {task.total_parts > 1 && (
            <div className="flex items-center gap-2 text-xs text-ink-500">
              <span className="w-16 shrink-0 font-medium">จำนวน</span>
              <span>{task.total_parts} ส่วน</span>
            </div>
          )}
        </div>

        {task.attachment_url && (
          <a href={task.attachment_url} target="_blank" rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ backgroundColor: light, color: bg }}>
            📎 {task.attachment_name || "เอกสารแนบ"}
          </a>
        )}

        {isManager && (
          <button onClick={onManage}
            className="mt-3 w-full rounded-xl py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: bg }}>
            จัดการงานนี้ →
          </button>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Pending Task Row
──────────────────────────────────────────────────────────── */
function PendingRow({ task, today, isManager, isSelected, onClick }) {
  const { e }   = taskRange(task);
  const days    = e ? daysFromNow(e) : null;
  const { bg }  = taskPalette(task.id);

  return (
    <button
      onClick={onClick}
      className={`w-full px-5 py-3 text-left transition-colors hover:bg-ink-50 ${isSelected ? "bg-brand-50" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: bg }} />
          <p className="truncate text-sm font-medium text-ink-800">{task.title}</p>
        </div>
        {days !== null && (
          <span className={`shrink-0 text-xs font-semibold
            ${days < 0 ? "text-rose-500" : days <= 3 ? "text-amber-500" : "text-ink-400"}`}>
            {days < 0
              ? `เลย ${Math.abs(days)} วัน`
              : days === 0 ? "วันนี้!"
              : days === 1 ? "พรุ่งนี้"
              : `${days} วัน`}
          </span>
        )}
      </div>
      <p className="mt-0.5 pl-[18px] text-xs text-ink-400">
        {isManager
          ? `รอ ${task.pending} · ช้า ${task.late} · ทั้งหมด ${task.total} คน`
          : `สถานะ: ${task.status === "pending" ? "รอส่ง" : "ส่งช้า"}`}
      </p>
    </button>
  );
}
