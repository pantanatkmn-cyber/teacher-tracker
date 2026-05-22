import { sql } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "กรอกชื่อผู้ใช้และรหัสผ่าน" }, { status: 400 });
    }

    const rows = await sql`
      SELECT * FROM users WHERE username = ${username.toLowerCase().trim()} LIMIT 1
    `;
    const user = rows[0];
    if (!user || !user.is_active) {
      return NextResponse.json({ error: "ไม่พบบัญชีนี้ หรือถูกระงับ" }, { status: 401 });
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    await createSession(user);
    return NextResponse.json({
      ok: true,
      role: user.role,
      must_change: user.must_change_password,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
