
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  Search,
  LayoutDashboard,
  PlusCircle,
  Package,
  Handshake,
  Bell,
  UserRound,
  Settings,
  LogOut,
  Menu,
  X,
  ArrowUpRight,
  Clock3,
  ShieldCheck,
  ClipboardList,
  PackageCheck,
} from "lucide-react";

import { handleLogout } from "@/app/dashboard/actions";

type Profile = {
  full_name: string;
  student_id: string;
  email: string;
  department: string | null;
  role: string;
  avatar_url: string | null;
};

type DashboardStats = {
  lostItems: number;
  foundItems: number;
  activeReports: number;
  itemsReturned: number;
};

type RecentReport = {
  id: string;
  title: string;
  report_type: "lost" | "found";
  status: string;
  created_at: string;
  category_name: string;
  location_name: string;
};

type Props = {
  profile: Profile;
  stats: DashboardStats;
  recentReports: RecentReport[];
};

const navigation = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    active: true,
  },
  {
    label: "Browse items",
    icon: Search,
    href: "/browse",
  },
  {
    label: "Report an item",
    icon: PlusCircle,
    href: "/report",
  },
  {
    label: "My reports",
    icon: Package,
    href: "/my-reports",
  },
  {
    label: "My claims",
    icon: Handshake,
    href: "/my-claims",
  },
  {
    label: "Notifications",
    icon: Bell,
    href: "/notifications",
  },
];

const staffNavigation = [
  {
    label: "Claims Management",
    icon: ClipboardList,
    href: "/staff/claims",
  },
  {
    label: "Handover Management",
    icon: PackageCheck,
    href: "/staff/handovers",
  },
];

export default function DashboardShell({
  profile,
  stats,
  recentReports,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let isMounted = true;

    async function loadUnreadCount() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) return;

      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) {
        console.error("Unread notification count error:", error.message);
        return;
      }

      if (isMounted) {
        setUnreadCount(count ?? 0);
      }

      if (!channel && isMounted) {
        channel = supabase
          .channel(`sidebar-notifications-${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              void loadUnreadCount();
            }
          )
          .subscribe();
      }
    }

    void loadUnreadCount();

    return () => {
      isMounted = false;

      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, []);

  const isStaff = ["security", "admin"].includes(profile.role);

  const initials = profile.full_name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-5 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)] text-white">
            <Search size={20} />
          </div>
          <span className="text-lg font-bold">CampusRecover</span>
        </Link>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 hover:bg-[var(--background)]"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
        />
      )}

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-[var(--border)] bg-[var(--surface)] transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Brand */}
          <div className="flex h-[76px] items-center gap-3 border-b border-[var(--border)] px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-white">
              <Search size={23} />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight">
                CampusRecover
              </h1>
              <p className="text-xs text-[var(--muted)]">
                Your campus community
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-4 py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.13em] text-[var(--muted)]">
              Workspace
            </p>

            <nav className="space-y-1">
  {navigation.map((item) => {
    const Icon = item.icon;

    return (
      <Link
        key={item.label}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
          item.active
            ? "bg-[var(--sage)] text-[var(--primary)]"
            : "text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--primary)]"
        }`}
      >
        <Icon size={19} />
        {item.label}

              {item.label === "Notifications" && unreadCount > 0 && (
        <span className="ml-auto rounded-full bg-[var(--primary)] px-2 py-0.5 text-[10px] font-semibold text-white">
          {unreadCount}
        </span>
      )}
      </Link>
    );
  })}

  {/* Staff workspace navigation */}
  {isStaff && (
    <>
      <p className="mb-3 mt-8 px-3 text-[11px] font-semibold uppercase tracking-[0.13em] text-[var(--muted)]">
        Staff Workspace
      </p>

      {staffNavigation.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-[var(--primary)] transition hover:bg-[var(--sage)]"
          >
            <Icon size={19} />
            {item.label}
            <ArrowUpRight
              size={14}
              className="ml-auto text-[var(--muted)]"
            />
          </Link>
        );
      })}
    </>
  )}
</nav>

            <p className="mb-3 mt-9 px-3 text-[11px] font-semibold uppercase tracking-[0.13em] text-[var(--muted)]">
              Account
            </p>

            <Link
  href="/profile"
  onClick={() => setMobileOpen(false)}
  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-[var(--muted)] transition hover:bg-[var(--background)] hover:text-[var(--primary)]"
>
  <UserRound size={19} />
  My profile
  <ArrowUpRight size={14} className="ml-auto text-[var(--muted)]" />
</Link>

            <Link
  href="/settings"
  onClick={() => setMobileOpen(false)}
  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-[var(--muted)] transition hover:bg-[var(--background)] hover:text-[var(--primary)]"
>
  <Settings size={19} />
  Settings
  <ArrowUpRight size={14} className="ml-auto text-[var(--muted)]" />
</Link>
          </div>

          {/* Sidebar profile */}
          <div className="border-t border-[var(--border)] p-4">
            <div className="mb-4 flex items-center gap-3 rounded-lg bg-[var(--background)] p-3">
              {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name}
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--sage)] text-sm font-bold text-[var(--primary)]">
              {initials}
            </div>
          )}

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {profile.full_name}
                </p>
                <p className="truncate text-xs text-[var(--muted)]">
                  {profile.student_id}
                </p>
              </div>
            </div>

            <form action={handleLogout}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--muted)] transition hover:bg-red-50 hover:text-red-600"
              >
                <LogOut size={18} />
                Log out
              </button>
            </form>
          </div>
        </aside>

        {/* Main workspace */}
        <main className="min-w-0 flex-1">
          {/* Desktop topbar */}
          <header className="hidden h-[76px] items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-8 lg:flex">
            <div>
              <p className="text-sm text-[var(--muted)]">
                CampusRecover / Dashboard
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-full bg-[var(--sage)] px-3 py-2 text-xs font-medium text-[var(--primary)]">
                <ShieldCheck size={15} />
                Verified DIU member
              </div>

              {profile.avatar_url ? (
  <img
    src={profile.avatar_url}
    alt={profile.full_name}
    className="h-10 w-10 rounded-full object-cover"
  />
) : (
  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--sage)] text-sm font-bold text-[var(--primary)]">
    {initials}
  </div>
)}
            </div>
          </header>

          {/* Dashboard content */}
          <div className="mx-auto max-w-[1400px] space-y-8 p-5 sm:p-8 lg:p-10">
            {/* Welcome */}
            <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <p className="mb-2 text-sm font-medium text-[var(--primary)]">
                  YOUR CAMPUS COMMUNITY
                </p>

                <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
                  Welcome back, {profile.full_name.split(" ")[0]}!
                </h2>

                <p className="mt-2 text-sm text-[var(--muted)]">
                  Let's help lost belongings find their way home.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]">
                <Clock3 size={17} className="text-[var(--primary)]" />
                CampusRecover member
              </div>
            </section>

            {/* Statistics */}
            <section>
              <div className="mb-4">
                <h3 className="font-semibold text-[var(--foreground)]">
                  Overview
                </h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Your lost and found activity at a glance.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Lost items", icon: Search, value: stats.lostItems },
                  { label: "Found items", icon: Package, value: stats.foundItems },
                  { label: "Active reports", icon: Clock3, value: stats.activeReports },
                  { label: "Items returned", icon: Handshake, value: stats.itemsReturned },
                ].map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-[var(--primary)]"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-[var(--muted)]">
                          {stat.label}
                        </p>
                        <div className="rounded-lg bg-[var(--sage)] p-2 text-[var(--primary)]">
                          <Icon size={19} />
                        </div>
                      </div>

                      <p className="mt-5 text-3xl font-bold text-[var(--foreground)]">
                        {stat.value.toLocaleString()}
                      </p>

                      <p className="mt-1 text-xs text-[var(--muted)]">
                        Across CampusRecover
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Quick actions */}
            <section>
              <h3 className="mb-4 font-semibold text-[var(--foreground)]">
                Quick actions
              </h3>

              
<div className="grid gap-4 md:grid-cols-2">
  <Link
    href="/report?type=lost"
    className="group flex items-center justify-between rounded-xl bg-[var(--primary)] p-6 text-white transition hover:bg-[#0F3A2F]"
  >
    <div>
      <p className="text-lg font-semibold">
        Lost something?
      </p>
      <p className="mt-1 text-sm text-white/75">
        Report a missing belonging.
      </p>
    </div>

    <div className="rounded-lg bg-[var(--surface)]/15 p-3 transition group-hover:bg-[var(--surface)]/25">
      <Search size={25} />
    </div>
  </Link>

  <Link
    href="/report?type=found"
    className="group flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 transition hover:border-[var(--primary)] hover:bg-[var(--background)]"
  >
    <div>
      <p className="text-lg font-semibold text-[var(--foreground)]">
        Found something?
      </p>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Help another student recover it.
      </p>
    </div>

    <div className="rounded-lg bg-[var(--sage)] p-3 text-[var(--primary)]">
      <PlusCircle size={25} />
    </div>
  </Link>
</div>

            </section>

            {/* Staff workspace */}
{isStaff && (
  <section>
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--primary)]">
        Administration
      </p>

      <h3 className="mt-1 font-semibold text-[var(--foreground)]">
        Staff workspace
      </h3>

      <p className="mt-1 text-sm text-[var(--muted)]">
        Manage ownership claims and physical item recoveries.
      </p>
    </div>

    <div className="grid gap-4 md:grid-cols-2">
      <Link
        href="/staff/claims"
        className="group flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-[var(--primary)] hover:bg-[var(--background)]"
      >
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-[var(--sage)] p-3 text-[var(--primary)]">
            <ClipboardList size={22} />
          </div>

          <div>
            <h4 className="font-semibold text-[var(--foreground)]">
              Claims Management
            </h4>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Review and manage ownership claims.
            </p>
          </div>
        </div>

        <ArrowUpRight
          size={19}
          className="text-[var(--muted)] transition group-hover:text-[var(--primary)]"
        />
      </Link>

      <Link
        href="/staff/handovers"
        className="group flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-[var(--primary)] hover:bg-[var(--background)]"
      >
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-[var(--sage)] p-3 text-[var(--primary)]">
            <PackageCheck size={22} />
          </div>

          <div>
            <h4 className="font-semibold text-[var(--foreground)]">
              Handover Management
            </h4>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Verify physical item returns and recoveries.
            </p>
          </div>
        </div>

        <ArrowUpRight
          size={19}
          className="text-[var(--muted)] transition group-hover:text-[var(--primary)]"
        />
      </Link>
    </div>
  </section>
)}

            {/* Recent reports */}
            <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
                <div>
                  <h3 className="font-semibold text-[var(--foreground)]">
                    Recent reports
                  </h3>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Latest lost and found submissions.
                  </p>
                </div>

                <Link
  href="/my-reports"
  className="flex items-center gap-1 text-xs font-medium text-[var(--muted)] transition hover:text-[var(--primary)]"
>
  View all <ArrowUpRight size={14} />
</Link>
              </div>

              {recentReports.length === 0 ? (
                <div className="flex min-h-[210px] flex-col items-center justify-center px-6 py-10 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--sage)] text-[var(--primary)]">
                    <Package size={25} />
                  </div>

                  <h4 className="font-semibold text-[var(--foreground)]">
                    No reports to display yet
                  </h4>

                  <p className="mt-2 max-w-sm text-sm text-[var(--muted)]">
                    Once students start submitting lost and found reports,
                    they'll appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {recentReports.map((report) => (
                    <Link
                    key={report.id}
                    href={`/browse/${report.id}`}
                    className="flex flex-col gap-3 px-6 py-5 transition hover:bg-[var(--background)] sm:flex-row sm:items-center sm:justify-between"
                  >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="mt-1 rounded-lg bg-[var(--sage)] p-2 text-[var(--primary)]">
                          <Package size={19} />
                        </div>

                        <div className="min-w-0">
                          <h4 className="truncate text-sm font-semibold text-[var(--foreground)]">
                            {report.title}
                          </h4>

                          <p className="mt-1 text-xs text-[var(--muted)]">
                            {report.category_name} · {report.location_name}
                          </p>

                          <p className="mt-1 text-xs text-[var(--muted)]">
                            {report.created_at}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pl-11 sm:pl-0">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            report.report_type === "lost"
                              ? "bg-red-50 text-red-600"
                              : "bg-[var(--sage)] text-[var(--primary)]"
                          }`}
                        >
                          {report.report_type === "lost" ? "Lost" : "Found"}
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-[var(--muted)]">
                          {report.status.replace("_", " ")}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Profile summary */}
            <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <div className="mb-5 flex items-center gap-2">
                <ShieldCheck size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold text-[var(--foreground)]">
                  Your campus identity
                </h3>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs text-[var(--muted)]">Full name</p>
                  <p className="mt-1 text-sm font-medium">
                    {profile.full_name}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[var(--muted)]">Student ID</p>
                  <p className="mt-1 text-sm font-medium">
                    {profile.student_id}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[var(--muted)]">Email address</p>
                  <p className="mt-1 break-all text-sm font-medium">
                    {profile.email}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[var(--muted)]">Department</p>
                  <p className="mt-1 text-sm font-medium">
                    {profile.department || "Not provided"}
                  </p>
                </div>
              </div>
            </section>

            <footer className="pb-4 text-center text-xs text-[var(--muted)]">
              © 2026 CampusRecover. Built for the DIU community.
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
