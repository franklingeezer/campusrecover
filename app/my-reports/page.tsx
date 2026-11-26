
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  PackageOpen,
  Eye,
  FileText,
  MessageSquare,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

export default function MyReportsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F4F8F6] flex items-center justify-center">
          <p className="text-sm text-slate-500">
            Loading your reports...
          </p>
        </main>
      }
    >
      <MyReportsContent />
    </Suspense>
  );
}

async function MyReportsContent() {
  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Fetch the user's reports and lookup data
  const [reportsResult, categoriesResult, locationsResult] =
    await Promise.all([
      supabase
        .from("item_reports")
        .select(
          "id, title, description, report_type, status, category_id, location_id, image_path, incident_at, created_at"
        )
        .eq("reporter_id", user.id)
        .order("created_at", { ascending: false }),

      supabase.from("categories").select("id, name"),

      supabase.from("locations").select("id, name, building"),
    ]);

  if (reportsResult.error) {
    console.error(
      "My Reports loading error:",
      reportsResult.error.message
    );
  }

  if (categoriesResult.error) {
    console.error(
      "Categories loading error:",
      categoriesResult.error.message
    );
  }

  if (locationsResult.error) {
    console.error(
      "Locations loading error:",
      locationsResult.error.message
    );
  }

  const reports = reportsResult.data ?? [];
  const categories = categoriesResult.data ?? [];
  const locations = locationsResult.data ?? [];

  // Create lookup maps
  const categoryMap = new Map(
    categories.map((category) => [
      String(category.id),
      category.name,
    ])
  );

  const locationMap = new Map(
    locations.map((location) => [
      location.id,
      `${location.name}${
        location.building ? ` — ${location.building}` : ""
      }`,
    ])
  );

  // Fetch claims belonging to these reports
  const reportIds = reports.map((report) => report.id);

  let claimCountAvailable = true;
  const claimCountMap = new Map<string, number>();

  if (reportIds.length > 0) {
    const { data: claims, error: claimsError } = await supabase
      .from("claims")
      .select("report_id")
      .in("report_id", reportIds);

    if (claimsError) {
      claimCountAvailable = false;
      console.error(
        "Claim counts loading error:",
        claimsError.message
      );
    } else {
      for (const claim of claims ?? []) {
        claimCountMap.set(
          claim.report_id,
          (claimCountMap.get(claim.report_id) ?? 0) + 1
        );
      }
    }
  }

  const lostCount = reports.filter(
    (report) => report.report_type === "lost"
  ).length;

  const foundCount = reports.filter(
    (report) => report.report_type === "found"
  ).length;

  const resolvedCount = reports.filter(
    (report) => report.status === "resolved"
  ).length;

  function formatDate(date: string | null) {
    if (!date) return "Date unavailable";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function statusStyle(status: string) {
    switch (status) {
      case "open":
        return "bg-emerald-100 text-emerald-800";

      case "resolved":
        return "bg-blue-100 text-blue-800";

      case "matched":
        return "bg-violet-100 text-violet-800";

      case "closed":
        return "bg-slate-200 text-slate-700";

      default:
        return "bg-amber-100 text-amber-800";
    }
  }

  return (
    <main className="min-h-screen bg-[#F4F8F6]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#E2ECE7] bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-medium text-[#176F59] transition hover:text-[#0F3A2F]"
          >
            <ArrowLeft size={18} />
            Back to dashboard
          </Link>

          <span className="font-semibold tracking-tight text-[#0F3A2F]">
            CampusRecover
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10">
        {/* Page heading */}
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#E6F3ED] px-3 py-1.5 text-xs font-semibold text-[#176F59]">
            <FileText size={14} />
            YOUR ACTIVITY
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#0F3A2F]">
            My Reports
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Manage and track the lost and found items you've reported.
          </p>
        </div>

        {/* Summary cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Total reports",
              value: reports.length,
              icon: FileText,
            },
            {
              label: "Lost items",
              value: lostCount,
              icon: PackageOpen,
            },
            {
              label: "Found items",
              value: foundCount,
              icon: Eye,
            },
            {
              label: "Resolved",
              value: resolvedCount,
              icon: MessageSquare,
            },
          ].map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-[#E0EAE5] bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    {stat.label}
                  </p>

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E6F3ED] text-[#176F59]">
                    <Icon size={18} />
                  </div>
                </div>

                <p className="mt-3 text-2xl font-bold text-[#0F3A2F]">
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Report actions and result count */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            {reports.length}{" "}
            {reports.length === 1 ? "report" : "reports"} submitted
          </p>

          <Link
            href="/report"
            className="rounded-xl bg-[#176F59] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0F3A2F]"
          >
            + Report an item
          </Link>
        </div>

        {/* Error state */}
        {reportsResult.error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            We couldn't load your reports right now. Please refresh the
            page and try again.
          </div>
        ) : reports.length === 0 ? (
          /* Empty state */
          <div className="rounded-2xl border border-[#E0EAE5] bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E6F3ED]">
              <PackageOpen size={27} className="text-[#176F59]" />
            </div>

            <h2 className="font-semibold text-[#0F3A2F]">
              No reports submitted yet
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              When you report a lost or found item, it will appear here.
            </p>

            <Link
              href="/report"
              className="mt-6 inline-block rounded-xl bg-[#176F59] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0F3A2F]"
            >
              Report your first item
            </Link>
          </div>
        ) : (
          /* Reports list */
          <div className="space-y-5">
            {reports.map((report) => {
              const imageUrl = report.image_path
                ? supabase.storage
                    .from("item-images")
                    .getPublicUrl(report.image_path).data.publicUrl
                : null;

              const isLost = report.report_type === "lost";
              const claimCount = claimCountMap.get(report.id) ?? 0;

              return (
                <article
                  key={report.id}
                  className="overflow-hidden rounded-2xl border border-[#E0EAE5] bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="grid md:grid-cols-[240px_1fr]">
                    {/* Item photograph */}
                    <div className="relative flex min-h-52 items-center justify-center bg-[#F0F5F2] md:min-h-full">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={report.title}
                          className="h-full max-h-72 w-full object-cover md:absolute md:inset-0 md:max-h-none"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
                          <PackageOpen size={38} />
                          <span className="text-xs">
                            No photograph available
                          </span>
                        </div>
                      )}

                      <span
                        className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${
                          isLost
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {isLost ? "Lost item" : "Found item"}
                      </span>
                    </div>

                    {/* Report information */}
                    <div className="min-w-0 p-5 sm:p-6">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyle(
                            report.status
                          )}`}
                        >
                          {String(report.status).replaceAll("_", " ")}
                        </span>

                        <span className="text-xs text-slate-400">
                          Report #{report.id.slice(0, 8)}
                        </span>
                      </div>

                      <h2 className="text-lg font-bold text-[#0F3A2F]">
                        {report.title}
                      </h2>

                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                        {report.description}
                      </p>

                      <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <PackageOpen
                            size={15}
                            className="shrink-0 text-[#176F59]"
                          />
                          {categoryMap.get(
                            String(report.category_id)
                          ) ?? "Uncategorized"}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <MapPin
                            size={15}
                            className="shrink-0 text-[#176F59]"
                          />
                          {locationMap.get(report.location_id ?? "") ??
                            "Location unavailable"}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <CalendarDays
                            size={15}
                            className="shrink-0 text-[#176F59]"
                          />
                          Reported {formatDate(report.created_at)}
                        </div>

                        {report.incident_at && (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <CalendarDays
                              size={15}
                              className="shrink-0 text-[#176F59]"
                            />
                            Incident {formatDate(report.incident_at)}
                          </div>
                        )}
                      </div>

                      {/* Claim count for found reports */}
                      {!isLost && (
                        <div className="mt-4 rounded-xl bg-[#F4F8F6] px-4 py-3 text-sm">
                          <span className="font-medium text-[#176F59]">
                            {claimCountAvailable
                              ? `${claimCount} ${
                                  claimCount === 1 ? "claim" : "claims"
                                } received`
                              : "Claim count unavailable"}
                          </span>
                        </div>
                      )}

                      <div className="mt-5">
                        <Link
                          href={`/browse/${report.id}`}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-[#176F59] transition hover:text-[#0F3A2F]"
                        >
                          View report details
                          <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
