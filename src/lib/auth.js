import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "tt_session";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-secret-change-me-please-32chars!!"
);

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// สร้าง JWT แล้วเก็บใน httpOnly cookie
export async function createSession(user) {
  const token = await new SignJWT({
    id: user.id,
    role: user.role,
    name: user.full_name,
    username: user.username,
    must_change: user.must_change_password,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export function clearSession() {
  cookies().set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
}

// อ่าน session ปัจจุบัน (คืน null ถ้าไม่ล็อกอิน)
export async function getSession() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

// ใช้ใน API route / page เพื่อบังคับสิทธิ์
export async function requireRole(roles) {
  const session = await getSession();
  if (!session) return { ok: false, status: 401, session: null };
  if (roles && !roles.includes(session.role)) {
    return { ok: false, status: 403, session };
  }
  return { ok: true, session };
}
