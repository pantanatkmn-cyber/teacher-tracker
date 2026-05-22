import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET: รายการงาน
//  - teacher: เห็นเฉพาะงานที่มอบหมายให้ตัวเอง
//  - head/admin: เห็นงานทั้งหมดที่ตัวเองโพสต์ + ภาพรวม
export async function GET(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 401 });

  if (session.role === "teacher") {
    const rows = await sql`
      SELECT t.id, t.title, t.description, t.due_date, t.term, t.created_at,
             a.id AS assignment_id, a.status, a.progress, a.score, a.score_note,
             a.submitted_at, u.full_name AS created_by_name
      FROM task_assignments a
      JOIN tasks t ON t.id = a.task_id
      JOIN users u ON u.id = t.created_by
      WHERE a.teacher_id = ${session.id}
      ORDER BY t.created_at DESC
    `;
    return NextResponse.json({ tasks: rows });
  }

  // head/admin: งานพร้อมจำนวนผู้รับและสถิติย่อ
  const rows = await sql`
    SELECT t.id, t.title, t.description, t.due_date, t.term, t.created_at,
           u.full_name AS created_by_name,
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
// body: { title, description, due_date, term, target: 'all'|'some', teacher_ids: [] }
export async function POST(req) {
  const session = await getSession();
  if (!session || !["head", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "เฉพาะหัวหน้าแผนก/ผู้ดูแล" }, { status: 403 });
  }

  const b = await req.json();
  if (!b.title) return NextResponse.json({ error: "กรอกชื่องาน" }, { status: 400 });

  // สร้าง task
  const taskRows = await sql`
    INSERT INTO tasks (title, description, created_by, due_date, term)
    VALUES (${b.title}, ${b.description || null}, ${session.id},
            ${b.due_date || null}, ${b.term || null})
    RETURNING id
  `;
  const taskId = taskRows[0].id;

  // หาว่าจะมอบให้ใคร
  let teacherIds = [];
  if (b.target === "all") {
    const t = await sql`SELECT id FROM users WHERE role IN ('teacher','head') AND is_active = TRUE`;
    teacherIds = t.map((r) => r.id);
  } else {
    teacherIds = (b.teacher_ids || []).map(Number);
  }

  // insert assignments
  for (const tid of teacherIds) {
    await sql`
      INSERT INTO task_assignments (task_id, teacher_id)
      VALUES (${taskId}, ${tid})
      ON CONFLICT (task_id, teacher_id) DO NOTHING
    `;
  }

  return NextResponse.json({ ok: true, task_id: taskId, assigned: teacherIds.length });
}
