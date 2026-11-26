
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import {
  ArrowLeft,
  UserRound,
  Mail,
  GraduationCap,
  ShieldCheck,
  CalendarDays,
  Pencil,
  Save,
  IdCard,
  Building2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "./actions";

type ProfilePageProps = {
  searchParams: Promise<{
    updated?: string;
    error?: string;
  }>;
};

function formatDate(date: string | null) {
  if (!date) return "Not available";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export default function ProfilePage(props: ProfilePageProps) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F4F8F6] px-5 py-16">
          <div className="mx-auto max-w-5xl rounded-xl border border-[#E1EAE5] bg-white p-8 text-sm text-slate-500">
            Loading your profile...
          </div>
        </main>
      }
    >
      <ProfileContent searchParams={props.searchParams} />
    </Suspense>
  );
}

async function ProfileContent({
  searchParams,
}: ProfilePageProps) {
  await connection();

  const params = await searchParams;
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
    .select(
      "id, email, full_name, student_id, department, batch, avatar_url, role, created_at"
    )
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return (
      <main className="min-h-screen bg-[#F4F8F6] px-5 py-16">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-8">
          <h1 className="font-semibold text-red-700">
            Unable to load your profile
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Please refresh the page or contact the administrator.
          </p>
          <Link
            href="/dashboard"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#176F59]"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  const initials = getInitials(profile.full_name || "DIU");
  const roleLabel =
    profile.role === "admin"
      ? "Administrator"
      : profile.role === "security"
        ? "Campus Security"
        : "Student";

  return (
    <main className="min-h-screen bg-[#F4F8F6]">
      <header className="sticky top-0 z-30 border-b border-[#E2ECE7] bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
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

      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#E6F3ED] px-3 py-1.5 text-xs font-semibold text-[#176F59]">
            <UserRound size={14} />
            ACCOUNT
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#0F3A2F]">
            My Profile
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Manage your personal information and view your DIU account identity.
          </p>
        </div>

        {params.updated === "1" && (
          <div
            role="status"
            className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            <CheckCircle2 size={19} />
            Your profile has been updated successfully.
          </div>
        )}

        {params.error && (
          <div
            role="alert"
            className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <AlertCircle size={19} />
            {params.error}
          </div>
        )}

        {/* Profile identity card */}
        <section className="mb-6 overflow-hidden rounded-2xl border border-[#E0EAE5] bg-white shadow-sm">
          <div className="bg-[#0F3A2F] px-6 py-8 text-white sm:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="h-20 w-20 rounded-full border-4 border-white/20 object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#D7EDE3] text-2xl font-bold text-[#176F59]">
                  {initials}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-bold">
                    {profile.full_name}
                  </h2>

                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-100">
                    <ShieldCheck size={13} />
                    Verified DIU Member
                  </span>
                </div>

                <p className="mt-2 text-sm text-white/75">
                  {roleLabel} · {profile.student_id}
                </p>

                <p className="mt-1 break-all text-sm text-white/65">
                  {profile.email}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-3 sm:px-8">
            <div>
              <p className="text-xs text-slate-400">Account role</p>
              <p className="mt-1 text-sm font-semibold capitalize text-[#173D32]">
                {roleLabel}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Department</p>
              <p className="mt-1 text-sm font-semibold text-[#173D32]">
                {profile.department || "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Batch</p>
              <p className="mt-1 text-sm font-semibold text-[#173D32]">
                {profile.batch || "Not provided"}
              </p>
            </div>
          </div>
        </section>

        {/* Editable profile form */}
        <section className="rounded-2xl border border-[#E0EAE5] bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-[#0F3A2F]">
                Personal information
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Update your name and academic information.
              </p>
            </div>

            <div className="rounded-xl bg-[#E6F3ED] p-3 text-[#176F59]">
              <Pencil size={20} />
            </div>
          </div>

          <form action={updateProfile} className="space-y-5">
            <div>
              <label
                htmlFor="full_name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Full name
              </label>

              <div className="relative">
                <UserRound
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  defaultValue={profile.full_name}
                  minLength={2}
                  maxLength={100}
                  required
                  className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#176F59] focus:ring-2 focus:ring-[#176F59]/10"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="department"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Department
                </label>

                <div className="relative">
                  <Building2
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="department"
                    name="department"
                    type="text"
                    defaultValue={profile.department ?? ""}
                    maxLength={100}
                    placeholder="e.g. Computer Science & Engineering"
                    className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#176F59] focus:ring-2 focus:ring-[#176F59]/10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="batch"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Batch
                </label>

                <div className="relative">
                  <GraduationCap
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="batch"
                    name="batch"
                    type="text"
                    defaultValue={profile.batch ?? ""}
                    maxLength={50}
                    placeholder="e.g.  D-75"
                    className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#176F59] focus:ring-2 focus:ring-[#176F59]/10"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h3 className="mb-4 text-sm font-semibold text-[#173D32]">
                University identity
              </h3>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    DIU email
                  </label>

                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <Mail size={17} className="shrink-0 text-slate-400" />
                    <span className="min-w-0 break-all text-sm text-slate-500">
                      {profile.email}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Email cannot be changed here.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Student ID
                  </label>

                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <IdCard size={17} className="shrink-0 text-slate-400" />
                    <span className="text-sm text-slate-500">
                      {profile.student_id}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Student ID cannot be changed here.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-6 sm:flex-row">
              <Link
                href="/dashboard"
                className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#176F59] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#0F3A2F]"
              >
                <Save size={17} />
                Save changes
              </button>
            </div>
          </form>
        </section>

        {/* Account information */}
        <section className="mt-6 rounded-2xl border border-[#E0EAE5] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <CalendarDays size={19} className="text-[#176F59]" />
            <h2 className="font-semibold text-[#0F3A2F]">
              Account information
            </h2>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-500">
              Member since
            </p>
            <p className="text-sm font-medium text-[#173D32]">
              {formatDate(profile.created_at)}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
