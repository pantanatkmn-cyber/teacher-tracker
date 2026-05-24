"use client";
import CalendarHome from "@/components/CalendarHome";

export default function DashboardOverview() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink-900">ปฏิทินงานแผนก</h1>
        <p className="mt-1 text-sm text-ink-500">ภาพรวมงานทั้งหมดและงานที่ยังค้างอยู่ของอาจารย์ในแผนก</p>
      </div>
      <CalendarHome />
    </div>
  );
}
