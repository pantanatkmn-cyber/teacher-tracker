import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  // ระหว่าง build บน Vercel อาจยังไม่มี ก็ปล่อยผ่าน แต่ตอน runtime ต้องมี
  console.warn("DATABASE_URL ยังไม่ถูกตั้งค่า");
}

// sql`...` คืน array ของ rows
export const sql = neon(process.env.DATABASE_URL);
