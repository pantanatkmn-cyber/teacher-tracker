# ระบบติดตามงานอาจารย์ — วท.สันตพล
**Teacher Task Tracking System**  
แผนกอุตสาหกรรมดิจิทัลและเทคโนโลยีสารสนเทศ วิทยาลัยเทคโนโลยีสันตพล

## Tech Stack
- **Frontend/Backend**: Next.js 15 (App Router) + Tailwind CSS
- **Database**: Neon (PostgreSQL serverless)
- **Deploy**: Vercel
- **Auth**: JWT cookie (jose) + bcryptjs
- **Font**: Sarabun + IBM Plex Sans Thai (Google Fonts)

---

## โครงสร้างไฟล์

```
teacher-tracker/
├── db/
│   └── schema.sql              ← SQL สร้างตาราง (รัน 1 ครั้ง)
├── scripts/
│   ├── init-db.mjs             ← รัน schema ใน Neon
│   └── seed.mjs                ← สร้างบัญชีตัวอย่าง
├── src/
│   ├── middleware.js            ← ป้องกันหน้าที่ต้อง login
│   ├── lib/
│   │   ├── auth.js             ← JWT session, bcrypt, helper
│   │   ├── db.js               ← Neon connection
│   │   └── utils.js            ← constants, formatDate, initials
│   ├── components/
│   │   ├── Shell.js            ← Sidebar + layout ทุก role
│   │   ├── ScheduleViewer.js   ← อัปโหลด/แสดงไฟล์ตารางสอน
│   │   └── ui.js               ← StatCard, Badge, Avatar, ProgressBar
│   └── app/
│       ├── layout.js           ← root layout + Google Fonts
│       ├── globals.css         ← Tailwind + custom classes
│       ├── page.js             ← redirect ตาม role
│       ├── login/page.js       ← หน้า login
│       ├── change-password/
│       │   └── page.js         ← เปลี่ยนรหัสผ่าน
│       ├── my/                 ← ครู (teacher)
│       │   ├── layout.js
│       │   ├── page.js         ← ตารางสอนของฉัน
│       │   └── tasks/page.js   ← งานที่ได้รับมอบหมาย
│       ├── dashboard/          ← หัวหน้าแผนก (head)
│       │   ├── layout.js
│       │   ├── page.js         ← ภาพรวมแผนก + รายชื่อ
│       │   ├── tasks/page.js   ← โพสต์งาน + จัดการ progress/คะแนน
│       │   ├── schedules/page.js← ดูตารางสอนทุกคน
│       │   └── stats/page.js   ← สถิติรายบุคคล + พิมพ์
│       ├── admin/              ← ผู้ดูแลระบบ
│       │   ├── layout.js
│       │   └── page.js         ← จัดการผู้ใช้ทั้งหมด
│       └── api/
│           ├── me/route.js
│           ├── auth/
│           │   ├── login/route.js
│           │   ├── logout/route.js
│           │   └── change-password/route.js
│           ├── users/
│           │   ├── route.js        ← GET list, POST create
│           │   └── [id]/route.js   ← PATCH edit/role/status, DELETE
│           ├── schedules/route.js  ← GET/POST/DELETE ไฟล์ตารางสอน
│           ├── tasks/
│           │   ├── route.js        ← GET list, POST create+assign
│           │   └── [id]/route.js   ← GET detail, DELETE
│           ├── assignments/
│           │   └── [id]/route.js   ← PATCH progress/submit/score
│           └── stats/route.js      ← สถิติแผนก + รายบุคคล
```

---

## วิธีติดตั้งและ Deploy

### 1. เตรียม Neon Database
1. สร้างบัญชีที่ [neon.tech](https://neon.tech) (ฟรี)
2. สร้าง Project ใหม่
3. คัดลอก **Connection String** จาก Dashboard > Connection Details

### 2. ตั้งค่าโปรเจกต์
```bash
# clone หรือวางโฟลเดอร์แล้วเข้าไป
cd teacher-tracker

# ติดตั้ง packages
npm install

# คัดลอกไฟล์ environment
cp .env.example .env.local
```

แก้ไข `.env.local`:
```env
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require"
AUTH_SECRET="สุ่มตัวอักษร32ตัวขึ้นไป"
```

> สร้าง AUTH_SECRET ได้ด้วย: `openssl rand -base64 32`

### 3. สร้างฐานข้อมูลและข้อมูลตัวอย่าง
```bash
npm run db:init    # สร้างตาราง
npm run db:seed    # เพิ่มบัญชีตัวอย่าง
```

### 4. ทดสอบบนเครื่อง
```bash
npm run dev
# เปิด http://localhost:3000
```

**บัญชีทดสอบ:**
| username | รหัสผ่าน | บทบาท |
|---|---|---|
| admin | admin999 | ผู้ดูแลระบบ |
| head | 123456 | หัวหน้าแผนก |
| teacher1 | 123456 | อาจารย์ |

> ⚠️ บัญชี head, teacher1-3 จะถูกบังคับให้เปลี่ยนรหัสผ่านเมื่อ login ครั้งแรก

### 5. Deploy บน Vercel
```bash
npm run build   # ตรวจว่า build ผ่านก่อน
```

1. Push โค้ดขึ้น GitHub
2. ไปที่ [vercel.com](https://vercel.com) > New Project > Import จาก GitHub
3. ใส่ Environment Variables 2 ตัว:
   - `DATABASE_URL` = connection string จาก Neon
   - `AUTH_SECRET` = คีย์ลับ 32+ ตัวอักษร
4. กด Deploy

---

## บทบาทและสิทธิ์

| ฟีเจอร์ | admin | หัวหน้าแผนก | ครู |
|---|:---:|:---:|:---:|
| จัดการบัญชีผู้ใช้ | ✅ | ❌ | ❌ |
| แต่งตั้งหัวหน้าแผนก | ✅ | ❌ | ❌ |
| ดูภาพรวมแผนก | ✅ | ✅ | ❌ |
| โพสต์งาน | ✅ | ✅ | ❌ |
| ปรับ progression | ✅ | ✅ | ❌ |
| ให้คะแนน 0-5 | ✅ | ✅ | ❌ |
| ดูสถิติรายบุคคล | ✅ | ✅ | ❌ |
| พิมพ์รายงาน | ✅ | ✅ | ❌ |
| ดูตารางสอนทุกคน | ✅ | ✅ | ❌ |
| ดูตารางสอนตัวเอง | ✅ | ✅ | ✅ |
| อัปโหลดตารางสอน | ✅ | ✅ | ✅ |
| ดูงานของตัวเอง | ✅ | ✅ | ✅ |
| ส่งงาน | ✅ | ✅ | ✅ |
| เปลี่ยนรหัสผ่านตัวเอง | ✅ | ✅ | ✅ |

---

## หมายเหตุสำหรับการพัฒนาต่อ (ใน Claude Code)

- **ไฟล์ตารางสอน** เก็บเป็น base64 ใน Neon โดยตรง จำกัด 4MB ต่อไฟล์ หากต้องการขนาดใหญ่กว่าควรเปลี่ยนเป็น Vercel Blob หรือ Cloudinary
- **สถิติ** query รวมอยู่ใน `src/app/api/stats/route.js` ปรับ filter ได้ตามต้องการ
- **พิมพ์รายงาน** ใช้ `window.print()` + `@media print` CSS ใน `globals.css`
- **Neon free tier** มี 0.5GB storage และ 190 compute hours/เดือน เพียงพอสำหรับโรงเรียน
