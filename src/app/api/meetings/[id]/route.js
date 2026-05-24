import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET: รายละเอียดการประชุม (ทุก role)
export async function GET(req, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 401 });

  const row = (await sql`
    SELECT m.*, u.full_name AS created_by_name
    FROM meetings m JOIN users u ON u.id = m.created_by
    WHERE m.id = ${Number(params.id)}
  `)[0];

  if (!row) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
  return NextResponse.json({ meeting: row });
}

// PATCH: แก้ไขบันทึกประชุม (admin/head)
export async function PATCH(req, { params }) {
  const session = await getSession();
  if (!session || !["admin", "head"].includes(session.role)) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }

  const b = await req.json();
  await sql`
    UPDATE meetings SET
      title           = COALESCE(${b.title ?? null}, title),
      description     = ${b.description ?? null},
      meeting_date    = COALESCE(${b.meeting_date ?? null}, meeting_date),
      end_date        = ${b.end_date ?? null},
      location        = ${b.location ?? null},
      attachment_url  = ${b.attachment_url ?? null},
      attachment_name = ${b.attachment_name ?? null},
      updated_at      = NOW()
    WHERE id = ${Number(params.id)}
  `;
  return NextResponse.json({ ok: true });
}

// DELETE: ลบบันทึกประชุม (admin/head)
export async function DELETE(req, { params }) {
  const session = await getSession();
  if (!session || !["admin", "head"].includes(session.role)) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }

  await sql`DELETE FROM meetings WHERE id = ${Number(params.id)}`;
  return NextResponse.json({ ok: true });
}
