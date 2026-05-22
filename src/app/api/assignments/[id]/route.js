import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

// PATCH: อัปเดต assignment
//  - teacher: เปลี่ยน status เป็น submitted (ส่งงานของตัวเอง)
//  - head/admin: ปรับ progress (+/-), ให้คะแนน 0-5
export async function PATCH(req, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 401 });

  const id = Number(params.id);
  const b = await req.json();

  // ตรวจสอบความเป็นเจ้าของ
  const assign = (await sql`SELECT * FROM task_assignments WHERE id = ${id}`)[0];
  if (!assign) return NextResponse.json({ error: "ไม่พบงาน" }, { status: 404 });

  const isOwner = assign.teacher_id === session.id;
  const isManager = ["head", "admin"].includes(session.role);

  // ครูส่งงาน / ยกเลิกส่ง
  if (b.action === "submit" && (isOwner || isManager)) {
    // เช็คว่าเลยกำหนดส่งไหม -> late
    const task = (await sql`SELECT due_date FROM tasks WHERE id = ${assign.task_id}`)[0];
    let status = "submitted";
    if (task?.due_date && new Date() > new Date(task.due_date)) status = "late";
    await sql`
      UPDATE task_assignments
      SET status = ${status}, submitted_at = NOW(), progress = GREATEST(progress, 100)
      WHERE id = ${id}
    `;
    return NextResponse.json({ ok: true, status });
  }

  if (b.action === "unsubmit" && (isOwner || isManager)) {
    await sql`
      UPDATE task_assignments SET status = 'pending', submitted_at = NULL WHERE id = ${id}
    `;
    return NextResponse.json({ ok: true });
  }

  // หัวหน้าปรับ progress (รับค่าใหม่ตรง ๆ 0-100)
  if (b.progress !== undefined && isManager) {
    const p = Math.max(0, Math.min(100, Number(b.progress)));
    await sql`UPDATE task_assignments SET progress = ${p} WHERE id = ${id}`;
    return NextResponse.json({ ok: true, progress: p });
  }

  // หัวหน้าให้คะแนน 0-5
  if (b.score !== undefined && isManager) {
    const s = Math.max(0, Math.min(5, Number(b.score)));
    await sql`
      UPDATE task_assignments
      SET score = ${s}, score_note = ${b.score_note || null},
          scored_at = NOW(), scored_by = ${session.id}
      WHERE id = ${id}
    `;
    return NextResponse.json({ ok: true, score: s });
  }

  return NextResponse.json({ error: "คำขอไม่ถูกต้อง" }, { status: 400 });
}
