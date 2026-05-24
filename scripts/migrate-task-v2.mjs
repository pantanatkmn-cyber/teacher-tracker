import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const steps = [
  "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date DATE",
  "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS end_date DATE",
  "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS total_parts INTEGER NOT NULL DEFAULT 1",
  "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachment_url TEXT",
  "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachment_name TEXT",
  "ALTER TABLE task_assignments ADD COLUMN IF NOT EXISTS current_parts INTEGER NOT NULL DEFAULT 0",
];

console.log("🔧 กำลัง migrate database...");
for (const stmt of steps) {
  const arr = [stmt]; arr.raw = [stmt];
  await sql(arr);
  console.log("  ✓", stmt.slice(0, 60));
}
console.log("✅ Migration เสร็จสิ้น");
