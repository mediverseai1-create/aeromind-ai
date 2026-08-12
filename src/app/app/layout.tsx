import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org";
import AppSidebar from "@/components/dashboard/AppSidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentOrg();
  if (!current) redirect("/onboarding");

  return (
    <div className="app-shell">
      <AppSidebar orgName={current.org.name} />
      <main className="app-main">{children}</main>
    </div>
  );
}
