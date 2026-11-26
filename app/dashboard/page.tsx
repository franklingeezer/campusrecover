
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import DashboardShell from "@/app/components/dashboard/dashboard-shell";

async function DashboardContent() {
  // Render this component at request time.
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Fetch the user's profile.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, student_id, email, department")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Profile loading error:", profileError);
  }

  // Fetch dashboard statistics and recent reports.
  const [
    lostResult,
    foundResult,
    activeResult,
    resolvedResult,
    recentResult,
  ] = await Promise.all([
    supabase
      .from("item_reports")
      .select("*", { count: "exact", head: true })
      .eq("report_type", "lost"),

    supabase
      .from("item_reports")
      .select("*", { count: "exact", head: true })
      .eq("report_type", "found"),

    supabase
      .from("item_reports")
      .select("*", { count: "exact", head: true })
      .in("status", ["open", "under_review", "matched"]),

    supabase
      .from("item_reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "resolved"),

    supabase
      .from("item_reports")
      .select(`
        id,
        title,
        report_type,
        status,
        created_at,
        categories(name),
        locations(name)
      `)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // Log database errors.
  if (lostResult.error) {
    console.error("Lost reports error:", lostResult.error);
  }

  if (foundResult.error) {
    console.error("Found reports error:", foundResult.error);
  }

  if (activeResult.error) {
    console.error("Active reports error:", activeResult.error);
  }

  if (resolvedResult.error) {
    console.error("Resolved reports error:", resolvedResult.error);
  }

  if (recentResult.error) {
    console.error("Recent reports error:", recentResult.error);
  }

  // Prepare profile data.
  const dashboardProfile = {
    full_name:
      profile?.full_name ||
      user.user_metadata?.full_name ||
      "Campus Member",

    student_id: profile?.student_id || "Not available",

    email: profile?.email || user.email || "",

    department: profile?.department || null,
  };

  // Prepare statistics.
  const stats = {
    lostItems: lostResult.count ?? 0,
    foundItems: foundResult.count ?? 0,
    activeReports: activeResult.count ?? 0,
    itemsReturned: resolvedResult.count ?? 0,
  };

  
// Prepare recent reports.
const recentReports = (recentResult.data ?? []).map((report) => {
  const category = Array.isArray(report.categories)
    ? report.categories[0]
    : report.categories;

  const location = Array.isArray(report.locations)
    ? report.locations[0]
    : report.locations;

  return {
    id: report.id,
    title: report.title,
    report_type: report.report_type,
    status: report.status,
    created_at: report.created_at
      ? new Date(report.created_at).toISOString().slice(0, 10)
      : "Date unavailable",

    category_name: category?.name ?? "Uncategorized",
    location_name: location?.name ?? "Location not specified",
  };
});


  return (
    <DashboardShell
      profile={dashboardProfile}
      stats={stats}
      recentReports={recentReports}
    />
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F4F8F6]">
          <div className="text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-[#D7EDE3] border-t-[#176F59]" />

            <p className="text-sm text-slate-500">
              Loading your CampusRecover dashboard...
            </p>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
