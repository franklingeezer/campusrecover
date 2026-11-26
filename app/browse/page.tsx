
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  CalendarDays,
  Search,
  PackageOpen,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { connection } from "next/server";

type BrowsePageProps = {
  searchParams: Promise<{
    q?: string;
    type?: string;
    category?: string;
  }>;
};

export default function BrowsePage({
  searchParams,
}: BrowsePageProps) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F4F8F6] flex items-center justify-center">
          <p className="text-sm text-slate-500">
            Loading campus reports...
          </p>
        </main>
      }
    >
      <BrowseContent searchParams={searchParams} />
    </Suspense>
  );
}

async function BrowseContent({
  searchParams,
}: BrowsePageProps) {
  await connection();
  const supabase = await createClient();
  const params = await searchParams;

  const searchQuery = params.q?.trim() ?? "";
  const selectedType =
    params.type === "lost" || params.type === "found"
      ? params.type
      : "";
  const selectedCategory = params.category ?? "";

  // Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Fetch categories and locations
  const [categoriesResult, locationsResult] = await Promise.all([
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("locations").select("id, name, building").order("name"),
  ]);

  if (categoriesResult.error) {
    console.error("Categories loading error:", categoriesResult.error.message);
  }

  if (locationsResult.error) {
    console.error("Locations loading error:", locationsResult.error.message);
  }

  const categories = categoriesResult.data ?? [];
  const locations = locationsResult.data ?? [];

  // Build reports query
  let reportsQuery = supabase
    .from("item_reports")
    .select(
      "id, title, description, report_type, status, category_id, location_id, image_path, incident_at, created_at"
    )
    .order("created_at", { ascending: false });

  if (searchQuery) {
    const safeQuery = searchQuery.replace(/[(),]/g, " ");
    reportsQuery = reportsQuery.or(
      `title.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%`
    );
  }

  if (selectedType) {
    reportsQuery = reportsQuery.eq("report_type", selectedType);
  }

  if (selectedCategory) {
    reportsQuery = reportsQuery.eq("category_id", selectedCategory);
  }

  const { data: reportsData, error: reportsError } =
    await reportsQuery;

  if (reportsError) {
    console.error("Reports loading error:", reportsError.message);
  }

  const reports = reportsData ?? [];

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

  const hasFilters =
    Boolean(searchQuery) ||
    Boolean(selectedType) ||
    Boolean(selectedCategory);

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
            <Search size={14} />
            CAMPUS COMMUNITY
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#0F3A2F]">
            Browse items
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Explore lost and found belongings reported by the DIU community.
          </p>
        </div>

        {/* Search and filters */}
        <form
          action="/browse"
          method="GET"
          className="mb-7 rounded-2xl border border-[#E0EAE5] bg-white p-5 shadow-sm"
        >
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#0F3A2F]">
            <SlidersHorizontal size={17} />
            Search and filters
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                name="q"
                defaultValue={searchQuery}
                placeholder="Search items..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-[#176F59] focus:ring-2 focus:ring-[#176F59]/10"
              />
            </div>

            {/* Report type */}
            <select
              name="type"
              defaultValue={selectedType}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-[#176F59] focus:ring-2 focus:ring-[#176F59]/10"
            >
              <option value="">All reports</option>
              <option value="lost">Lost items</option>
              <option value="found">Found items</option>
            </select>

            {/* Category */}
            <select
              name="category"
              defaultValue={selectedCategory}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-[#176F59] focus:ring-2 focus:ring-[#176F59]/10"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-xl bg-[#176F59] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0F3A2F]"
            >
              Apply filters
            </button>

            {hasFilters && (
              <Link
                href="/browse"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <X size={15} />
                Clear filters
              </Link>
            )}
          </div>
        </form>

        {/* Results summary */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {reports.length}{" "}
            {reports.length === 1 ? "report" : "reports"} found
          </p>

          <Link
            href="/report"
            className="rounded-xl bg-[#176F59] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0F3A2F]"
          >
            + Report an item
          </Link>
        </div>

        {/* Reports */}
        {reports.length === 0 ? (
          <div className="rounded-2xl border border-[#E0EAE5] bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E6F3ED]">
              <PackageOpen size={26} className="text-[#176F59]" />
            </div>

            <h2 className="font-semibold text-[#0F3A2F]">
              {hasFilters ? "No matching reports" : "No reports yet"}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {hasFilters
                ? "Try changing your search or filters."
                : "There are no lost or found items to display right now."}
            </p>

            {hasFilters && (
              <Link
                href="/browse"
                className="mt-5 inline-block text-sm font-semibold text-[#176F59] hover:underline"
              >
                Clear all filters
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => {
              const imageUrl = report.image_path
                ? supabase.storage
                    .from("item-images")
                    .getPublicUrl(report.image_path).data.publicUrl
                : null;

              const isLost = report.report_type === "lost";

              return (
                <Link
  key={report.id}
  href={`/browse/${report.id}`}
  className="block overflow-hidden rounded-2xl border border-[#E0EAE5] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
>
                  {/* Item image */}
                  <div className="relative flex h-52 items-center justify-center bg-[#F0F5F2]">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={report.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <PackageOpen size={34} />
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

                  {/* Item details */}
                  <div className="p-5">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <h2 className="font-semibold text-[#0F3A2F]">
                        {report.title}
                      </h2>

                      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium capitalize text-slate-600">
                        {String(report.status).replaceAll("_", " ")}
                      </span>
                    </div>

                    <p className="line-clamp-3 text-sm leading-6 text-slate-500">
                      {report.description}
                    </p>

                    <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <PackageOpen size={14} className="shrink-0 text-[#176F59]" />
                        {categoryMap.get(String(report.category_id)) ??
                          "Uncategorized"}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MapPin size={14} className="shrink-0 text-[#176F59]" />
                        {locationMap.get(report.location_id) ??
                          "Location unavailable"}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <CalendarDays size={14} className="shrink-0 text-[#176F59]" />
                        {new Date(report.created_at).toLocaleDateString(
                          "en-GB",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
