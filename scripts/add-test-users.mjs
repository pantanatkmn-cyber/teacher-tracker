import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const sql = neon(process.env.DATABASE_URL);
const hash = (p) => bcrypt.hashSync(p, 10);

const users = [
  { username: "head2",    pwd: "123456", name: "อ.หัวหน้าแผนก ทดสอบ", role: "head",    color: "#8b5cf6" },
  { username: "teacher4", pwd: "123456", name: "อ.ทดสอบ ระบบ",         role: "teacher", color: "#ec4899" },
];

for (const u of users) {
  await sql`
    INSERT INTO users (username, password_hash, full_name, role, avatar_color, must_change_password)
    VALUES (${u.username}, ${hash(u.pwd)}, ${u.name}, ${u.role}, ${u.color}, true)
    ON CONFLICT (username) DO NOTHING
  `;
  console.log(`+ ${u.username} / ${u.pwd}  (${u.role})`);
}
console.log("✅ เสร็จสิ้น");
