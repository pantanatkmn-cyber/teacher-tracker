import { sql } from "@/lib/db";
import { requireRole, hashPassword } from "@/lib/auth";
import { NextResponse } from "next/server";

const DEFAULT_PASSWORD = "123456";

// GET: รายชื่อผู้ใช้ทั้งหมด (admin, head ดูได้)
export async function GET() {
  const auth = await requireRole(["admin", "head"]);
  if (!auth.ok) return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: auth.status });

  const users = await sql`
    SELECT id, username, full_name, role, department, avatar_color,
           must_change_password, is_active, created_at
    FROM users ORDER BY role, full_name
  `;
  return NextResponse.json({ users });
}

// POST: เพิ่มผู้ใช้ใหม่ (admin เท่านั้น) — รหัสผ่านเริ่มต้น 123456
export async function POST(req) {
  const auth = await requireRole(["admin"]);
  if (!auth.ok) return NextResponse.json({ error: "เฉพาะผู้ดูแลระบบ" }, { status: auth.status });

  try {
    const { username, full_name, role } = await req.json();
    if (!username || !full_name) {
      return NextResponse.json({ error: "กรอกชื่อผู้ใช้และชื่อ-สกุล" }, { status: 400 });
    }
    const hash = await hashPassword(DEFAULT_PASSWORD);
    const colors = ["#3361f6", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const rows = await sql`
      INSERT INTO users (username, password_hash, full_name, role, avatar_color, must_change_password)
      VALUES (${username.toLowerCase().trim()}, ${hash}, ${full_name}, ${role || "teacher"}, ${color}, TRUE)
      RETURNING id, username, full_name, role, avatar_color, is_active
    `;
    return NextResponse.json({ user: rows[0], default_password: DEFAULT_PASSWORD });
  } catch (e) {
    if (String(e.message).includes("duplicate")) {
      return NextResponse.json({ error: "ชื่อผู้ใช้นี้มีอยู่แล้ว" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
