export const DAYS_TH = [
  "", // index 0 ไม่ใช้
  "จันทร์",
  "อังคาร",
  "พุธ",
  "พฤหัสบดี",
  "ศุกร์",
  "เสาร์",
  "อาทิตย์",
];

export const ROLE_LABEL = {
  admin: "ผู้ดูแลระบบ",
  head: "หัวหน้าแผนก",
  teacher: "อาจารย์",
};

export const STATUS_LABEL = {
  pending: "รอส่ง",
  submitted: "ส่งแล้ว",
  late: "ส่งช้า",
};

export const STATUS_STYLE = {
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  submitted: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  late: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

export function formatDate(d) {
  if (!d) return "-";
  const date = new Date(d);
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(d) {
  if (!d) return "-";
  const date = new Date(d);
  return date.toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
}
