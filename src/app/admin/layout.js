import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Shell from "@/components/Shell";

const NAV = [
  { href: "/admin", label: "จัดการผู้ใช้", icon: "👥" },
  { href: "/dashboard", label: "ภาพรวมแผนก", icon: "📊" },
  { href: "/dashboard/tasks", label: "จัดการงาน", icon: "📋" },
  { href: "/dashboard/schedules", label: "ตารางสอน", icon: "📅" },
  { href: "/dashboard/stats", label: "สถิติรายบุคคล", icon: "📈" },
];

export default async function AdminLayout({ children }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");
  return <Shell session={session} nav={NAV}>{children}</Shell>;
}
