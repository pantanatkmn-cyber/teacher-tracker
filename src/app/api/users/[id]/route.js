import { sql } from "@/lib/db";
import { requireRole, hashPassword } from "@/lib/auth";
import { NextResponse } from "next/server";

// PATCH: แก้ไขข้อมูล / เปลี่ยน role (แต่งตั้งหัวหน้าแผนก) / รีเซ็ตรหัสผ่าน / ระงับบัญชี
export async function PATCH(req, { params }) {
  const auth = await requireRole(["admin"]);
  if (!auth.ok) return NextResponse.json({ error: "เฉพาะผู้ดูแลระบบ" }, { status: auth.status });

  const id = Number(params.id);
  const body = await req.json();

  try {
    if (body.full_name !== undefined) {
      await sql`UPDATE users SET full_name = ${body.full_name} WHERE id = ${id}`;
    }
    if (body.role !== undefined) {
      await sql`UPDATE users SET role = ${body.role} WHERE id = ${id}`;
    }
    if (body.is_active !== undefined) {
      await sql`UPDATE users SET is_active = ${body.is_active} WHERE id = ${id}`;
    }
    if (body.reset_password) {
      const hash = await hashPassword("123456");
      await sql`UPDATE users SET password_hash = ${hash}, must_change_password = TRUE WHERE id = ${id}`;
    }
    if (body.username) {
      await sql`UPDATE users SET username = ${body.username.toLowerCase().trim()} WHERE id = ${id}`;
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (String(e.message).includes("duplicate")) {
      return NextResponse.json({ error: "ชื่อผู้ใช้นี้มีอยู่แล้ว" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// DELETE: ลบผู้ใช้ (admin)
export async function DELETE(req, { params }) {
  const auth = await requireRole(["admin"]);
  if (!auth.ok) return NextResponse.json({ error: "เฉพาะผู้ดูแลระบบ" }, { status: auth.status });

  const id = Number(params.id);
  if (id === auth.session.id) {
    return NextResponse.json({ error: "ลบบัญชีตัวเองไม่ได้" }, { status: 400 });
  }
  await sql`DELETE FROM users WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
