
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import {
  Bell,
  CheckCheck,
  Clock3,
  FileText,
  ShieldCheck,
  ArrowUpRight,
  Inbox,
} from "lucide-react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "./actions";

type Notification = {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  link: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Dhaka",
  });
}

function safeInternalLink(link: string | null) {
  if (!link || !link.startsWith("/") || link.startsWith("//")) {
    return null;
  }

  return link;
}

function getNotificationIcon(type: string) {
  if (type === "claim_status") {
    return ShieldCheck;
  }

  if (type === "report_status") {
    return FileText;
  }

  return Bell;
}

async function NotificationsContent() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id, title, message, notification_type, link, is_read, read_at, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
  console.error("Notifications query failed:", {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });

  throw new Error(
    `Notifications query failed: ${error.message} (${error.code})`
  );
}
  const notifications = (data ?? []) as Notification[];
  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  return (
    <main className="min-h-screen bg-[#F4F8F6] px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[#176F59] hover:underline"
            >
              ← Back to dashboard
            </Link>

            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full bg-[#E5F3ED] px-3 py-1 text-xs font-semibold tracking-wide text-[#176F59]">
                YOUR ACTIVITY
              </span>
            </div>

            <h1 className="text-3xl font-bold text-[#0F3A2F]">
              Notifications
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Stay updated on your CampusRecover activity.
            </p>
          </div>

          {unreadCount > 0 && (
            <form action={markAllNotificationsAsRead}>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#CFE4DA] bg-white px-4 py-3 text-sm font-semibold text-[#176F59] transition hover:bg-[#E9F4EF]"
              >
                <CheckCheck size={17} />
                Mark all as read
              </button>
            </form>
          )}
        </div>

        {/* Summary */}
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[#DFEAE4] bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Total notifications</p>
              <div className="rounded-lg bg-[#E9F4EF] p-2 text-[#176F59]">
                <Bell size={19} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-[#0F3A2F]">
              {notifications.length}
            </p>
          </div>

          <div className="rounded-xl border border-[#DFEAE4] bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Unread notifications</p>
              <div className="rounded-lg bg-[#E9F4EF] p-2 text-[#176F59]">
                <Clock3 size={19} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-[#0F3A2F]">
              {unreadCount}
            </p>
          </div>
        </div>

        {/* Notification list */}
        <section className="overflow-hidden rounded-2xl border border-[#DFEAE4] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E6EEE9] px-5 py-5 sm:px-7">
            <div>
              <h2 className="font-semibold text-[#0F3A2F]">
                Recent notifications
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Your latest updates and messages.
              </p>
            </div>

            <span className="rounded-full bg-[#F1F6F3] px-3 py-1 text-xs font-medium text-slate-600">
              {notifications.length} records
            </span>
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <div className="mb-4 rounded-2xl bg-[#E9F4EF] p-5 text-[#176F59]">
                <Inbox size={34} />
              </div>

              <h3 className="text-lg font-semibold text-[#0F3A2F]">
                You're all caught up!
              </h3>

              <p className="mt-2 max-w-sm text-sm text-slate-500">
                You don't have any notifications yet. We'll let you know when
                something happens.
              </p>

              <Link
                href="/browse"
                className="mt-6 rounded-lg bg-[#176F59] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0F3A2F]"
              >
                Browse items
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#E8EFEB]">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(
                  notification.notification_type
                );

                const internalLink = safeInternalLink(notification.link);

                return (
                  <article
                    key={notification.id}
                    className={`flex flex-col gap-4 px-5 py-5 transition sm:flex-row sm:items-start sm:justify-between sm:px-7 ${
                      notification.is_read
                        ? "bg-white"
                        : "bg-[#F3FAF6]"
                    }`}
                  >
                    <div className="flex min-w-0 gap-4">
                      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E5F3ED] text-[#176F59]">
                        <Icon size={22} />
                        {!notification.is_read && (
                          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-[#176F59]" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-[#0F3A2F]">
                            {notification.title}
                          </h3>

                          {!notification.is_read && (
                            <span className="rounded-full bg-[#E0F2E9] px-2 py-0.5 text-[10px] font-semibold text-[#176F59]">
                              NEW
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {notification.message}
                        </p>

                        <p className="mt-2 text-xs text-slate-400">
                          {formatDate(notification.created_at)}
                        </p>

                        {internalLink && (
                          <Link
                            href={internalLink}
                            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#176F59] hover:underline"
                          >
                            View details
                            <ArrowUpRight size={15} />
                          </Link>
                        )}
                      </div>
                    </div>

                    {!notification.is_read && (
                      <form
                        action={markNotificationAsRead}
                        className="shrink-0 sm:pt-1"
                      >
                        <input
                          type="hidden"
                          name="notificationId"
                          value={notification.id}
                        />

                        <button
                          type="submit"
                          className="rounded-lg border border-[#CFE4DA] bg-white px-3 py-2 text-xs font-semibold text-[#176F59] transition hover:bg-[#E9F4EF]"
                        >
                          Mark as read
                        </button>
                      </form>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="py-8 text-center text-xs text-slate-400">
          © 2026 CampusRecover · Built for the DIU community.
        </footer>
      </div>
    </main>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F8F6] px-6 py-16 text-center text-sm text-slate-500">
          Loading your notifications...
        </div>
      }
    >
      <NotificationsContent />
    </Suspense>
  );
}
