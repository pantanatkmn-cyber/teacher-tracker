"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { StatCard, Avatar, StatusBadge, ScoreStars } from "@/components/ui";
import { formatDate } from "@/lib/utils";

/* ── สร้าง HTML รายงานในหน้าต่างใหม่ ── */
function openPrintWindow(data, mode, month, term, from, to) {
  if (!data?.teacher || !data?.summary) return;
  const s = data.summary;
  const t = data.teacher;

  const periodLabel =
    mode === "all"    ? "ทุกช่วงเวลา"
    : mode === "month"  ? `เดือน ${month}`
    : mode === "term"   ? `เทอม ${term}`
    : `${from || "..."} ถึง ${to || "..."}`;

  const statusLabel = { pending: "รอส่ง", submitted: "ส่งแล้ว", late: "ส่งช้า" };

  const rows = data.tasks.map((task) => `
    <tr>
      <td>${task.title}</td>
      <td class="center">${statusLabel[task.status] ?? task.status}</td>
      <td class="center">${task.progress ?? 0}%</td>
      <td class="center">${task.score != null ? task.score : "-"}</td>
      <td class="center">${task.due_date ? new Date(task.due_date).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" }) : "-"}</td>
    </tr>
  `).join("");

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8"/>
  <title>รายงานสถิติ – ${t.full_name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "Sarabun", sans-serif; font-size: 13px; color: #1f2433; background: white; padding: 32px; }

    /* Header */
    .report-header { border-bottom: 2px solid #3361f6; padding-bottom: 12px; margin-bottom: 20px; }
    .report-header h1 { font-size: 20px; font-weight: 700; color: #1f43eb; }
    .report-header p  { font-size: 12px; color: #637191; margin-top: 2px; }

    /* Teacher info */
    .teacher-row { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
    .avatar { width: 44px; height: 44px; border-radius: 50%; background: #3361f6; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; flex-shrink: 0; }
    .teacher-name { font-size: 16px; font-weight: 700; }
    .teacher-sub  { font-size: 12px; color: #637191; }

    /* Stat grid */
    .stat-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 16px; }
    .stat-box  { border: 1px solid #eceef2; border-radius: 10px; padding: 12px 14px; }
    .stat-label{ font-size: 11px; color: #637191; margin-bottom: 4px; }
    .stat-val  { font-size: 22px; font-weight: 700; }
    .c-brand   { color: #1f43eb; }
    .c-emerald { color: #059669; }
    .c-rose    { color: #dc2626; }
    .c-amber   { color: #d97706; }

    /* Rate bar */
    .rate-box  { border: 1px solid #eceef2; border-radius: 10px; padding: 12px 14px; margin-bottom: 20px; display: flex; align-items: center; gap: 14px; }
    .rate-label{ font-size: 12px; color: #637191; white-space: nowrap; }
    .rate-track{ flex: 1; height: 8px; background: #eceef2; border-radius: 999px; overflow: hidden; }
    .rate-fill { height: 100%; background: #059669; border-radius: 999px; }
    .rate-pct  { font-size: 15px; font-weight: 700; color: #059669; white-space: nowrap; }

    /* Table */
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead th { background: #f6f7f9; padding: 8px 12px; text-align: left; font-weight: 600; color: #637191; border-bottom: 1px solid #d4d9e3; }
    tbody td { padding: 8px 12px; border-bottom: 1px solid #eceef2; vertical-align: middle; }
    tbody tr:last-child td { border-bottom: none; }
    .center { text-align: center; }
    .table-wrap { border: 1px solid #eceef2; border-radius: 10px; overflow: hidden; }
    .table-title { padding: 10px 14px; font-weight: 700; border-bottom: 1px solid #eceef2; background: #fafafa; }

    /* Footer */
    .footer { margin-top: 28px; font-size: 11px; color: #aeb7ca; text-align: right; border-top: 1px solid #eceef2; padding-top: 10px; }

    @media print {
      body { padding: 0; }
      @page { margin: 1.5cm; size: A4; }
    }
  </style>
</head>
<body>
  <div class="report-header">
    <h1>รายงานสถิติการส่งงานอาจารย์</h1>
    <p>แผนกอุตสาหกรรมดิจิทัลและเทคโนโลยีสารสนเทศ &nbsp;·&nbsp; วิทยาลัยเทคโนโลยีสันตพล</p>
  </div>

  <div class="teacher-row">
    <div class="avatar">${t.full_name?.trim().slice(-2) ?? "??"}</div>
    <div>
      <div class="teacher-name">${t.full_name}</div>
      <div class="teacher-sub">ช่วงเวลา: ${periodLabel}</div>
    </div>
  </div>

  <div class="stat-grid">
    <div class="stat-box"><div class="stat-label">งานทั้งหมด</div><div class="stat-val c-brand">${s.total}</div></div>
    <div class="stat-box"><div class="stat-label">ส่งแล้ว</div><div class="stat-val c-emerald">${s.submitted}</div></div>
    <div class="stat-box"><div class="stat-label">ส่งช้า</div><div class="stat-val c-rose">${s.late}</div></div>
    <div class="stat-box"><div class="stat-label">รอส่ง</div><div class="stat-val c-amber">${s.pending}</div></div>
    <div class="stat-box"><div class="stat-label">คะแนนเฉลี่ย</div><div class="stat-val c-amber">${s.avgScore ?? "–"}<span style="font-size:13px;font-weight:400;color:#637191"> /5</span></div></div>
  </div>

  <div class="rate-box">
    <span class="rate-label">อัตราการส่งตรงเวลา</span>
    <div class="rate-track"><div class="rate-fill" style="width:${s.onTimeRate}%"></div></div>
    <span class="rate-pct">${s.onTimeRate}%</span>
  </div>

  <div class="table-wrap">
    <div class="table-title">รายการงาน (${data.tasks.length} รายการ)</div>
    <table>
      <thead>
        <tr>
          <th>ชื่องาน</th>
          <th class="center">สถานะ</th>
          <th class="center">คืบหน้า</th>
          <th class="center">คะแนน</th>
          <th class="center">กำหนดส่ง</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="5" class="center" style="padding:24px;color:#aeb7ca">ไม่มีข้อมูลในช่วงเวลานี้</td></tr>'}
      </tbody>
    </table>
  </div>

  <div class="footer">พิมพ์เมื่อ ${new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>

  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

  const w = window.open("", "_blank", "width=900,height=700");
  w.document.write(html);
  w.document.close();
}

function StatsInner() {
  const params = useSearchParams();
  const [teachers, setTeachers] = useState([]);
  const [teacherId, setTeacherId] = useState(params.get("teacher") || "");
  const [mode, setMode] = useState("all"); // all | month | term | custom
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [term, setTerm] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then((d) => {
      const list = (d.users || []).filter((u) => ["teacher", "head"].includes(u.role));
      setTeachers(list);
      if (!teacherId && list[0]) setTeacherId(String(list[0].id));
    });
  }, []);

  async function load() {
    if (!teacherId) return;
    const q = new URLSearchParams({ teacher_id: teacherId });
    if (mode === "month" && month) {
      const [y, m] = month.split("-");
      const last = new Date(y, m, 0).getDate();
      q.set("from", `${month}-01`);
      q.set("to", `${month}-${String(last).padStart(2, "0")}`);
    } else if (mode === "term" && term) {
      q.set("term", term);
    } else if (mode === "custom") {
      if (from) q.set("from", from);
      if (to) q.set("to", to);
    }
    const res = await fetch(`/api/stats?${q.toString()}`).then((r) => r.json());
    setData(res);
  }
  useEffect(() => { load(); }, [teacherId, mode, month, term, from, to]);

  const s = data?.summary;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 no-print">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">สถิติรายบุคคล</h1>
          <p className="mt-1 text-sm text-ink-500">ดูสถิติการส่งงานแยกตามช่วงเวลา</p>
        </div>
        <button
          onClick={() => openPrintWindow(data, mode, month, term, from, to)}
          disabled={!data?.summary}
          className="btn-ghost disabled:opacity-40"
        >
          🖨 พิมพ์รายงาน
        </button>
      </div>

      {/* ตัวกรอง */}
      <div className="card mb-6 p-5 no-print">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className="label">เลือกอาจารย์</label>
            <select className="input" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">ช่วงเวลา</label>
            <div className="flex flex-wrap gap-2">
              {[["all", "ทั้งหมด"], ["month", "รายเดือน"], ["term", "รายเทอม"], ["custom", "กำหนดเอง"]].map(([v, l]) => (
                <button key={v} onClick={() => setMode(v)}
                  className={`rounded-xl px-3 py-2 text-sm ${mode === v ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-600"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {mode === "month" && (
          <div className="mt-4 max-w-xs">
            <label className="label">เดือน</label>
            <input type="month" className="input" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
        )}
        {mode === "term" && (
          <div className="mt-4 max-w-xs">
            <label className="label">เทอม</label>
            <input className="input" value={term} placeholder="1/2568" onChange={(e) => setTerm(e.target.value)} />
          </div>
        )}
        {mode === "custom" && (
          <div className="mt-4 grid max-w-md grid-cols-2 gap-3">
            <div><label className="label">ตั้งแต่</label><input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
            <div><label className="label">ถึง</label><input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          </div>
        )}
      </div>

      {/* พื้นที่รายงาน (พิมพ์ได้) */}
      <div className="print-area">
        {/* หัวรายงานสำหรับพิมพ์ */}
        <div className="mb-6 hidden print:block">
          <h1 className="font-display text-xl font-bold">รายงานสถิติการส่งงานอาจารย์</h1>
          <p className="text-sm text-ink-500">แผนกอุตสาหกรรมดิจิทัลและเทคโนโลยีสารสนเทศ · วิทยาลัยเทคโนโลยีสันตพล</p>
          {data?.teacher && <p className="mt-2 text-sm">อาจารย์: {data.teacher.full_name}</p>}
          <p className="text-sm text-ink-500">พิมพ์เมื่อ: {formatDate(new Date())}</p>
        </div>

        {data?.teacher && (
          <div className="mb-5 flex items-center gap-3">
            <Avatar name={data.teacher.full_name} size={11} />
            <div>
              <div className="font-display text-lg font-bold">{data.teacher.full_name}</div>
              <div className="text-sm text-ink-500">
                {mode === "all" ? "ทุกช่วงเวลา" : mode === "month" ? `เดือน ${month}` : mode === "term" ? `เทอม ${term}` : `${from || "..."} ถึง ${to || "..."}`}
              </div>
            </div>
          </div>
        )}

        {s && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard label="งานทั้งหมด" value={s.total} accent="brand" />
              <StatCard label="ส่งแล้ว" value={s.submitted} accent="emerald" />
              <StatCard label="ส่งช้า" value={s.late} accent="rose" />
              <StatCard label="รอส่ง" value={s.pending} accent="amber" />
              <StatCard label="คะแนนเฉลี่ย" value={s.avgScore ?? "-"} sub="เต็ม 5" accent="amber" />
            </div>

            <div className="mt-4 card p-5">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-ink-500">อัตราการส่งตรงเวลา</span>
                <span className="font-display text-lg font-bold text-emerald-600">{s.onTimeRate}%</span>
              </div>
              <div className="progress-track"><div className="progress-bar bg-emerald-500" style={{ width: `${s.onTimeRate}%` }} /></div>
            </div>

            {/* ตารางงาน */}
            <div className="mt-6 card overflow-hidden">
              <div className="border-b border-ink-100 px-5 py-4 font-display font-semibold">รายการงาน</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-ink-50 text-left text-xs text-ink-500">
                    <tr>
                      <th className="px-5 py-3">งาน</th>
                      <th className="px-3 py-3">สถานะ</th>
                      <th className="px-3 py-3">คืบหน้า</th>
                      <th className="px-3 py-3">คะแนน</th>
                      <th className="px-5 py-3">กำหนดส่ง</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {data.tasks.map((t) => (
                      <tr key={t.id}>
                        <td className="px-5 py-3 font-medium text-ink-900">{t.title}</td>
                        <td className="px-3 py-3"><StatusBadge status={t.status} /></td>
                        <td className="px-3 py-3">{t.progress}%</td>
                        <td className="px-3 py-3"><ScoreStars score={t.score} /></td>
                        <td className="px-5 py-3 text-ink-500">{formatDate(t.due_date)}</td>
                      </tr>
                    ))}
                    {data.tasks.length === 0 && (
                      <tr><td colSpan={5} className="px-5 py-10 text-center text-ink-400">ไม่มีข้อมูลในช่วงเวลานี้</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function StatsPage() {
  return (
    <Suspense fallback={<div className="card p-12 text-center text-ink-400">กำลังโหลด...</div>}>
      <StatsInner />
    </Suspense>
  );
}
