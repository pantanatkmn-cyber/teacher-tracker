import { STATUS_LABEL, STATUS_STYLE, initials } from "@/lib/utils";

export function StatCard({ label, value, sub, accent = "brand" }) {
  const ring = {
    brand: "ring-brand-100", emerald: "ring-emerald-100",
    amber: "ring-amber-100", rose: "ring-rose-100",
  }[accent];
  const text = {
    brand: "text-brand-600", emerald: "text-emerald-600",
    amber: "text-amber-600", rose: "text-rose-600",
  }[accent];
  return (
    <div className={`card p-5 ring-1 ${ring}`}>
      <div className="text-sm text-ink-500">{label}</div>
      <div className={`mt-1 font-display text-3xl font-bold ${text}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-ink-400">{sub}</div>}
    </div>
  );
}

export function ProgressBar({ value }) {
  return (
    <div className="progress-track">
      <div className="progress-bar" style={{ width: `${value}%` }} />
    </div>
  );
}

export function StatusBadge({ status }) {
  return <span className={`badge ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>;
}

export function Avatar({ name, color = "#3361f6", size = 9 }) {
  return (
    <div
      className="grid place-items-center rounded-full text-xs font-semibold text-white"
      style={{ background: color, width: `${size * 4}px`, height: `${size * 4}px` }}
    >
      {initials(name)}
    </div>
  );
}

export function ScoreStars({ score }) {
  if (score == null) return <span className="text-xs text-ink-400">ยังไม่ประเมิน</span>;
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= Math.round(score) ? "" : "opacity-25"}>★</span>
      ))}
      <span className="ml-1 text-xs font-medium text-ink-600">{Number(score).toFixed(1)}</span>
    </span>
  );
}
