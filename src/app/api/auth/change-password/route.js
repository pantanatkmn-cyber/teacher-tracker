import { sql } from "@/lib/db";
import { getSession, verifyPassword, hashPassword, createSession } from "@/lib/auth";
import { NextResponse } from "next/server";

// POST: ผู้ใช้เปลี่ยนรหัสผ่านตัวเอง
export async function POST(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });

  const { current_password, new_password } = await req.json();
  if (!new_password || new_password.length < 6) {
    return NextResponse.json({ error: "รหัสผ่านใหม่ต้องยาวอย่างน้อย 6 ตัว" }, { status: 400 });
  }

  const user = (await sql`SELECT * FROM users WHERE id = ${session.id}`)[0];
  if (!user) return NextResponse.json({ error: "ไม่พบบัญชี" }, { status: 404 });

  // ตรวจรหัสเดิม (ยกเว้นกรณีบังคับเปลี่ยนครั้งแรก ยอมให้ข้ามได้)
  if (!user.must_change_password) {
    const ok = await verifyPassword(current_password || "", user.password_hash);
    if (!ok) return NextResponse.json({ error: "รหัสผ่านเดิมไม่ถูกต้อง" }, { status: 400 });
  }

  const hash = await hashPassword(new_password);
  await sql`
    UPDATE users SET password_hash = ${hash}, must_change_password = FALSE
    WHERE id = ${session.id}
  `;

  // ออก session ใหม่เพื่ออัปเดต must_change flag
  await createSession({ ...user, must_change_password: false });
  return NextResponse.json({ ok: true });
}
