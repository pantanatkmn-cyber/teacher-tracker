"use client";
import CalendarHome from "@/components/CalendarHome";

export default function MyHome() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink-900">ปฏิทินงานของฉัน</h1>
        <p className="mt-1 text-sm text-ink-500">งานที่ได้รับมอบหมายและกำหนดส่งที่กำลังจะมาถึง</p>
      </div>
      <CalendarHome />
    </div>
  );
}
