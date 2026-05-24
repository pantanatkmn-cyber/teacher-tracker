import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 401 });

  // ── การประชุม (ทุก role เห็นได้เหมือนกัน) ──
  const meetings = await sql`
    SELECT id, title, description, meeting_date AS start_date,
           COALESCE(end_date, meeting_date) AS end_date,
           location, attachment_url, attachment_name, created_at
    FROM meetings
    ORDER BY meeting_date
  `;
  const meetingEvents = meetings.map((m) => ({ ...m, _type: "meeting" }));

  // ── งาน ──
  if (session.role === "teacher") {
    const tasks = await sql`
      SELECT t.id, t.title, t.description,
             t.start_date, t.end_date, t.due_date,
             t.total_parts, t.term, t.attachment_url, t.attachment_name,
             t.created_at,
             a.id AS assignment_id, a.status, a.progress,
             a.current_parts, a.submitted_at
      FROM task_assignments a
      JOIN tasks t ON t.id = a.task_id
      WHERE a.teacher_id = ${session.id}
      ORDER BY COALESCE(t.end_date, t.due_date, t.created_at::date)
    `;
    const taskEvents = tasks.map((t) => ({ ...t, _type: "task" }));
    return NextResponse.json({ tasks: taskEvents, meetings: meetingEvents, role: "teacher" });
  }

  // head / admin
  const tasks = await sql`
    SELECT t.id, t.title, t.description,
           t.start_date, t.end_date, t.due_date,
           t.total_parts, t.term, t.attachment_url, t.attachment_name,
           t.created_at,
           COUNT(a.id)::int            AS total,
           COUNT(*) FILTER (WHERE a.status='submitted')::int AS submitted,
           COUNT(*) FILTER (WHERE a.status='late')::int      AS late,
           COUNT(*) FILTER (WHERE a.status='pending')::int   AS pending
    FROM tasks t
    LEFT JOIN task_assignments a ON a.task_id = t.id
    GROUP BY t.id
    ORDER BY COALESCE(t.end_date, t.due_date, t.created_at::date)
  `;
  const taskEvents = tasks.map((t) => ({ ...t, _type: "task" }));
  return NextResponse.json({ tasks: taskEvents, meetings: meetingEvents, role: session.role });
}
