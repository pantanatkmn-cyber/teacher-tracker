import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

if (!process.env.DATABASE_URL) {
  console.error("❌ กรุณาตั้งค่า DATABASE_URL ก่อน");
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);
const hash = (p) => bcrypt.hashSync(p, 10);
const DEFAULT_PWD = "123456";

const users = [
  { username: "admin",    pwd: "admin999", name: "ผู้ดูแลระบบ",          role: "admin",   color: "#1f43eb", must: false },
  { username: "head",     pwd: DEFAULT_PWD, name: "อ.หัวหน้าแผนก ดิจิทัล", role: "head",    color: "#0ea5e9", must: true  },
  { username: "teacher1", pwd: DEFAULT_PWD, name: "อ.สมชาย ใจดี",         role: "teacher", color: "#10b981", must: true  },
  { username: "teacher2", pwd: DEFAULT_PWD, name: "อ.สมหญิง รักเรียน",    role: "teacher", color: "#f59e0b", must: true  },
  { username: "teacher3", pwd: DEFAULT_PWD, name: "อ.วิชัย เทคโน",        role: "teacher", color: "#ef4444", must: true  },
];

console.log("🌱 กำลังเพิ่มบัญชีตัวอย่าง...");
for (const u of users) {
  await sql`
    INSERT INTO users (username, password_hash, full_name, role, avatar_color, must_change_password)
    VALUES (${u.username}, ${hash(u.pwd)}, ${u.name}, ${u.role}, ${u.color}, ${u.must})
    ON CONFLICT (username) DO NOTHING
  `;
  console.log(`  + ${u.username} / ${u.pwd}`);
}

// งานตัวอย่าง
const head = (await sql`SELECT id FROM users WHERE username='head'`)[0];
const teachers = await sql`SELECT id FROM users WHERE role='teacher'`;
if (head && teachers.length) {
  const task = (await sql`
    INSERT INTO tasks (title, description, created_by, due_date, term)
    VALUES ('ส่งแผนการสอนภาคเรียนที่ 1', 'จัดทำแผนการสอนรายวิชาที่รับผิดชอบทุกวิชา', ${head.id}, CURRENT_DATE + 7, '1/2568')
    RETURNING id
  `)[0];
  for (const t of teachers) {
    await sql`INSERT INTO task_assignments (task_id, teacher_id) VALUES (${task.id}, ${t.id}) ON CONFLICT DO NOTHING`;
  }
  console.log("  ✓ เพิ่มงานตัวอย่าง 1 งาน");
}

console.log("\n✅ เสร็จสิ้น");
console.log("🔑 บัญชีสำหรับทดสอบ:");
console.log("   admin    / admin999  (ไม่ต้องเปลี่ยนรหัส)");
console.log("   head     / 123456    (ต้องเปลี่ยนรหัสครั้งแรก)");
console.log("   teacher1 / 123456    (ต้องเปลี่ยนรหัสครั้งแรก)");
