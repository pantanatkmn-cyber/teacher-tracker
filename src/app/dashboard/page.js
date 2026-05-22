"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { StatCard, Avatar, ProgressBar } from "@/components/ui";

export default function DashboardOverview() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <div className="card p-12 text-center text-ink-400">กำลังโหลด...</div>;

  const d = data.department;
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink-900">ภาพรวมแผนก</h1>
        <p className="mt-1 text-sm text-ink-500">
          สรุปการส่งงานของอาจารย์ในแผนกอุตสาหกรรมดิจิทัลและเทคโนโลยีสารสนเทศ
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="จำนวนอาจารย์" value={d.teachers} accent="brand" />
        <StatCard label="ส่งงานแล้ว" value={d.submitted} sub={`จากทั้งหมด ${d.total} งาน`} accent="emerald" />
        <StatCard label="ส่งช้า" value={d.late} accent="rose" />
        <StatCard label="อัตราส่งตรงเวลา" value={`${d.onTimeRate}%`} accent="amber" />
      </div>

      <div className="mt-6 card overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h2 className="font-display font-semibold text-ink-900">อาจารย์ในแผนก</h2>
          <Link href="/dashboard/stats" className="text-sm text-brand-600 hover:underline">
            ดูสถิติรายบุคคล →
          </Link>
        </div>
        <div className="divide-y divide-ink-100">
          {data.teachers.map((t) => (
            <Link key={t.id} href={`/dashboard/stats?teacher=${t.id}`}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-ink-50">
              <Avatar name={t.full_name} color={t.avatar_color} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-ink-900">{t.full_name}</div>
                <div className="text-xs text-ink-400">
                  ส่งแล้ว {t.submitted}/{t.total} · ช้า {t.late} · รอ {t.pending}
                </div>
              </div>
              <div className="hidden w-40 sm:block">
                <div className="mb-1 text-right text-xs text-ink-400">{t.avg_progress}%</div>
                <ProgressBar value={t.avg_progress} />
              </div>
              <div className="w-16 text-right">
                <div className="text-xs text-ink-400">คะแนน</div>
                <div className="font-display font-semibold text-amber-600">
                  {t.avg_score ? `${t.avg_score}` : "-"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
