"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────
   Utilities
──────────────────────────────────────────────────────────── */
const DAYS_SHORT = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];
const MONTHS_TH = [
  "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
  "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
];

function toStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function todayStr() { return toStr(new Date()); }

/** สร้าง grid สัปดาห์ (เริ่มจันทร์) */
function getCalendarWeeks(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDow = (first.getDay() + 6) % 7; // Mon=0
  const cur = new Date(year, month, 1 - startDow);
  const weeks = [];
  while (cur <= last) {
    const week = [];
    for (let d = 0; d < 7; d++) { week.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
    weeks.push(week);
  }
  return weeks;
}

function taskDateRange(task) {
  const s = task.start_date || task.end_date || task.due_date || null;
  const e = task.end_date || task.due_date || task.start_date || null;
  return { s, e };
}

/** ตรวจว่างานทับกับสัปดาห์นี้ไหม */
function overlapsWeek(task, weekStartStr, weekEndStr) {
  const { s, e } = taskDateRange(task);
  if (!s) return false;
  return s <= weekEndStr && e >= weekStartStr;
}

/** คำนวณตำแหน่งใน week row */
function getPosition(task, week) {
  const ws = toStr(week[0]);
  const we = toStr(week[6]);
  const { s, e } = taskDateRange(task);
  if (!s) return null;

  const effS = s < ws ? ws : s;
  const effE = e > we ? we : e;

  const startCol = week.findIndex((d) => toStr(d) === effS);
  const endCol   = week.findIndex((d) => toStr(d) === effE);
  if (startCol === -1 || endCol === -1) return null;

  return {
    startCol,
    span: endCol - startCol + 1,
    startsHere: s >= ws,
    endsHere: e <= we,
  };
}

/** กำหนด lane เพื่อไม่ให้ event ซ้อนกัน */
function assignLanes(tasksForWeek) {
  const sorted = [...tasksForWeek].sort((a, b) => {
    const as = taskDateRange(a).s || "";
    const bs = taskDateRange(b).s || "";
    return as < bs ? -1 : as > bs ? 1 : 0;
  });
  const laneEnd = [];
  return sorted.map((task) => {
    const { s, e } = taskDateRange(task);
    let lane = 0;
    while (laneEnd[lane] && laneEnd[lane] > (s || "")) lane++;
    laneEnd[lane] = e || s || "";
    return { ...task, lane };
  });
}

/** สีของงานตาม role + status */
function taskColor(task, isManager) {
  if (isManager) {
    if (task.late > 0) return { bg: "bg-rose-500", border: "border-rose-600", text: "text-white" };
    if (task.total > 0 && task.submitted === task.total) return { bg: "bg-emerald-500", border: "border-emerald-600", text: "text-white" };
    return { bg: "bg-brand-600", border: "border-brand-700", text: "text-white" };
  }
  if (task.status === "late") return { bg: "bg-rose-500", border: "border-rose-600", text: "text-white" };
  if (task.status === "submitted") return { bg: "bg-emerald-500", border: "border-emerald-600", text: "text-white" };
  return { bg: "bg-amber-400", border: "border-amber-500", text: "text-white" };
}

/* ────────────────────────────────────────────────────────────
   Main Component
──────────────────────────────────────────────────────────── */
export default function CalendarHome() {
  const router = useRouter();
  const today = todayStr();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [tasks, setTasks] = useState([]);
  const [role, setRole] = useState("teacher");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // selected task

  const load = useCallback(async () => {
    const res = await fetch("/api/calendar");
    const data = await res.json();
    setTasks(data.tasks || []);
    setRole(data.role || "teacher");
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const isManager = role !== "teacher";
  const weeks = getCalendarWeeks(year, month);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }
  function goToday() { setYear(now.getFullYear()); setMonth(now.getMonth()); }

  // งานค้างอยู่ (pending / late)
  const pendingTasks = tasks.filter((t) =>
    isManager ? (t.pending > 0 || t.late > 0) : (t.status === "pending" || t.status === "late")
  ).sort((a, b) => {
    const ad = taskDateRange(a).e || "9999";
    const bd = taskDateRange(b).e || "9999";
    return ad < bd ? -1 : 1;
  });

  // งานในเดือนปัจจุบัน
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthTasks = tasks.filter((t) => {
    const { s, e } = taskDateRange(t);
    if (!s && !e) return false;
    const start = s || e;
    const end = e || s;
    return start.startsWith(monthStr) || end.startsWith(monthStr) ||
      (start < monthStr + "-01" && end > monthStr + "-31");
  });

  if (loading) return <div className="card p-12 text-center text-ink-400">กำลังโหลด...</div>;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      {/* ─── Calendar panel ─── */}
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <button onClick={prevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 text-ink-500 hover:bg-ink-50 transition-colors">
              ‹
            </button>
            <div className="text-center">
              <h2 className="font-display text-lg font-bold text-ink-900">
                {MONTHS_TH[month]} {year + 543}
              </h2>
            </div>
            <button onClick={nextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 text-ink-500 hover:bg-ink-50 transition-colors">
              ›
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={goToday}
              className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs text-ink-600 hover:bg-ink-50 transition-colors">
              วันนี้
            </button>
            {isManager && (
              <span className="hidden text-xs text-ink-400 sm:block">
                {monthTasks.length} งานในเดือนนี้
              </span>
            )}
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-ink-100">
          {DAYS_SHORT.map((d, i) => (
            <div key={d}
              className={`py-2.5 text-center text-xs font-semibold ${i >= 5 ? "text-rose-400" : "text-ink-400"}`}>
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div>
          {weeks.map((week, wi) => (
            <WeekRow
              key={wi}
              week={week}
              tasks={tasks}
              today={today}
              currentMonth={month}
              isManager={isManager}
              selected={selected}
              onSelect={(t) => setSelected(selected?.id === t.id ? null : t)}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-ink-100 px-5 py-3">
          <LegendDot color="bg-brand-600" label={isManager ? "กำลังดำเนินการ" : "รอส่ง"} />
          <LegendDot color="bg-emerald-500" label="ส่งครบแล้ว" />
          <LegendDot color="bg-rose-500" label={isManager ? "มีส่งช้า" : "ส่งช้า"} />
          {!isManager && <LegendDot color="bg-amber-400" label="รอส่ง" />}
        </div>
      </div>

      {/* ─── Right panel ─── */}
      <div className="space-y-4">
        {/* Selected task detail */}
        {selected && (
          <SelectedTaskPanel
            task={selected}
            isManager={isManager}
            onClose={() => setSelected(null)}
            onNavigate={() => isManager && router.push(`/dashboard/tasks/${selected.id}`)}
          />
        )}

        {/* Pending tasks */}
        <div className="card overflow-hidden">
          <div className="border-b border-ink-100 px-5 py-3.5">
            <h3 className="font-display font-semibold text-ink-900">
              งานค้างอยู่
              {pendingTasks.length > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-bold text-white">
                  {pendingTasks.length}
                </span>
              )}
            </h3>
          </div>

          {pendingTasks.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <div className="text-3xl">🎉</div>
              <p className="mt-2 text-sm text-ink-400">ไม่มีงานค้างอยู่</p>
            </div>
          ) : (
            <div className="divide-y divide-ink-50 max-h-[460px] overflow-y-auto">
              {pendingTasks.map((t) => (
                <PendingTaskRow
                  key={t.id}
                  task={t}
                  today={today}
                  isManager={isManager}
                  isSelected={selected?.id === t.id}
                  onClick={() => setSelected(selected?.id === t.id ? null : t)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Upcoming this month (no date tasks) */}
        {tasks.filter(t => !taskDateRange(t).s).length > 0 && (
          <div className="card overflow-hidden">
            <div className="border-b border-ink-100 px-5 py-3.5">
              <h3 className="font-display text-sm font-semibold text-ink-500">งานที่ไม่มีกำหนด</h3>
            </div>
            <div className="divide-y divide-ink-50">
              {tasks.filter(t => !taskDateRange(t).s).map(t => (
                <PendingTaskRow
                  key={t.id} task={t} today={today}
                  isManager={isManager}
                  isSelected={selected?.id === t.id}
                  onClick={() => setSelected(selected?.id === t.id ? null : t)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Week Row with multi-day event bars
──────────────────────────────────────────────────────────── */
function WeekRow({ week, tasks, today, currentMonth, isManager, selected, onSelect }) {
  const ws = toStr(week[0]);
  const we = toStr(week[6]);

  const weekTasks = tasks.filter((t) => overlapsWeek(t, ws, we));
  const withLanes = assignLanes(weekTasks);
  const maxLane = withLanes.length > 0 ? Math.max(...withLanes.map(t => t.lane)) : -1;
  const eventsH = maxLane >= 0 ? (maxLane + 1) * 24 + 6 : 0;

  return (
    <div className="border-b border-ink-100 last:border-0">
      {/* Day numbers */}
      <div className="grid grid-cols-7">
        {week.map((day, di) => {
          const ds = toStr(day);
          const isToday = ds === today;
          const inMonth = day.getMonth() === currentMonth;
          const isWeekend = di >= 5;
          return (
            <div key={ds}
              className={`px-1.5 pt-1.5 pb-0.5 text-right ${!inMonth ? "opacity-30" : ""}`}>
              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium
                ${isToday ? "bg-brand-600 text-white font-bold" : isWeekend ? "text-rose-400" : "text-ink-600"}`}>
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
            const { bg, text } = taskColor(task, isManager);
            const isSelected = selected?.id === task.id;
            const leftPct = (pos.startCol / 7) * 100;
            const widthPct = (pos.span / 7) * 100;

            return (
              <button
                key={task.id}
                onClick={() => onSelect(task)}
                title={task.title}
                className={`absolute flex items-center overflow-hidden text-left text-xs font-medium transition-all hover:brightness-110 hover:shadow-sm
                  ${bg} ${text}
                  ${isSelected ? "ring-2 ring-offset-1 ring-white/60 brightness-110 shadow-md" : ""}
                  ${pos.startsHere ? "rounded-l-md" : ""}
                  ${pos.endsHere ? "rounded-r-md" : ""}`}
                style={{
                  left: `calc(${leftPct}% + 2px)`,
                  width: `calc(${widthPct}% - 4px)`,
                  top: `${task.lane * 24 + 2}px`,
                  height: "20px",
                }}
              >
                <span className="truncate px-1.5 leading-none">
                  {!pos.startsHere && <span className="mr-0.5 opacity-60">←</span>}
                  {task.title}
                </span>
              </button>
            );
          })}
        </div>
      )}
      {eventsH === 0 && <div className="h-1" />}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Selected task detail panel
──────────────────────────────────────────────────────────── */
function SelectedTaskPanel({ task, isManager, onClose, onNavigate }) {
  const { s, e } = taskDateRange(task);
  const today = todayStr();
  const isOverdue = e && e < today && (isManager ? task.pending > 0 : task.status === "pending");

  return (
    <div className="card p-4 ring-2 ring-brand-200">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display font-semibold text-ink-900 leading-snug">{task.title}</h3>
        <button onClick={onClose} className="shrink-0 text-ink-400 hover:text-ink-600">✕</button>
      </div>

      {task.description && <p className="mt-1.5 text-sm text-ink-600">{task.description}</p>}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-400">
        {s && <span>📅 เริ่ม {formatDate(s)}</span>}
        {e && <span className={isOverdue ? "text-rose-500 font-semibold" : ""}>🏁 สิ้นสุด {formatDate(e)}{isOverdue ? " ⚠️" : ""}</span>}
        {task.term && <span>📖 {task.term}</span>}
        {task.total_parts > 1 && <span>📊 {task.total_parts} ส่วน</span>}
      </div>

      {/* manager stats */}
      {isManager && task.total > 0 && (
        <div className="mt-3 flex gap-2 text-xs">
          <span className="badge bg-emerald-50 text-emerald-700 ring-emerald-600/20">ส่ง {task.submitted}</span>
          <span className="badge bg-rose-50 text-rose-700 ring-rose-600/20">ช้า {task.late}</span>
          <span className="badge bg-amber-50 text-amber-700 ring-amber-600/20">รอ {task.pending}</span>
          <span className="badge bg-ink-100 text-ink-600">{task.total} คน</span>
        </div>
      )}

      {/* teacher status */}
      {!isManager && (
        <div className="mt-3 flex items-center gap-2">
          <StatusBadge status={task.status} />
          {task.current_parts != null && task.total_parts > 1 && (
            <span className="text-xs text-ink-400">
              {task.current_parts}/{task.total_parts} ส่วน
            </span>
          )}
        </div>
      )}

      {/* attachment */}
      {task.attachment_url && (
        <a href={task.attachment_url} target="_blank" rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100 transition-colors">
          📎 {task.attachment_name || "เอกสารแนบ"}
        </a>
      )}

      {isManager && (
        <button onClick={onNavigate}
          className="mt-3 w-full rounded-xl bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors">
          จัดการงานนี้ →
        </button>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Pending task row
──────────────────────────────────────────────────────────── */
function PendingTaskRow({ task, today, isManager, isSelected, onClick }) {
  const { e } = taskDateRange(task);
  const isOverdue = e && e < today;
  const daysLeft = e ? Math.ceil((new Date(e + "T12:00:00") - new Date()) / 86400000) : null;

  return (
    <button onClick={onClick}
      className={`w-full px-5 py-3.5 text-left transition-colors hover:bg-ink-50 ${isSelected ? "bg-brand-50" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink-800">{task.title}</p>
          {isManager ? (
            <p className="mt-0.5 text-xs text-ink-400">
              รอ {task.pending} · ช้า {task.late} · ทั้งหมด {task.total} คน
            </p>
          ) : (
            <div className="mt-0.5">
              <StatusBadge status={task.status} />
            </div>
          )}
        </div>
        {e && (
          <div className={`shrink-0 text-right text-xs font-semibold ${isOverdue ? "text-rose-500" : daysLeft <= 3 ? "text-amber-500" : "text-ink-400"}`}>
            {isOverdue
              ? `เลย ${Math.abs(daysLeft)} วัน`
              : daysLeft === 0 ? "วันนี้!"
              : daysLeft === 1 ? "พรุ่งนี้"
              : `${daysLeft} วัน`}
          </div>
        )}
      </div>
    </button>
  );
}

function LegendDot({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`h-2.5 w-2.5 rounded-sm ${color}`} />
      <span className="text-xs text-ink-400">{label}</span>
    </div>
  );
}
