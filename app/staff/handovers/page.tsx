
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
  XCircle,
  Package,
  UserRound,
  CalendarDays,
  FileText,
  ArrowRight,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { verifyHandover } from "../claims/actions";

type HandoverStatus = "pending" | "verified" | "cancelled";

function formatDate(date: string | null) {
  if (!date) return "Not available";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date: string | null) {
  if (!date) return "Not available";

  return new Date(date).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function handoverStatusStyle(status: HandoverStatus) {
  switch (status) {
    case "pending":
      return "bg-amber-50 text-amber-700";
    case "verified":
      return "bg-emerald-50 text-emerald-700";
    case "cancelled":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function StaffHandoversPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F4F8F6] px-5 py-16">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-xl border border-[#E1EAE5] bg-white p-8 text-sm text-slate-500">
              Loading handover workspace...
            </div>
          </div>
        </main>
      }
    >
      <StaffHandoversContent />
    </Suspense>
  );
}

async function StaffHandoversContent() {
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

  // 2. Verify staff role.
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

  // 3. Fetch handovers.
  const { data: handovers, error: handoversError } = await supabase
    .from("handovers")
    .select(
      "id, claim_id, report_id, claimant_id, reporter_id, status, verified_by, verified_at, notes, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  const handoverRows = handovers ?? [];

  // 4. Collect related IDs.
  const claimIds = [...new Set(handoverRows.map((item) => item.claim_id))];
  const reportIds = [...new Set(handoverRows.map((item) => item.report_id))];

  const profileIds = [
    ...new Set(
      handoverRows.flatMap((item) => [
        item.claimant_id,
        item.reporter_id,
        ...(item.verified_by ? [item.verified_by] : []),
      ])
    ),
  ];

  // 5. Fetch related records.
  const [claimsResult, reportsResult, profilesResult] = await Promise.all([
    claimIds.length
      ? supabase
          .from("claims")
          .select("id, details, status, created_at")
          .in("id", claimIds)
      : Promise.resolve({ data: [], error: null }),

    reportIds.length
      ? supabase
          .from("item_reports")
          .select("id, title, report_type, status")
          .in("id", reportIds)
      : Promise.resolve({ data: [], error: null }),

    profileIds.length
      ? supabase
          .from("profiles")
          .select("id, full_name, email, student_id")
          .in("id", profileIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const claims = claimsResult.data ?? [];
  const reports = reportsResult.data ?? [];
  const profiles = profilesResult.data ?? [];

  const claimMap = new Map(
    claims.map((claim) => [claim.id, claim])
  );

  const reportMap = new Map(
    reports.map((report) => [report.id, report])
  );

  const profileMap = new Map(
    profiles.map((person) => [person.id, person])
  );

  // 6. Statistics.
  const pendingCount = handoverRows.filter(
    (item) => item.status === "pending"
  ).length;

  const verifiedCount = handoverRows.filter(
    (item) => item.status === "verified"
  ).length;

  const cancelledCount = handoverRows.filter(
    (item) => item.status === "cancelled"
  ).length;

  const hasRelatedDataError =
    Boolean(claimsResult.error) ||
    Boolean(reportsResult.error) ||
    Boolean(profilesResult.error);

  const loadError =
    handoversError?.message ||
    claimsResult.error?.message ||
    reportsResult.error?.message ||
    profilesResult.error?.message;

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
            Handover Management
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Monitor approved ownership claims, verify physical item returns,
            and review completed handover records.
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Signed in as {profile.full_name}
          </p>
        </section>

        {/* Quick navigation */}
        <div className="mb-8 flex flex-wrap gap-3">
          <Link
            href="/staff/claims"
            className="inline-flex items-center gap-2 rounded-lg border border-[#DCE8E1] bg-white px-4 py-2.5 text-sm font-medium text-[#176F59] transition hover:bg-[#E9F4EF]"
          >
            <ClipboardList size={17} />
            Claims Management
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Statistics */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total handovers",
              value: handoverRows.length,
              icon: ClipboardList,
            },
            {
              label: "Pending verification",
              value: pendingCount,
              icon: Clock3,
            },
            {
              label: "Verified",
              value: verifiedCount,
              icon: CheckCircle2,
            },
            {
              label: "Cancelled",
              value: cancelledCount,
              icon: XCircle,
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

        {/* Errors */}
        {(handoversError || hasRelatedDataError) && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            We couldn't load all handover information.

            <p className="mt-1 break-words text-xs">
              {loadError || "An unknown database error occurred."}
            </p>
          </div>
        )}

        {/* Handover records */}
        <section>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[#0F3A2F]">
                Handover records
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review pending and completed physical item recoveries.
              </p>
            </div>

            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-500">
              {handoverRows.length} records
            </span>
          </div>

          {handoverRows.length === 0 ? (
            <div className="rounded-2xl border border-[#E1EAE5] bg-white px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E9F4EF] text-[#176F59]">
                <Package size={27} />
              </div>

              <h3 className="font-semibold text-[#0F3A2F]">
                No handovers yet
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Approved ownership claims will create handover records here.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {handoverRows.map((handover) => {
                const report = reportMap.get(handover.report_id);
                const claim = claimMap.get(handover.claim_id);
                const claimant = profileMap.get(handover.claimant_id);
                const reporter = profileMap.get(handover.reporter_id);
                const verifier = handover.verified_by
                  ? profileMap.get(handover.verified_by)
                  : null;

                const status = handover.status as HandoverStatus;

                return (
                  <article
                    key={handover.id}
                    className="overflow-hidden rounded-2xl border border-[#E1EAE5] bg-white shadow-sm"
                  >
                    {/* Record header */}
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
                            Created {formatDate(handover.created_at)}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${handoverStatusStyle(status)}`}
                      >
                        {status}
                      </span>
                    </div>

                    {/* Participants */}
                    <div className="grid gap-5 p-5 lg:grid-cols-2">
                      <div>
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#173D32]">
                          <UserRound size={17} className="text-[#176F59]" />
                          Claimant / Item owner
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
                          <Package size={17} className="text-[#176F59]" />
                          Item reporter / Finder
                        </div>

                        <div className="space-y-2 rounded-xl bg-[#F7FAF8] p-4 text-sm">
                          <p className="font-semibold text-[#173D32]">
                            {reporter?.full_name ?? "Profile unavailable"}
                          </p>

                          <p className="break-all text-slate-500">
                            {reporter?.email ?? "Email unavailable"}
                          </p>

                          <p className="text-slate-500">
                            Student ID: {reporter?.student_id ?? "Unavailable"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Claim information */}
                    <div className="mx-5 mb-5 rounded-xl border border-[#E1EAE5] bg-[#F7FAF8] p-4">
                      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#173D32]">
                        <FileText size={17} className="text-[#176F59]" />
                        Ownership claim
                      </div>

                      <p className="text-sm leading-6 text-slate-600">
                        {claim?.details ?? "Claim details unavailable."}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                        <span>
                          Claim status: {claim?.status ?? "Unavailable"}
                        </span>
                        <span>
                          Item status: {report?.status ?? "Unavailable"}
                        </span>
                      </div>
                    </div>

                    {/* Verification details */}
                    <div className="mx-5 mb-5 rounded-xl border border-[#E1EAE5] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-semibold text-[#173D32]">
                            Verification details
                          </h4>

                          <p className="mt-1 text-xs text-slate-500">
                            {status === "pending"
                              ? "Physical return is awaiting staff verification."
                              : status === "verified"
                                ? "The physical handover has been completed."
                                : "This handover has been cancelled."}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${handoverStatusStyle(status)}`}
                        >
                          {status}
                        </span>
                      </div>

                      {handover.verified_at && (
                        <div className="mt-4 grid gap-3 border-t border-[#EAF0EC] pt-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xs text-slate-400">
                              Verified date
                            </p>
                            <p className="mt-1 text-sm font-medium text-[#173D32]">
                              {formatDateTime(handover.verified_at)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-400">
                              Verified by
                            </p>
                            <p className="mt-1 text-sm font-medium text-[#173D32]">
                              {verifier?.full_name ?? "Staff member"}
                            </p>
                          </div>
                        </div>
                      )}

                      {handover.notes && (
                        <div className="mt-4 rounded-lg bg-[#F7FAF8] p-3">
                          <p className="text-xs font-semibold text-[#173D32]">
                            Verification notes
                          </p>

                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            {handover.notes}
                          </p>
                        </div>
                      )}

                      {/* Verify pending handover */}
                      {status === "pending" && claim?.status === "approved" && (
                        <div className="mt-4 border-t border-[#EAF0EC] pt-4">
                          <h4 className="text-sm font-semibold text-[#173D32]">
                            Complete physical handover
                          </h4>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            Confirm that the item has physically been returned
                            to the rightful owner before completing this action.
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
                                placeholder="Add physical handover details..."
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

                      {status === "verified" && (
                        <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
                          <CheckCircle2 size={17} />
                          Recovery successfully completed.
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EAF0EC] bg-[#FBFDFC] px-5 py-4">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <CalendarDays size={15} />
                        Created {formatDate(handover.created_at)}
                      </div>

                      <Link
                        href="/staff/claims"
                        className="inline-flex items-center gap-2 text-xs font-semibold text-[#176F59] transition hover:text-[#0F3A2F]"
                      >
                        View claims
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="mt-10 pb-4 text-center text-xs text-slate-400">
          © 2026 CampusRecover · Handover Management
        </footer>
      </div>
    </main>
  );
}
