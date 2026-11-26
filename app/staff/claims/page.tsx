
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import {
  ArrowLeft,
  ShieldCheck,
  ClipboardList,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  Package,
  UserRound,
  CalendarDays,
  FileText,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { reviewClaim, verifyHandover } from "./actions";

type ClaimStatus =
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "disputed"
  | "resolved"
  | "withdrawn";

type ReviewOption = {
  label: string;
  status: "under_review" | "approved" | "rejected" | "disputed";
};

function formatDate(date: string | null) {
  if (!date) return "Not available";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusStyle(status: ClaimStatus) {
  switch (status) {
    case "submitted":
      return "bg-amber-50 text-amber-700";
    case "under_review":
      return "bg-blue-50 text-blue-700";
    case "approved":
      return "bg-emerald-50 text-emerald-700";
    case "rejected":
      return "bg-red-50 text-red-700";
    case "disputed":
      return "bg-orange-50 text-orange-700";
    case "resolved":
      return "bg-violet-50 text-violet-700";
    case "withdrawn":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function getReviewOptions(status: ClaimStatus): ReviewOption[] {
  if (status === "submitted") {
    return [
      { label: "Start review", status: "under_review" },
      { label: "Mark disputed", status: "disputed" },
    ];
  }

  if (status === "under_review") {
    return [
      { label: "Approve", status: "approved" },
      { label: "Reject", status: "rejected" },
      { label: "Mark disputed", status: "disputed" },
    ];
  }

  if (status === "disputed") {
    return [
      { label: "Return to review", status: "under_review" },
      { label: "Approve", status: "approved" },
      { label: "Reject", status: "rejected" },
    ];
  }

  return [];
}

export default function StaffClaimsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F4F8F6] px-5 py-16">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-xl border border-[#E1EAE5] bg-white p-8 text-sm text-slate-500">
              Loading staff workspace...
            </div>
          </div>
        </main>
      }
    >
      <StaffClaimsContent />
    </Suspense>
  );
}

async function StaffClaimsContent() {
  await connection();

  const supabase = await createClient();

  // 1. Authenticate user.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // 2. Verify staff role on the server.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (
    profileError ||
    !profile ||
    !["security", "admin"].includes(profile.role)
  ) {
    redirect("/dashboard");
  }

  // 3. Fetch claims.
  const { data: claims, error: claimsError } = await supabase
    .from("claims")
    .select(
      "id, report_id, claimant_id, details, status, created_at, reviewed_at"
    )
    .order("created_at", { ascending: false });

  const claimRows = claims ?? [];
  const claimIds = claimRows.map((claim) => claim.id);

  // 4. Fetch handovers associated with claims.
  const { data: handovers, error: handoversError } = claimIds.length
    ? await supabase
        .from("handovers")
        .select("id, claim_id, status, verified_at, created_at")
        .in("claim_id", claimIds)
    : { data: [], error: null };

  const handoverMap = new Map(
    (handovers ?? []).map((handover) => [handover.claim_id, handover])
  );

  // 5. Fetch associated reports and claimant profiles.
  const reportIds = [...new Set(claimRows.map((claim) => claim.report_id))];

  const claimantIds = [
    ...new Set(claimRows.map((claim) => claim.claimant_id)),
  ];

  const [reportsResult, claimantsResult] = await Promise.all([
    reportIds.length
      ? supabase
          .from("item_reports")
          .select("id, title, report_type, status, reporter_id")
          .in("id", reportIds)
      : Promise.resolve({ data: [], error: null }),

    claimantIds.length
      ? supabase
          .from("profiles")
          .select("id, full_name, email, student_id")
          .in("id", claimantIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const reports = reportsResult.data ?? [];
  const claimants = claimantsResult.data ?? [];

  const reportMap = new Map(
    reports.map((report) => [report.id, report])
  );

  const claimantMap = new Map(
    claimants.map((claimant) => [claimant.id, claimant])
  );

  // 6. Statistics.
  const pendingCount = claimRows.filter(
    (claim) => claim.status === "submitted"
  ).length;

  const reviewingCount = claimRows.filter(
    (claim) => claim.status === "under_review"
  ).length;

  const disputedCount = claimRows.filter(
    (claim) => claim.status === "disputed"
  ).length;

  const resolvedCount = claimRows.filter(
    (claim) => claim.status === "resolved"
  ).length;

  const hasRelatedDataError =
    Boolean(reportsResult.error) ||
    Boolean(claimantsResult.error) ||
    Boolean(handoversError);

  return (
    <main className="min-h-screen bg-[#F4F8F6]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#E2ECE7] bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-medium text-[#176F59] transition hover:text-[#0F3A2F]"
          >
            <ArrowLeft size={18} />
            Back to dashboard
          </Link>

          <div className="flex items-center gap-2 rounded-full bg-[#E9F4EF] px-3 py-2 text-xs font-semibold text-[#176F59]">
            <ShieldCheck size={15} />
            {profile.role === "admin" ? "Administrator" : "Campus Security"}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10">
        {/* Heading */}
        <section className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#E6F3ED] px-3 py-1.5 text-xs font-semibold text-[#176F59]">
            <ShieldCheck size={14} />
            STAFF WORKSPACE
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#0F3A2F]">
            Claims Management
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Review ownership claims and manage disputed item recoveries.
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Signed in as {profile.full_name}
          </p>
        </section>

        {/* Statistics */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total claims",
              value: claimRows.length,
              icon: ClipboardList,
            },
            {
              label: "Pending",
              value: pendingCount,
              icon: Clock3,
            },
            {
              label: "Under review",
              value: reviewingCount,
              icon: FileText,
            },
            {
              label: "Disputed",
              value: disputedCount,
              icon: AlertTriangle,
            },
          ].map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-xl border border-[#E1EAE5] bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">{stat.label}</p>

                  <div className="rounded-lg bg-[#E9F4EF] p-2 text-[#176F59]">
                    <Icon size={19} />
                  </div>
                </div>

                <p className="mt-4 text-3xl font-bold text-[#173D32]">
                  {stat.value}
                </p>
              </div>
            );
          })}
        </section>

        {/* Resolved summary */}
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 size={17} />
          {resolvedCount} {resolvedCount === 1 ? "dispute" : "disputes"} resolved
        </div>

        {/* Errors */}
        {claimsError || hasRelatedDataError ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            We couldn't load all claim information.

            <p className="mt-1 break-words text-xs">
              {claimsError?.message ||
                reportsResult.error?.message ||
                claimantsResult.error?.message ||
                handoversError?.message ||
                "An unknown database error occurred."}
            </p>
          </div>
        ) : null}

        {/* Claims */}
        <section>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[#0F3A2F]">
                Submitted claims
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review claim details and update their status.
              </p>
            </div>

            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-500">
              {claimRows.length} records
            </span>
          </div>

          {claimRows.length === 0 ? (
            <div className="rounded-2xl border border-[#E1EAE5] bg-white px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E9F4EF] text-[#176F59]">
                <ClipboardList size={27} />
              </div>

              <h3 className="font-semibold text-[#0F3A2F]">
                No claims submitted yet
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                New ownership claims will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {claimRows.map((claim) => {
                const report = reportMap.get(claim.report_id);
                const claimant = claimantMap.get(claim.claimant_id);

                const status = claim.status as ClaimStatus;
                const options = getReviewOptions(status);
                const handover = handoverMap.get(claim.id);

                return (
                  <article
                    key={claim.id}
                    className="overflow-hidden rounded-2xl border border-[#E1EAE5] bg-white shadow-sm"
                  >
                    {/* Claim header */}
                    <div className="flex flex-col gap-4 border-b border-[#EAF0EC] p-5 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-[#E9F4EF] p-3 text-[#176F59]">
                          <Package size={21} />
                        </div>

                        <div>
                          <h3 className="font-semibold text-[#0F3A2F]">
                            {report?.title ?? "Report unavailable"}
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            {report?.report_type
                              ? `${report.report_type.toUpperCase()} ITEM`
                              : "ITEM REPORT"}
                            {" · "}
                            Claim submitted {formatDate(claim.created_at)}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${statusStyle(status)}`}
                      >
                        {status.replaceAll("_", " ")}
                      </span>
                    </div>

                    {/* Claim information */}
                    <div className="grid gap-6 p-5 lg:grid-cols-2">
                      <div>
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#173D32]">
                          <UserRound
                            size={17}
                            className="text-[#176F59]"
                          />
                          Claimant information
                        </div>

                        <div className="space-y-2 rounded-xl bg-[#F7FAF8] p-4 text-sm">
                          <p className="font-semibold text-[#173D32]">
                            {claimant?.full_name ?? "Profile unavailable"}
                          </p>

                          <p className="break-all text-slate-500">
                            {claimant?.email ?? "Email unavailable"}
                          </p>

                          <p className="text-slate-500">
                            Student ID: {claimant?.student_id ?? "Unavailable"}
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#173D32]">
                          <FileText
                            size={17}
                            className="text-[#176F59]"
                          />
                          Ownership explanation
                        </div>

                        <div className="min-h-24 rounded-xl bg-[#F7FAF8] p-4 text-sm leading-6 text-slate-600">
                          {claim.details}
                        </div>
                      </div>
                    </div>

                    {/* Handover information and verification */}
                    {handover && (
                      <div className="mx-5 mb-5 rounded-xl border border-[#E1EAE5] bg-[#F7FAF8] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[#173D32]">
                              Item handover
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {handover.status === "pending"
                                ? "Waiting for physical handover verification."
                                : handover.status === "verified"
                                  ? "Item recovery has been verified."
                                  : "Handover cancelled."}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                              handover.status === "verified"
                                ? "bg-emerald-50 text-emerald-700"
                                : handover.status === "pending"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {handover.status}
                          </span>
                        </div>

                        {handover.verified_at && (
                          <p className="mt-2 text-xs text-slate-500">
                            Verified on {formatDate(handover.verified_at)}
                          </p>
                        )}

                        {/* Staff verification form */}
                        {handover.status === "pending" &&
                          status === "approved" && (
                            <div className="mt-4 border-t border-[#E1EAE5] pt-4">
                              <h4 className="text-sm font-semibold text-[#173D32]">
                                Verify physical handover
                              </h4>

                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                Confirm that the item has physically been
                                returned to its rightful owner before
                                completing this action.
                              </p>

                              <form
                                action={verifyHandover}
                                className="mt-3 space-y-3"
                              >
                                <input
                                  type="hidden"
                                  name="handoverId"
                                  value={handover.id}
                                />

                                <div>
                                  <label
                                    htmlFor={`handover-notes-${handover.id}`}
                                    className="mb-1.5 block text-xs font-medium text-slate-600"
                                  >
                                    Verification notes (optional)
                                  </label>

                                  <textarea
                                    id={`handover-notes-${handover.id}`}
                                    name="notes"
                                    rows={2}
                                    maxLength={1000}
                                    placeholder="Add any relevant handover details..."
                                    className="w-full resize-y rounded-lg border border-[#DCE8E1] bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#176F59] focus:ring-2 focus:ring-[#176F59]/10"
                                  />
                                </div>

                                <button
                                  type="submit"
                                  className="inline-flex items-center gap-2 rounded-lg bg-[#176F59] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#0F3A2F]"
                                >
                                  <CheckCircle2 size={16} />
                                  Verify handover
                                </button>
                              </form>
                            </div>
                          )}
                      </div>
                    )}

                    {/* Review footer */}
                    <div className="flex flex-col gap-4 border-t border-[#EAF0EC] bg-[#FBFDFC] p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <CalendarDays size={15} />

                        {claim.reviewed_at
                          ? `Last reviewed ${formatDate(claim.reviewed_at)}`
                          : "Awaiting review"}
                      </div>

                      {options.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {options.map((option) => (
                            <form
                              key={option.status}
                              action={reviewClaim}
                            >
                              <input
                                type="hidden"
                                name="claimId"
                                value={claim.id}
                              />

                              <input
                                type="hidden"
                                name="newStatus"
                                value={option.status}
                              />

                              <button
                                type="submit"
                                className={`rounded-lg px-4 py-2.5 text-xs font-semibold transition ${
                                  option.status === "rejected"
                                    ? "border border-red-200 bg-white text-red-600 hover:bg-red-50"
                                    : option.status === "disputed"
                                      ? "border border-orange-200 bg-white text-orange-700 hover:bg-orange-50"
                                      : option.status === "under_review"
                                        ? "border border-blue-200 bg-white text-blue-700 hover:bg-blue-50"
                                        : "bg-[#176F59] text-white hover:bg-[#0F3A2F]"
                                }`}
                              >
                                {option.label}
                              </button>
                            </form>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-slate-400">
                          No further review actions
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="mt-10 pb-4 text-center text-xs text-slate-400">
          © 2026 CampusRecover · Staff Management
        </footer>
      </div>
    </main>
  );
}
