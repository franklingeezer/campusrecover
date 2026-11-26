
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import {
  Settings,
  Bell,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import AppearanceSettings from "./appearance-settings";

function SettingsLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      <div className="mx-auto max-w-5xl animate-pulse space-y-6">
        <div className="h-10 w-48 rounded-lg bg-[var(--sage)]" />

        <div className="h-5 w-80 rounded bg-[var(--sage)]" />

        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-24 rounded-xl border border-[var(--border)] bg-[var(--surface)]"
          />
        ))}
      </div>
    </div>
  );
}

async function SettingsContent() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: settings, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Settings fetch error:", error.message);
  }

  const initialTheme =
    settings?.theme === "light" ||
    settings?.theme === "dark" ||
    settings?.theme === "system"
      ? settings.theme
      : "system";

  const sections = [
    {
      title: "Notifications",
      description: "Manage updates about claims, matches, and handovers.",
      icon: Bell,
      status: "Coming next",
    },
    {
      title: "Security",
      description: "Manage your password and account security.",
      icon: ShieldCheck,
      status: "Coming next",
    },
    {
      title: "Account",
      description: "Review your account and university information.",
      icon: UserRound,
      status: "Available",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="flex h-[76px] items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-6 sm:px-8">
        <p className="text-sm text-[var(--muted)]">
          CampusRecover / Settings
        </p>

        <span className="text-lg font-bold text-[var(--foreground)]">
          CampusRecover
        </span>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 p-5 sm:p-8 lg:p-10">
        <section>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--sage)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
            <Settings size={15} />
            Preferences
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Settings
          </h1>

          <p className="mt-2 text-sm text-[var(--muted)]">
            Manage your CampusRecover preferences and account security.
          </p>
        </section>

        <section className="space-y-4">
          <AppearanceSettings initialTheme={initialTheme} />

          {sections.map((section) => {
            const Icon = section.icon;

            return (
              <div
                key={section.title}
                className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-[var(--sage)] p-3 text-[var(--primary)]">
                    <Icon size={22} />
                  </div>

                  <div>
                    <h2 className="font-semibold text-[var(--foreground)]">
                      {section.title}
                    </h2>

                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {section.description}
                    </p>
                  </div>
                </div>

                <span className="shrink-0 text-xs font-medium text-[var(--muted)]">
                  {section.status}
                </span>
              </div>
            );
          })}
        </section>

        <p className="text-xs text-[var(--muted)]">
          Your saved appearance preference: {initialTheme}.
        </p>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsContent />
    </Suspense>
  );
}
