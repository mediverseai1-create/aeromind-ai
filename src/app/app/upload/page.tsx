import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org";
import UploadFlow from "@/components/dashboard/UploadFlow";

export const metadata = { title: "Upload data — AeroMind AI" };

export default async function UploadPage() {
  const current = await getCurrentOrg();
  if (!current) redirect("/onboarding");

  return (
    <>
      <div className="app-topbar">
        <h1>Upload a sales file</h1>
      </div>
      <UploadFlow orgId={current.org.id} userId={current.user.id} cadence={current.org.cadence} />
    </>
  );
}
