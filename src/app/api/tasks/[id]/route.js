import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET: รายละเอียดงาน + รายชื่อผู้รับมอบหมายทั้งหมด (head/admin)
export async function GET(req, { params }) {
  const session = await getSession();
  if (!session || !["head", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }
  const id = Number(params.id);

  const task = (await sql`SELECT * FROM tasks WHERE id = ${id}`)[0];
  const assignments = await sql`
    SELECT a.*, u.full_name, u.avatar_color
    FROM task_assignments a
    JOIN users u ON u.id = a.teacher_id
    WHERE a.task_id = ${id}
    ORDER BY u.full_name
  `;
  return NextResponse.json({ task, assignments });
}

// DELETE: ลบงาน (head/admin) — ลบ assignments ตามด้วย FK cascade
export async function DELETE(req, { params }) {
  const session = await getSession();
  if (!session || !["head", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }
  await sql`DELETE FROM tasks WHERE id = ${Number(params.id)}`;
  return NextResponse.json({ ok: true });
}
