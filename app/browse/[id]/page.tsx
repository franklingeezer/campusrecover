
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  CalendarDays,
  PackageOpen,
  Clock3,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import ClaimForm from "./claim-form";
import { Suspense } from "react";
import { connection } from "next/server";

type Props = {
  params: Promise<{ id: string }>;
};

export default function ItemDetailsPage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F4F8F6] flex items-center justify-center">
          <p className="text-sm text-slate-500">
            Loading item details...
          </p>
        </main>
      }
    >
      <ItemDetailsContent params={params} />
    </Suspense>
  );
}

async function ItemDetailsContent({ params }: Props) {
  await connection();

  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: report, error } = await supabase
    .from("item_reports")
    .select(
      "id, reporter_id, title, description, report_type, status, category_id, location_id, image_path, incident_at, created_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Item details error:", error.message);
  }

  if (!report) {
    notFound();
  }

  const [categoryResult, locationResult] = await Promise.all([
    supabase
      .from("categories")
      .select("name")
      .eq("id", report.category_id)
      .maybeSingle(),

    supabase
      .from("locations")
      .select("name, building")
      .eq("id", report.location_id)
      .maybeSingle(),
  ]);

  const category = categoryResult.data?.name ?? "Uncategorized";

  const location = locationResult.data
    ? `${locationResult.data.name}${
        locationResult.data.building
          ? ` — ${locationResult.data.building}`
          : ""
      }`
    : "Location unavailable";

  const imageUrl = report.image_path
    ? supabase.storage
        .from("item-images")
        .getPublicUrl(report.image_path).data.publicUrl
    : null;

  const isFound = report.report_type === "found";
  const isOpen = report.status === "open";
  const isOwner = report.reporter_id === user.id;

  const canClaim = isFound && isOpen && !isOwner;

  return (
    <main className="min-h-screen bg-[#F4F8F6]">
      <header className="border-b border-[#E2ECE7] bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link
            href="/browse"
            className="flex items-center gap-2 text-sm font-medium text-[#176F59] hover:text-[#0F3A2F]"
          >
            <ArrowLeft size={18} />
            Back to browse
          </Link>

          <span className="font-semibold tracking-tight text-[#0F3A2F]">
            CampusRecover
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="grid gap-7 lg:grid-cols-2">
          {/* Item photograph */}
          <section className="overflow-hidden rounded-2xl border border-[#E0EAE5] bg-white shadow-sm">
            <div className="flex min-h-80 items-center justify-center bg-[#F0F5F2]">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={report.title}
                  className="h-full max-h-[520px] w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <PackageOpen size={48} />
                  <span className="text-sm">
                    No photograph available
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Item information */}
          <section className="rounded-2xl border border-[#E0EAE5] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  isFound
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {isFound ? "Found item" : "Lost item"}
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-600">
                {String(report.status).replaceAll("_", " ")}
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[#0F3A2F]">
              {report.title}
            </h1>

            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {report.description}
            </p>

            <div className="mt-6 space-y-4 border-t border-slate-100 pt-5">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <PackageOpen size={17} className="text-[#176F59]" />
                {category}
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-600">
                <MapPin size={17} className="text-[#176F59]" />
                {location}
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-600">
                <CalendarDays size={17} className="text-[#176F59]" />
                Reported{" "}
                {new Date(report.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>

              {report.incident_at && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Clock3 size={17} className="text-[#176F59]" />
                  Incident{" "}
                  {new Date(report.incident_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Claim section */}
        {canClaim && (
          <section className="mt-7 rounded-2xl border border-[#DCEAE3] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0F3A2F]">
              Is this your item?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Submit a claim and provide details that can help verify
              your ownership. CampusRecover staff may review your claim.
            </p>

            <ClaimForm reportId={report.id} />
          </section>
        )}

        {isOwner && (
          <div className="mt-7 rounded-xl border border-[#DCEAE3] bg-white p-5 text-sm text-slate-600">
            This is your report. You cannot submit a claim on your own item.
          </div>
        )}

        {!isOwner && isFound && !isOpen && (
          <div className="mt-7 rounded-xl border border-[#DCEAE3] bg-white p-5 text-sm text-slate-600">
            This item is no longer accepting claims.
          </div>
        )}

        {!isFound && (
          <div className="mt-7 rounded-xl border border-[#DCEAE3] bg-white p-5 text-sm text-slate-600">
            Claims are available for found-item reports only.
          </div>
        )}
      </div>
    </main>
  );
}
