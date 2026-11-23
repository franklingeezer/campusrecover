
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardShell from "@/app/components/dashboard/dashboard-shell";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, student_id, email, department")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Profile loading error:", profileError.message);
  }

  const dashboardProfile = {
    full_name:
      profile?.full_name ||
      user.user_metadata?.full_name ||
      "Campus Member",

    student_id: profile?.student_id || "Not available",

    email: profile?.email || user.email || "",

    department: profile?.department || null,
  };

  return <DashboardShell profile={dashboardProfile} />;
}
