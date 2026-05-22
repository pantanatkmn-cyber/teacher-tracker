import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET ?teacher_id= : ดูไฟล์ตารางสอน (ครูเห็นแค่ของตัวเอง)
export async function GET(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  let teacherId = Number(searchParams.get("teacher_id")) || session.id;
  if (session.role === "teacher") teacherId = session.id;

  const rows = await sql`
    SELECT id, teacher_id, file_name, mime_type, data_url, term, uploaded_at
    FROM schedule_files WHERE teacher_id = ${teacherId}
    ORDER BY uploaded_at DESC
  `;
  return NextResponse.json({ files: rows });
}

// POST: อัปโหลดไฟล์ตารางสอน (รูป/PDF เป็น base64 data URL)
// body: { teacher_id?, file_name, mime_type, data_url, term }
export async function POST(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 401 });

  const b = await req.json();
  let teacherId = b.teacher_id;
  if (session.role === "teacher") teacherId = session.id;

  const allowed = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
  if (!allowed.includes(b.mime_type)) {
    return NextResponse.json({ error: "รองรับเฉพาะ PNG, JPG, WEBP, PDF" }, { status: 400 });
  }
  // จำกัดขนาด ~4MB (base64 ยาวกว่าไฟล์จริง ~33%)
  if (!b.data_url || b.data_url.length > 5_600_000) {
    return NextResponse.json({ error: "ไฟล์ใหญ่เกินไป (จำกัด ~4MB)" }, { status: 400 });
  }

  const rows = await sql`
    INSERT INTO schedule_files (teacher_id, file_name, mime_type, data_url, term)
    VALUES (${teacherId}, ${b.file_name}, ${b.mime_type}, ${b.data_url}, ${b.term || null})
    RETURNING id, file_name, mime_type, data_url, term, uploaded_at
  `;
  return NextResponse.json({ file: rows[0] });
}

// DELETE ?id= : ลบไฟล์ตารางสอน
export async function DELETE(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));

  if (session.role === "teacher") {
    await sql`DELETE FROM schedule_files WHERE id = ${id} AND teacher_id = ${session.id}`;
  } else {
    await sql`DELETE FROM schedule_files WHERE id = ${id}`;
  }
  return NextResponse.json({ ok: true });
}
