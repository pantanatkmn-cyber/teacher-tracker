import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET ?teacher_id=&from=&to=&term=
//  - ไม่ระบุ teacher_id => ภาพรวมทั้งแผนก (รายคน)
//  - ระบุ teacher_id => สถิติเชิงลึกของคนนั้น
// ช่วงเวลา: from/to (YYYY-MM-DD) หรือ term ('1/2568')
export async function GET(req) {
  const auth = await requireRole(["admin", "head"]);
  if (!auth.ok) return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const teacherId = searchParams.get("teacher_id");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const term = searchParams.get("term");

  // เงื่อนไขช่วงเวลา (อิงวันที่สร้างงาน)
  const dateFrom = from ? new Date(from) : null;
  const dateTo = to ? new Date(to + "T23:59:59") : null;

  if (teacherId) {
    // ----- สถิติรายบุคคล -----
    const rows = await sql`
      SELECT a.id, a.status, a.progress, a.score, a.submitted_at,
             t.title, t.due_date, t.created_at, t.term
      FROM task_assignments a
      JOIN tasks t ON t.id = a.task_id
      WHERE a.teacher_id = ${Number(teacherId)}
        AND (${term}::text IS NULL OR t.term = ${term})
        AND (${dateFrom}::timestamptz IS NULL OR t.created_at >= ${dateFrom})
        AND (${dateTo}::timestamptz IS NULL OR t.created_at <= ${dateTo})
      ORDER BY t.created_at DESC
    `;

    const total = rows.length;
    const submitted = rows.filter((r) => r.status === "submitted").length;
    const late = rows.filter((r) => r.status === "late").length;
    const pending = rows.filter((r) => r.status === "pending").length;
    const scored = rows.filter((r) => r.score != null);
    const avgScore =
      scored.length > 0
        ? (scored.reduce((s, r) => s + Number(r.score), 0) / scored.length).toFixed(2)
        : null;
    const onTimeRate = total > 0 ? Math.round((submitted / total) * 100) : 0;

    const user = (await sql`SELECT full_name, role FROM users WHERE id = ${Number(teacherId)}`)[0];

    return NextResponse.json({
      teacher: user,
      summary: { total, submitted, late, pending, avgScore, onTimeRate },
      tasks: rows,
    });
  }

  // ----- ภาพรวมทั้งแผนก (รายคน) -----
  const rows = await sql`
    SELECT u.id, u.full_name, u.avatar_color, u.role,
           COUNT(a.id)::int AS total,
           COUNT(*) FILTER (WHERE a.status='submitted')::int AS submitted,
           COUNT(*) FILTER (WHERE a.status='late')::int AS late,
           COUNT(*) FILTER (WHERE a.status='pending')::int AS pending,
           ROUND(AVG(a.score), 2) AS avg_score,
           COALESCE(ROUND(AVG(a.progress)), 0)::int AS avg_progress
    FROM users u
    LEFT JOIN task_assignments a ON a.teacher_id = u.id
    LEFT JOIN tasks t ON t.id = a.task_id
      AND (${term}::text IS NULL OR t.term = ${term})
      AND (${dateFrom}::timestamptz IS NULL OR t.created_at >= ${dateFrom})
      AND (${dateTo}::timestamptz IS NULL OR t.created_at <= ${dateTo})
    WHERE u.role IN ('teacher','head') AND u.is_active = TRUE
    GROUP BY u.id
    ORDER BY u.full_name
  `;

  // สรุปรวมแผนก
  const dept = {
    teachers: rows.length,
    total: rows.reduce((s, r) => s + r.total, 0),
    submitted: rows.reduce((s, r) => s + r.submitted, 0),
    late: rows.reduce((s, r) => s + r.late, 0),
    pending: rows.reduce((s, r) => s + r.pending, 0),
  };
  dept.onTimeRate = dept.total > 0 ? Math.round((dept.submitted / dept.total) * 100) : 0;

  return NextResponse.json({ department: dept, teachers: rows });
}
