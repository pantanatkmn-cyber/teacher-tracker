import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
  return NextResponse.json({
    id: session.id,
    name: session.name,
    username: session.username,
    role: session.role,
    must_change: session.must_change,
  });
}
