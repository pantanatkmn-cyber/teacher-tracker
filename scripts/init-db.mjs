import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  console.error("❌ กรุณาตั้งค่า DATABASE_URL ใน .env.local ก่อน");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const schema = readFileSync(join(__dirname, "../db/schema.sql"), "utf8");

// แยกคำสั่งด้วย ; กรองบรรทัดว่างและ comment
const statements = schema
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0 && !s.startsWith("--"));

console.log(`📦 กำลังรัน ${statements.length} คำสั่ง SQL...`);
for (const stmt of statements) {
  try {
    const arr = [stmt];
    arr.raw = [stmt];
    await sql(arr);
  } catch (e) {
    console.error("❌ Error:", e.message.slice(0, 120));
    console.error("   Statement:", stmt.slice(0, 80));
  }
}
console.log("✅ สร้างฐานข้อมูลเรียบร้อย");
