
"use client";

import { useEffect, useState, useTransition } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun, Check, Loader2 } from "lucide-react";

import {
  updateThemePreference,
  type ThemePreference,
} from "./actions";

type Props = {
  initialTheme: ThemePreference;
};

const themes = [
  {
    value: "light" as const,
    label: "Light",
    description: "A bright, clean appearance.",
    icon: Sun,
  },
  {
    value: "dark" as const,
    label: "Dark",
    description: "A darker appearance for low-light environments.",
    icon: Moon,
  },
  {
    value: "system" as const,
    label: "System",
    description: "Automatically follow your device preference.",
    icon: Monitor,
  },
];

export default function AppearanceSettings({ initialTheme }: Props) {
  const { theme, setTheme } = useTheme();

  const [selectedTheme, setSelectedTheme] =
    useState<ThemePreference>(initialTheme);

  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSelectedTheme(initialTheme);
    setTheme(initialTheme);
  }, [initialTheme, setTheme]);

  function handleThemeChange(nextTheme: ThemePreference) {
    if (nextTheme === selectedTheme || isPending) return;

    const previousTheme = selectedTheme;

    setSelectedTheme(nextTheme);
    setMessage("");

    // Apply the theme immediately.
    setTheme(nextTheme);

    // Save the preference in Supabase.
    startTransition(async () => {
      const result = await updateThemePreference(nextTheme);

      if (!result.success) {
        setSelectedTheme(previousTheme);
        setTheme(previousTheme);
        setMessage(result.error ?? "Something went wrong.");
        return;
      }

      setMessage("Appearance preference saved.");
    });
  }

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <Sun size={19} className="text-[var(--primary)]" />

          <h2 className="font-semibold text-[var(--foreground)]">
            Appearance
          </h2>
        </div>

        <p className="mt-1 text-sm text-[var(--muted)]">
          Choose how CampusRecover looks across your device.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {themes.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedTheme === option.value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={isPending}
              onClick={() => handleThemeChange(option.value)}
              aria-pressed={isSelected}
              className={`relative flex flex-col items-start rounded-xl border p-4 text-left transition ${
                isSelected
                  ? "border-[var(--primary)] bg-[var(--sage)]"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)] hover:bg-[var(--sage)]"
              } disabled:cursor-wait disabled:opacity-70`}
            >
              <div className="mb-4 flex w-full items-center justify-between">
                <div
                  className={`rounded-lg p-2 ${
                    isSelected
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--sage)] text-[var(--primary)]"
                  }`}
                >
                  <Icon size={20} />
                </div>

                {isSelected && (
                  <Check
                    size={18}
                    className="text-[var(--primary)]"
                  />
                )}
              </div>

              <span className="font-semibold text-[var(--foreground)]">
                {option.label}
              </span>

              <span className="mt-1 text-xs leading-5 text-[var(--muted)]">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex min-h-5 items-center gap-2 text-xs">
        {isPending ? (
          <>
            <Loader2
              size={14}
              className="animate-spin text-[var(--primary)]"
            />

            <span className="text-[var(--muted)]">
              Saving preference...
            </span>
          </>
        ) : message ? (
          <span
            className={
              message.includes("saved.")
                ? "text-[var(--primary)]"
                : "text-red-600"
            }
            role="status"
          >
            {message}
          </span>
        ) : (
          <span className="text-[var(--muted)]">
            Current preference: {selectedTheme}
            {theme === "system" ? " (device setting)" : ""}
          </span>
        )}
      </div>
    </section>
  );
}
