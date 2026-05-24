import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const steps = [
  `CREATE TABLE IF NOT EXISTS meetings (
    id              SERIAL PRIMARY KEY,
    title           TEXT NOT NULL,
    description     TEXT,
    meeting_date    DATE NOT NULL,
    end_date        DATE,
    location        TEXT,
    attachment_url  TEXT,
    attachment_name TEXT,
    created_by      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(meeting_date)`,
];

console.log("🔧 กำลัง migrate meetings...");
for (const stmt of steps) {
  const arr = [stmt]; arr.raw = [stmt];
  await sql(arr);
  console.log("  ✓", stmt.slice(0, 60).replace(/\n/g, " ").trim());
}
console.log("✅ เสร็จสิ้น");
