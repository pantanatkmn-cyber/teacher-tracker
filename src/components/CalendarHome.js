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
function taskPalette(id) { return PALETTE[id % PALETTE.length]; }

// สี meeting — คงที่ทุกรายการ
const MEETING_COLOR = { bg: "#475569", light: "#f1f5f9" };

/* ────────────────────────────────────────────────────────────
   Date utilities
──────────────────────────────────────────────────────────── */
function normDate(v) {
  if (!v) return null;
  if (typeof v === "string") return v.slice(0, 10);
  if (v instanceof Date) {
    return `${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,"0")}-${String(v.getDate()).padStart(2,"0")}`;
  }
  return null;
}
function toStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function todayStr() { return toStr(new Date()); }

function eventRange(ev) {
  const s = normDate(ev.start_date ?? ev.end_date ?? ev.due_date ?? ev.meeting_date);
  const e = normDate(ev.end_date   ?? ev.due_date ?? ev.start_date ?? ev.meeting_date);
  return { s, e };
}

function getCalendarWeeks(year, month) {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const startDow = (first.getDay() + 6) % 7;
  const cur = new Date(year, month, 1 - startDow);
  const weeks = [];
  while (cur <= last) {
    const week = [];
    for (let d = 0; d < 7; d++) { week.push(new Date(cur)); cur.setDate(cur.getDate()+1); }
    weeks.push(week);
  }
  return weeks;
}

function getPosition(ev, week) {
  const ws = toStr(week[0]); const we = toStr(week[6]);
  const { s, e } = eventRange(ev);
  if (!s || s > we || e < ws) return null;
  const effS = s < ws ? ws : s;
  const effE = e > we ? we : e;
  const startCol = week.findIndex(d => toStr(d) === effS);
  const endCol   = week.findIndex(d => toStr(d) === effE);
  if (startCol === -1 || endCol === -1) return null;
  return { startCol, span: endCol - startCol + 1, startsHere: s >= ws, endsHere: e <= we };
}

function assignLanes(eventsForWeek) {
  const sorted = [...eventsForWeek].sort((a, b) => {
    const as = eventRange(a).s ?? ""; const bs = eventRange(b).s ?? "";
    return as < bs ? -1 : as > bs ? 1 : 0;
  });
  const laneEnd = [];
  return sorted.map(ev => {
    const { s, e } = eventRange(ev);
    let lane = 0;
    while (laneEnd[lane] && laneEnd[lane] > (s ?? "")) lane++;
    laneEnd[lane] = e ?? s ?? "";
    return { ...ev, lane };
  });
}

function daysFromNow(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr + "T12:00:00") - new Date()) / 86_400_000);
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
  const [tasks,    setTasks]    = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [role, setRole]   = useState("teacher");
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    const res  = await fetch("/api/calendar");
    const data = await res.json();
    setTasks(data.tasks    ?? []);
    setMeetings(data.meetings ?? []);
    setRole(data.role ?? "teacher");
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const isManager = role !== "teacher";
  const weeks     = getCalendarWeeks(year, month);
  const allEvents = [...tasks, ...meetings];

  function prevMonth() { month===0 ? (setYear(y=>y-1),setMonth(11)) : setMonth(m=>m-1); }
  function nextMonth() { month===11 ? (setYear(y=>y+1),setMonth(0)) : setMonth(m=>m+1); }

  const monthStr   = `${year}-${String(month+1).padStart(2,"0")}`;
  const monthFirst = `${monthStr}-01`;
  const monthLast  = `${monthStr}-31`;
  const monthCount = allEvents.filter(ev => {
    const { s, e } = eventRange(ev);
    if (!s && !e) return false;
    return (s??e) <= monthLast && (e??s) >= monthFirst;
  }).length;

  const pendingTasks = tasks
    .filter(t => isManager ? (t.pending > 0 || t.late > 0) : (t.status==="pending"||t.status==="late"))
    .sort((a, b) => { const ae=eventRange(a).e??"9999"; const be=eventRange(b).e??"9999"; return ae<be?-1:ae>be?1:0; });

  const upcomingMeetings = meetings
    .filter(m => { const { e } = eventRange(m); return !e || e >= today; })
    .sort((a, b) => { const as=eventRange(a).s??""; const bs=eventRange(b).s??""; return as<bs?-1:1; })
    .slice(0, 5);

  if (loading) return <div className="card p-12 text-center text-ink-400">กำลังโหลด...</div>;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">

      {/* ── Calendar ── */}
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 text-ink-500 hover:bg-ink-50 transition-colors text-lg">‹</button>
            <h2 className="w-44 text-center font-display text-lg font-bold text-ink-900">
              {MONTHS_TH[month]} {year + 543}
            </h2>
            <button onClick={nextMonth} className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 text-ink-500 hover:bg-ink-50 transition-colors text-lg">›</button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-ink-400">{monthCount} รายการในเดือนนี้</span>
            <button onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }}
              className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs text-ink-600 hover:bg-ink-50 transition-colors">
              วันนี้
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-ink-100 bg-ink-50/50">
          {DAYS_SHORT.map((d, i) => (
            <div key={d} className={`py-2 text-center text-xs font-semibold tracking-wide ${i>=5?"text-rose-400":"text-ink-400"}`}>{d}</div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <WeekRow key={wi} week={week} events={allEvents} today={today}
            currentMonth={month} selected={selected}
            onSelect={ev => setSelected(prev => prev?.id===ev.id && prev?._type===ev._type ? null : ev)} />
        ))}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-ink-100 px-5 py-3">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-5 rounded-sm" style={{ backgroundColor: MEETING_COLOR.bg }} />
            <span className="text-xs text-ink-400">ประชุมแผนก</span>
          </div>
          {tasks.slice(0, 4).map(t => {
            const { bg } = taskPalette(t.id);
            return (
              <div key={t.id} className="flex items-center gap-1.5">
                <div className="h-2.5 w-5 rounded-sm" style={{ backgroundColor: bg }} />
                <span className="max-w-[72px] truncate text-xs text-ink-400">{t.title}</span>
              </div>
            );
          })}
          {tasks.length > 4 && <span className="text-xs text-ink-400">+{tasks.length - 4} งานอื่น</span>}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="space-y-4">

        {/* Selected event popup */}
        {selected && (
          <SelectedPanel
            event={selected}
            isManager={isManager}
            onClose={() => setSelected(null)}
            onManage={() => {
              if (selected._type === "task") router.push(`/dashboard/tasks/${selected.id}`);
              else router.push(isManager ? "/dashboard/meetings" : "/my/meetings");
            }}
          />
        )}

        {/* การประชุมที่กำลังจะมา */}
        {upcomingMeetings.length > 0 && (
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5">
              <h3 className="font-display font-semibold text-ink-900">📋 ประชุมแผนก</h3>
              <button
                onClick={() => router.push(isManager ? "/dashboard/meetings" : "/my/meetings")}
                className="text-xs text-brand-600 hover:underline">
                ดูทั้งหมด →
              </button>
            </div>
            <div className="divide-y divide-ink-50">
              {upcomingMeetings.map(m => {
                const { s } = eventRange(m);
                const days  = daysFromNow(s);
                return (
                  <button key={m.id} onClick={() => setSelected(prev => prev?.id===m.id&&prev?._type==="meeting"?null:{...m,_type:"meeting"})}
                    className={`w-full px-5 py-3 text-left hover:bg-ink-50 transition-colors ${selected?.id===m.id&&selected?._type==="meeting"?"bg-slate-50":""}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-ink-800">{m.title}</p>
                      {days !== null && (
                        <span className={`shrink-0 text-xs font-semibold ${days<0?"text-ink-300":days===0?"text-rose-500":days<=3?"text-amber-500":"text-ink-400"}`}>
                          {days<0 ? "ผ่านไปแล้ว" : days===0 ? "วันนี้!" : days===1 ? "พรุ่งนี้" : `${days} วัน`}
                        </span>
                      )}
                    </div>
                    {m.location && <p className="mt-0.5 text-xs text-ink-400">📍 {m.location}</p>}
                  </button>
                );
              })}
            </div>
          </div>
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
            <div className="px-5 py-8 text-center"><div className="text-3xl">🎉</div><p className="mt-2 text-sm text-ink-400">ไม่มีงานค้างอยู่</p></div>
          ) : (
            <div className="max-h-[360px] divide-y divide-ink-50 overflow-y-auto">
              {pendingTasks.map(t => (
                <PendingRow key={t.id} task={t} today={today} isManager={isManager}
                  isSelected={selected?.id===t.id&&selected?._type==="task"}
                  onClick={() => setSelected(prev => prev?.id===t.id&&prev?._type==="task"?null:t)} />
              ))}
            </div>
          )}
        </div>

        {/* งานไม่มีกำหนด */}
        {(() => {
          const noDate = tasks.filter(t => !eventRange(t).s);
          if (!noDate.length) return null;
          return (
            <div className="card overflow-hidden">
              <div className="border-b border-ink-100 px-5 py-3">
                <h3 className="text-sm font-semibold text-ink-500">งานที่ไม่มีกำหนดวัน</h3>
              </div>
              <div className="divide-y divide-ink-50">
                {noDate.map(t => (
                  <PendingRow key={t.id} task={t} today={today} isManager={isManager}
                    isSelected={selected?.id===t.id&&selected?._type==="task"}
                    onClick={() => setSelected(prev => prev?.id===t.id&&prev?._type==="task"?null:t)} />
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
function WeekRow({ week, events, today, currentMonth, selected, onSelect }) {
  const ws = toStr(week[0]); const we = toStr(week[6]);
  const weekEvents = events.filter(ev => { const {s,e}=eventRange(ev); return s&&s<=we&&e>=ws; });
  const withLanes  = assignLanes(weekEvents);
  const maxLane    = withLanes.length > 0 ? Math.max(...withLanes.map(e=>e.lane)) : -1;
  const eventsH    = maxLane >= 0 ? (maxLane+1)*26+6 : 0;

  return (
    <div className="border-b border-ink-100 last:border-0">
      <div className="grid grid-cols-7">
        {week.map((day, di) => {
          const ds=toStr(day); const isToday=ds===today;
          const inMonth=day.getMonth()===currentMonth; const isWeekend=di>=5;
          return (
            <div key={ds} className={`px-1.5 pb-0.5 pt-1.5 text-right ${!inMonth?"opacity-25":""}`}>
              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium
                ${isToday?"bg-brand-600 font-bold text-white":isWeekend?"text-rose-400":"text-ink-600"}`}>
                {day.getDate()}
              </span>
            </div>
          );
        })}
      </div>
      {eventsH > 0 && (
        <div className="relative mx-0.5" style={{ height: eventsH+"px" }}>
          {withLanes.map(ev => {
            const pos = getPosition(ev, week);
            if (!pos) return null;
            const isMeeting = ev._type === "meeting";
            const color = isMeeting ? MEETING_COLOR.bg : taskPalette(ev.id).bg;
            const isSelected = selected?.id===ev.id && selected?._type===ev._type;
            return (
              <button key={`${ev._type}-${ev.id}`} onClick={() => onSelect(ev)} title={ev.title}
                className="absolute flex items-center overflow-hidden text-left text-xs font-medium text-white transition-all hover:brightness-110"
                style={{
                  backgroundColor: color,
                  left: `calc(${(pos.startCol/7)*100}% + 2px)`,
                  width: `calc(${(pos.span/7)*100}% - 4px)`,
                  top: `${ev.lane*26+3}px`, height: "22px",
                  borderRadius: `${pos.startsHere?"6px":"0"} ${pos.endsHere?"6px":"0"} ${pos.endsHere?"6px":"0"} ${pos.startsHere?"6px":"0"}`,
                  outline: isSelected ? "2px solid white" : "none",
                  outlineOffset: "1px",
                  boxShadow: isSelected ? `0 0 0 3px ${color}50` : "none",
                  zIndex: isSelected ? 10 : 1,
                }}>
                <span className="truncate px-1.5 leading-none">
                  {isMeeting && <span className="mr-0.5">📋</span>}
                  {!pos.startsHere && <span className="opacity-75">← </span>}
                  {ev.title}
                  {!pos.endsHere && <span className="opacity-75"> →</span>}
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
   Selected Event Panel
──────────────────────────────────────────────────────────── */
function SelectedPanel({ event: ev, isManager, onClose, onManage }) {
  const isMeeting = ev._type === "meeting";
  const { s, e }  = eventRange(ev);
  const color     = isMeeting ? MEETING_COLOR : taskPalette(ev.id);
  const days      = daysFromNow(s);

  return (
    <div className="card overflow-hidden" style={{ outline: `2px solid ${color.bg}30` }}>
      <div className="h-1.5 w-full" style={{ backgroundColor: color.bg }} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            {isMeeting && <span className="mb-1 block text-xs font-semibold text-slate-500">📋 ประชุมแผนก</span>}
            <h3 className="font-display font-semibold leading-snug text-ink-900">{ev.title}</h3>
          </div>
          <button onClick={onClose} className="shrink-0 text-ink-400 hover:text-ink-600">✕</button>
        </div>

        {ev.description && <p className="mt-1.5 text-sm text-ink-600">{ev.description}</p>}

        <div className="mt-3 space-y-1.5 text-xs text-ink-500">
          {s && <div className="flex gap-2"><span className="w-16 font-medium shrink-0">{isMeeting?"วันที่":"เริ่มต้น"}</span><span>{formatDate(s)}{days!==null&&<span className={`ml-2 rounded-full px-2 py-0.5 font-semibold ${days<0?"bg-rose-100 text-rose-600":days===0?"bg-red-100 text-red-600":days<=3?"bg-amber-100 text-amber-700":"bg-ink-100 text-ink-500"}`}>{days<0?`เลย ${Math.abs(days)} วัน`:days===0?"วันนี้":`อีก ${days} วัน`}</span>}</span></div>}
          {e && e!==s && <div className="flex gap-2"><span className="w-16 font-medium shrink-0">สิ้นสุด</span><span>{formatDate(e)}</span></div>}
          {ev.location && <div className="flex gap-2"><span className="w-16 font-medium shrink-0">สถานที่</span><span>📍 {ev.location}</span></div>}
          {ev.term && <div className="flex gap-2"><span className="w-16 font-medium shrink-0">เทอม</span><span>{ev.term}</span></div>}
          {!isMeeting && ev.total_parts > 1 && <div className="flex gap-2"><span className="w-16 font-medium shrink-0">จำนวน</span><span>{ev.total_parts} ส่วน</span></div>}
        </div>

        {ev.attachment_url && (
          <a href={ev.attachment_url} target="_blank" rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ backgroundColor: color.light, color: color.bg }}>
            📎 {ev.attachment_name || "เอกสารแนบ"}
          </a>
        )}

        <button onClick={onManage}
          className="mt-3 w-full rounded-xl py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: color.bg }}>
          {isMeeting ? "ดูบันทึกการประชุม →" : isManager ? "จัดการงานนี้ →" : "ดูรายละเอียด →"}
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Pending Task Row
──────────────────────────────────────────────────────────── */
function PendingRow({ task: t, today, isManager, isSelected, onClick }) {
  const { e }  = eventRange(t);
  const days   = daysFromNow(e);
  const { bg } = taskPalette(t.id);
  return (
    <button onClick={onClick}
      className={`w-full px-5 py-3 text-left transition-colors hover:bg-ink-50 ${isSelected?"bg-brand-50":""}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: bg }} />
          <p className="truncate text-sm font-medium text-ink-800">{t.title}</p>
        </div>
        {days !== null && (
          <span className={`shrink-0 text-xs font-semibold ${days<0?"text-rose-500":days<=3?"text-amber-500":"text-ink-400"}`}>
            {days<0?`เลย ${Math.abs(days)} วัน`:days===0?"วันนี้!":days===1?"พรุ่งนี้":`${days} วัน`}
          </span>
        )}
      </div>
      <p className="mt-0.5 pl-[18px] text-xs text-ink-400">
        {isManager
          ? `รอ ${t.pending} · ช้า ${t.late} · ทั้งหมด ${t.total} คน`
          : `สถานะ: ${t.status==="pending"?"รอส่ง":"ส่งช้า"}`}
      </p>
    </button>
  );
}
