"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { StatCard, Avatar, StatusBadge, ScoreStars } from "@/components/ui";
import { formatDate } from "@/lib/utils";

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
        <button onClick={() => window.print()} className="btn-ghost">🖨 พิมพ์รายงาน</button>
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
