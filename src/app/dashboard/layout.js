import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Shell from "@/components/Shell";

const NAV = [
  { href: "/dashboard", label: "ปฏิทินงาน", icon: "📅" },
  { href: "/dashboard/tasks", label: "จัดการงาน", icon: "📋" },
  { href: "/dashboard/schedules", label: "ตารางสอน", icon: "🗓" },
  { href: "/dashboard/stats", label: "สถิติรายบุคคล", icon: "📈" },
];

export default async function DashboardLayout({ children }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!["head", "admin"].includes(session.role)) redirect("/my");
  return <Shell session={session} nav={NAV}>{children}</Shell>;
}
