
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  PackageOpen,
  ShieldCheck,
  FileText,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";


const statusStyles: Record<string, string> = {
  submitted: "bg-blue-50 text-blue-700",
  under_review: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  disputed: "bg-orange-50 text-orange-700",
  resolved: "bg-green-50 text-green-700",
  withdrawn: "bg-slate-100 text-slate-600",
};

const statusDescriptions: Record<string, string> = {
  submitted: "Your claim has been received and is awaiting review.",
  under_review: "Your claim is currently being reviewed by the team.",
  approved: "Your claim has been approved.",
  rejected: "Your claim was not approved.",
  disputed: "Your claim requires further verification.",
  resolved: "This claim has been marked as resolved.",
  withdrawn: "This claim has been withdrawn.",
};

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MyClaimsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#F4F8F6]">
          <p className="text-sm text-slate-500">
            Loading your claims...
          </p>
        </main>
      }
    >
      <MyClaimsContent />
    </Suspense>
  );
}

async function MyClaimsContent() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  

  if (authError || !user) {
    redirect("/login");
  }
  console.log("My Claims - Logged in user:", user.id);

  const { data: claims, error } = await supabase
    .from("claims")
    .select(`
      id,
      report_id,
      details,
      status,
      created_at,
      reviewed_at,
      report:item_reports!claims_report_id_fkey (
        id,
        title,
        report_type,
        image_path
      )
    `)
    .eq("claimant_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("My claims loading error:", error.message);
  }

  return (
    <main className="min-h-screen bg-[#F4F8F6]">
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
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#E6F3ED] px-3 py-1.5 text-xs font-semibold text-[#176F59]">
            <ShieldCheck size={14} />
            YOUR ACTIVITY
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#0F3A2F]">
            My claims
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Track the claims you have submitted and stay updated on their progress.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            We couldn't load your claims right now. Please refresh the page and try again.
          </div>
        ) : !claims || claims.length === 0 ? (
          <div className="rounded-2xl border border-[#E0EAE5] bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E6F3ED]">
              <FileText size={26} className="text-[#176F59]" />
            </div>

            <h2 className="font-semibold text-[#0F3A2F]">
              No claims submitted yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              When you submit a claim for a found item, it will appear here.
            </p>

            <Link
              href="/browse"
              className="mt-6 inline-flex rounded-xl bg-[#176F59] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0F3A2F]"
            >
              Browse found items
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-sm text-slate-500">
                {claims.length} {claims.length === 1 ? "claim" : "claims"} submitted
              </p>
            </div>

            <div className="space-y-5">
              {claims.map((claim) => {
                const report = Array.isArray(claim.report)
                  ? claim.report[0]
                  : claim.report;

                const imageUrl = report?.image_path
                  ? supabase.storage
                      .from("item-images")
                      .getPublicUrl(report.image_path).data.publicUrl
                  : null;

                const status = String(claim.status);
                const statusClass =
                  statusStyles[status] ?? "bg-slate-100 text-slate-600";

                return (
                  <article
                    key={claim.id}
                    className="overflow-hidden rounded-2xl border border-[#E0EAE5] bg-white shadow-sm"
                  >
                    <div className="grid md:grid-cols-[220px_1fr]">
                      <div className="flex min-h-48 items-center justify-center bg-[#F0F5F2]">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={report?.title ?? "Claimed item"}
                            className="h-full min-h-48 w-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <PackageOpen size={34} />
                            <span className="text-xs">
                              No photograph available
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-5 md:p-6">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass}`}
                          >
                            {formatStatus(status)}
                          </span>

                          <span className="text-xs text-slate-400">
                            Claim #{claim.id.slice(0, 8)}
                          </span>
                        </div>

                        <h2 className="text-lg font-semibold text-[#0F3A2F]">
                          {report?.title ?? "Item report unavailable"}
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {statusDescriptions[status] ??
                            "Your claim status is being updated."}
                        </p>

                        <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <CalendarDays
                              size={15}
                              className="text-[#176F59]"
                            />
                            Submitted {formatDate(claim.created_at)}
                          </div>

                          {claim.reviewed_at && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Clock3
                                size={15}
                                className="text-[#176F59]"
                              />
                              Reviewed {formatDate(claim.reviewed_at)}
                            </div>
                          )}
                        </div>

                        <div className="mt-4 rounded-xl bg-[#F4F8F6] p-4">
                          <p className="mb-1 text-xs font-semibold text-[#176F59]">
                            Your explanation
                          </p>
                          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                            {claim.details}
                          </p>
                        </div>

                        {report?.id && (
                          <Link
                            href={`/browse/${report.id}`}
                            className="mt-4 inline-flex text-sm font-semibold text-[#176F59] transition hover:text-[#0F3A2F]"
                          >
                            View item details →
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
