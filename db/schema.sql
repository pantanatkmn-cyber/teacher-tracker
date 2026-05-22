-- ============================================================
-- ระบบติดตามงานอาจารย์ (Teacher Task Tracking System)
-- แผนกอุตสาหกรรมดิจิทัลและเทคโนโลยีสารสนเทศ
-- วิทยาลัยเทคโนโลยีสันตพล
-- Database: Neon (PostgreSQL)
-- ============================================================

-- ----- ตารางผู้ใช้ -----
-- role: 'admin' | 'head' (หัวหน้าแผนก) | 'teacher' (ครู)
-- เข้าสู่ระบบด้วย username (ตั้งเอง) รหัสผ่านเริ่มต้น 123456
-- must_change_password = TRUE บังคับเปลี่ยนรหัสครั้งแรก
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'teacher'
                CHECK (role IN ('admin', 'head', 'teacher')),
  department    TEXT DEFAULT 'อุตสาหกรรมดิจิทัลและเทคโนโลยีสารสนเทศ',
  avatar_color  TEXT DEFAULT '#3361f6',
  must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----- ตารางสอน (อัปโหลดเป็นไฟล์รูป/PDF) -----
CREATE TABLE IF NOT EXISTS schedule_files (
  id          SERIAL PRIMARY KEY,
  teacher_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name   TEXT NOT NULL,
  mime_type   TEXT NOT NULL,
  data_url    TEXT NOT NULL,
  term        TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----- งาน (โพสต์โดยหัวหน้าแผนก/แอดมิน) -----
CREATE TABLE IF NOT EXISTS tasks (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  created_by  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  due_date    DATE,
  term        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----- การมอบหมายงานให้ครูแต่ละคน -----
-- status: 'pending' (รอส่ง) | 'submitted' (ส่งแล้ว) | 'late' (ส่งช้า)
CREATE TABLE IF NOT EXISTS task_assignments (
  id           SERIAL PRIMARY KEY,
  task_id      INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  teacher_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'submitted', 'late')),
  progress     INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  score        NUMERIC(2,1) CHECK (score BETWEEN 0 AND 5),
  score_note   TEXT,
  submitted_at TIMESTAMPTZ,
  scored_at    TIMESTAMPTZ,
  scored_by    INTEGER REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (task_id, teacher_id)
);

-- ----- ดัชนี -----
CREATE INDEX IF NOT EXISTS idx_assign_teacher ON task_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assign_task    ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_assign_status  ON task_assignments(status);
CREATE INDEX IF NOT EXISTS idx_schedfile_teacher ON schedule_files(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
