import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Shell from "@/components/Shell";

const NAV = [
  { href: "/my", label: "ตารางสอนของฉัน", icon: "📅" },
  { href: "/my/tasks", label: "งานที่ได้รับ", icon: "📋" },
];

export default async function TeacherLayout({ children }) {
  const session = await getSession();
  if (!session) redirect("/login");
  return <Shell session={session} nav={NAV}>{children}</Shell>;
}
