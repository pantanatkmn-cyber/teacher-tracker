import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET: รายการการประชุม (ทุก role เห็นได้)
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 401 });

  const rows = await sql`
    SELECT m.*, u.full_name AS created_by_name
    FROM meetings m
    JOIN users u ON u.id = m.created_by
    ORDER BY m.meeting_date DESC
  `;
  return NextResponse.json({ meetings: rows });
}

// POST: สร้างบันทึกการประชุม (admin/head เท่านั้น)
export async function POST(req) {
  const session = await getSession();
  if (!session || !["admin", "head"].includes(session.role)) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }

  const b = await req.json();
  if (!b.title || !b.meeting_date) {
    return NextResponse.json({ error: "กรอกชื่อและวันที่ประชุม" }, { status: 400 });
  }

  const row = await sql`
    INSERT INTO meetings (title, description, meeting_date, end_date, location,
                          attachment_url, attachment_name, created_by)
    VALUES (
      ${b.title}, ${b.description || null}, ${b.meeting_date},
      ${b.end_date || null}, ${b.location || null},
      ${b.attachment_url || null}, ${b.attachment_name || null},
      ${session.id}
    )
    RETURNING id
  `;
  return NextResponse.json({ ok: true, id: row[0].id });
}
