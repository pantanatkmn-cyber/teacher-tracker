import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET: รายการงาน
export async function GET(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 401 });

  if (session.role === "teacher") {
    const rows = await sql`
      SELECT t.id, t.title, t.description,
             t.start_date, t.end_date, t.due_date, t.term,
             t.total_parts, t.attachment_url, t.attachment_name,
             t.created_at,
             a.id AS assignment_id, a.status, a.progress,
             a.current_parts, a.score, a.score_note,
             a.submitted_at, u.full_name AS created_by_name
      FROM task_assignments a
      JOIN tasks t ON t.id = a.task_id
      JOIN users u ON u.id = t.created_by
      WHERE a.teacher_id = ${session.id}
      ORDER BY t.created_at DESC
    `;
    return NextResponse.json({ tasks: rows });
  }

  // head/admin
  const rows = await sql`
    SELECT t.id, t.title, t.description,
           t.start_date, t.end_date, t.due_date, t.term,
           t.total_parts, t.attachment_url, t.attachment_name,
           t.created_at, u.full_name AS created_by_name,
           COUNT(a.id)::int AS total,
           COUNT(*) FILTER (WHERE a.status='submitted')::int AS submitted,
           COUNT(*) FILTER (WHERE a.status='late')::int AS late,
           COUNT(*) FILTER (WHERE a.status='pending')::int AS pending
    FROM tasks t
    JOIN users u ON u.id = t.created_by
    LEFT JOIN task_assignments a ON a.task_id = t.id
    GROUP BY t.id, u.full_name
    ORDER BY t.created_at DESC
  `;
  return NextResponse.json({ tasks: rows });
}

// POST: โพสต์งานใหม่ (head/admin)
export async function POST(req) {
  const session = await getSession();
  if (!session || !["head", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "เฉพาะหัวหน้าแผนก/ผู้ดูแล" }, { status: 403 });
  }

  const b = await req.json();
  if (!b.title) return NextResponse.json({ error: "กรอกชื่องาน" }, { status: 400 });

  const totalParts = Math.max(1, parseInt(b.total_parts) || 1);

  const taskRows = await sql`
    INSERT INTO tasks (
      title, description, created_by,
      start_date, end_date, due_date, term,
      total_parts, attachment_url, attachment_name
    )
    VALUES (
      ${b.title}, ${b.description || null}, ${session.id},
      ${b.start_date || null}, ${b.end_date || null}, ${b.end_date || null},
      ${b.term || null},
      ${totalParts}, ${b.attachment_url || null}, ${b.attachment_name || null}
    )
    RETURNING id
  `;
  const taskId = taskRows[0].id;

  let teacherIds = [];
  if (b.target === "all") {
    const t = await sql`SELECT id FROM users WHERE role IN ('teacher','head') AND is_active = TRUE`;
    teacherIds = t.map((r) => r.id);
  } else {
    teacherIds = (b.teacher_ids || []).map(Number);
  }

  for (const tid of teacherIds) {
    await sql`
      INSERT INTO task_assignments (task_id, teacher_id)
      VALUES (${taskId}, ${tid})
      ON CONFLICT (task_id, teacher_id) DO NOTHING
    `;
  }

  return NextResponse.json({ ok: true, task_id: taskId, assigned: teacherIds.length });
}
