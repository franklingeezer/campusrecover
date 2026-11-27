import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

type PageShellProps = {
  children: ReactNode;
  /** Where the back link goes. Defaults to the dashboard. */
  backHref?: string;
  /** Text of the back link. */
  backLabel?: string;
  /** Replaces the CampusRecover wordmark on the right (for example a role badge). */
  right?: ReactNode;
  /**
   * "default" keeps the page content as wide as the header.
   * "narrow" centers a smaller column, which suits forms.
   */
  width?: "default" | "narrow";
};

/**
 * One header and one container for every signed-in page.
 *
 * The header's inner width never changes, so the back link and the
 * right-hand item sit at exactly the same position on every page.
 */
export default function PageShell({
  children,
  backHref = "/dashboard",
  backLabel = "Back to dashboard",
  right,
  width = "default",
}: PageShellProps) {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <Link
            href={backHref}
            className="flex items-center gap-2 text-sm font-medium text-[var(--primary)] transition hover:text-[var(--primary-dark)]"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            {backLabel}
          </Link>

          {right ?? (
            <span className="font-semibold tracking-tight text-[var(--primary-dark)]">
              CampusRecover
            </span>
          )}
        </div>
      </header>

      <div
        className={`mx-auto w-full px-5 py-10 ${
          width === "narrow" ? "max-w-3xl" : "max-w-6xl"
        }`}
      >
        {children}
      </div>
    </main>
  );
}