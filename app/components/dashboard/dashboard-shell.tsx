
"use client";

import { useState } from "react";
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
} from "lucide-react";
import { handleLogout } from "@/app/dashboard/actions";

type Profile = {
  full_name: string;
  student_id: string;
  email: string;
  department: string | null;
};

type Props = {
  profile: Profile;
};

const navigation = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    active: true,
  },
  {
    label: "Browse items",
    icon: Search,
  },
  {
    label: "Report an item",
    icon: PlusCircle,
  },
  {
    label: "My reports",
    icon: Package,
  },
  {
    label: "My claims",
    icon: Handshake,
  },
  {
    label: "Notifications",
    icon: Bell,
  },
];

export default function DashboardShell({ profile }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = profile.full_name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#F4F8F6] text-[#173D32]">

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E1EAE5] bg-white px-5 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#176F59] text-white">
            <Search size={20} />
          </div>
          <span className="text-lg font-bold">CampusRecover</span>
        </Link>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 hover:bg-[#F4F8F6]"
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
          className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-[#E1EAE5] bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >

          {/* Brand */}
          <div className="flex h-[76px] items-center gap-3 border-b border-[#EAF0EC] px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#176F59] text-white">
              <Search size={23} />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight">
                CampusRecover
              </h1>
              <p className="text-xs text-slate-500">
                Your campus community
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-400">
              Workspace
            </p>

            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.label}
                    type="button"
                    disabled={!item.active}
                    onClick={() => setMobileOpen(false)}
                    title={item.active ? "Dashboard" : "Coming in the next development phase"}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                      item.active
                        ? "bg-[#E9F4EF] text-[#176F59]"
                        : "cursor-not-allowed text-slate-400"
                    }`}
                  >
                    <Icon size={19} />
                    {item.label}
                    {!item.active && (
                      <span className="ml-auto text-[10px] text-slate-400">
                        Soon
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <p className="mb-3 mt-9 px-3 text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-400">
              Account
            </p>

            <button
              type="button"
              disabled
              className="flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-400"
            >
              <UserRound size={19} />
              My profile
              <span className="ml-auto text-[10px]">Soon</span>
            </button>

            <button
              type="button"
              disabled
              className="flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-400"
            >
              <Settings size={19} />
              Settings
              <span className="ml-auto text-[10px]">Soon</span>
            </button>
          </div>

          {/* Sidebar profile */}
          <div className="border-t border-[#EAF0EC] p-4">
            <div className="mb-4 flex items-center gap-3 rounded-lg bg-[#F4F8F6] p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D7EDE3] text-sm font-bold text-[#176F59]">
                {initials}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {profile.full_name}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {profile.student_id}
                </p>
              </div>
            </div>

            <form action={handleLogout}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
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
          <header className="hidden h-[76px] items-center justify-between border-b border-[#E1EAE5] bg-white px-8 lg:flex">
            <div>
              <p className="text-sm text-slate-500">
                CampusRecover / Dashboard
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-full bg-[#E9F4EF] px-3 py-2 text-xs font-medium text-[#176F59]">
                <ShieldCheck size={15} />
                Verified DIU member
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D7EDE3] text-sm font-bold text-[#176F59]">
                {initials}
              </div>
            </div>
          </header>

          {/* Dashboard content */}
          <div className="mx-auto max-w-[1400px] space-y-8 p-5 sm:p-8 lg:p-10">

            {/* Welcome */}
            <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <p className="mb-2 text-sm font-medium text-[#176F59]">
                  YOUR CAMPUS COMMUNITY
                </p>

                <h2 className="text-2xl font-bold tracking-tight text-[#173D32] sm:text-3xl">
                  Welcome back, {profile.full_name.split(" ")[0]}!
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Let's help lost belongings find their way home.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-[#DCE9E2] bg-white px-4 py-3 text-sm text-slate-600">
                <Clock3 size={17} className="text-[#176F59]" />
                CampusRecover member
              </div>
            </section>

            {/* Statistics */}
            <section>
              <div className="mb-4">
                <h3 className="font-semibold text-[#173D32]">
                  Overview
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Your lost and found activity at a glance.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Lost items", icon: Search },
                  { label: "Found items", icon: Package },
                  { label: "Active reports", icon: Clock3 },
                  { label: "Items returned", icon: Handshake },
                ].map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-[#E1EAE5] bg-white p-5 transition hover:border-[#A9CDBB]"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-500">
                          {stat.label}
                        </p>

                        <div className="rounded-lg bg-[#E9F4EF] p-2 text-[#176F59]">
                          <Icon size={19} />
                        </div>
                      </div>

                      <p className="mt-5 text-3xl font-bold text-[#173D32]">
                        —
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Awaiting report integration
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Quick actions */}
            <section>
              <h3 className="mb-4 font-semibold text-[#173D32]">
                Quick actions
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-xl bg-[#176F59] p-6 text-white">
                  <div>
                    <p className="text-lg font-semibold">
                      Lost something?
                    </p>
                    <p className="mt-1 text-sm text-white/75">
                      Report a missing belonging.
                    </p>
                  </div>

                  <div className="rounded-lg bg-white/15 p-3">
                    <Search size={25} />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-[#DCE9E2] bg-white p-6">
                  <div>
                    <p className="text-lg font-semibold text-[#173D32]">
                      Found something?
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Help another student recover it.
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#E9F4EF] p-3 text-[#176F59]">
                    <PlusCircle size={25} />
                  </div>
                </div>
              </div>
            </section>

            {/* Recent reports */}
            <section className="overflow-hidden rounded-xl border border-[#E1EAE5] bg-white">
              <div className="flex items-center justify-between border-b border-[#EAF0EC] px-6 py-5">
                <div>
                  <h3 className="font-semibold text-[#173D32]">
                    Recent reports
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Latest lost and found submissions.
                  </p>
                </div>

                <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
                  View all <ArrowUpRight size={14} />
                </span>
              </div>

              <div className="flex min-h-[210px] flex-col items-center justify-center px-6 py-10 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E9F4EF] text-[#176F59]">
                  <Package size={25} />
                </div>

                <h4 className="font-semibold text-[#173D32]">
                  No reports to display yet
                </h4>

                <p className="mt-2 max-w-sm text-sm text-slate-500">
                  Once students start submitting lost and found reports,
                  they'll appear here.
                </p>
              </div>
            </section>

            {/* Profile summary */}
            <section className="rounded-xl border border-[#E1EAE5] bg-white p-6">
              <div className="mb-5 flex items-center gap-2">
                <ShieldCheck size={20} className="text-[#176F59]" />
                <h3 className="font-semibold text-[#173D32]">
                  Your campus identity
                </h3>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs text-slate-400">Full name</p>
                  <p className="mt-1 text-sm font-medium">
                    {profile.full_name}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Student ID</p>
                  <p className="mt-1 text-sm font-medium">
                    {profile.student_id}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Email address</p>
                  <p className="mt-1 break-all text-sm font-medium">
                    {profile.email}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Department</p>
                  <p className="mt-1 text-sm font-medium">
                    {profile.department || "Not provided"}
                  </p>
                </div>
              </div>
            </section>

            <footer className="pb-4 text-center text-xs text-slate-400">
              © {new Date().getFullYear()} CampusRecover. Built for the DIU community.
            </footer>

          </div>
        </main>
      </div>
    </div>
  );
}
