
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Search,
  ShieldCheck,
} from "lucide-react";

const DIU_DOMAIN = "@diu.edu.bd";

const inputClass =
  "w-full rounded-lg border border-[#cfdcd5] bg-white px-4 py-3 text-sm text-[#12332a] outline-none transition placeholder:text-slate-400 focus:border-[#176f59] focus:ring-2 focus:ring-[#176f59]/20";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const normalizedEmail = email.trim().toLowerCase();

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const diuEmailPattern =
      /^[a-zA-Z0-9._%+-]+@diu\.edu\.bd$/i;

    if (!diuEmailPattern.test(normalizedEmail)) {
      setError("Please enter a valid DIU email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        if (
          error.message.toLowerCase().includes("email not confirmed")
        ) {
          throw new Error(
            "Please verify your DIU email address before logging in."
          );
        }

        throw error;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to log in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[#f3f7f5] lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">

      {/* Left: Branding panel */}

      <aside className="relative hidden overflow-hidden bg-[#0f3a2f] px-12 py-12 text-white lg:flex lg:flex-col">

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />

        <Link
          href="/"
          className="relative inline-flex w-fit items-center gap-2 text-sm text-emerald-100/80 transition hover:text-white"
        >
          <ArrowLeft size={17} />
          Back to CampusRecover
        </Link>

        <div className="relative mt-12">
          <h2 className="max-w-sm text-4xl font-bold leading-tight tracking-tight">
            Your campus. Your community. Welcome back.
          </h2>

          <p className="mt-4 max-w-sm text-sm leading-6 text-emerald-100/75">
            Log in to reconnect with your campus community
            and help lost belongings find their way home.
          </p>
        </div>

        <div className="relative my-auto py-10">
          <div className="mx-auto w-full max-w-[300px] -rotate-2 rounded-2xl bg-[#fbfaf5] p-6 shadow-[0_24px_50px_-18px_rgba(0,0,0,0.55)]">

            <div className="flex items-center gap-2 text-[#176f59]">
              <Search size={17} />
              <span className="text-sm font-bold tracking-tight">
                CampusRecover
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              DIU Community Member
            </p>

            <div className="mt-8 space-y-5">
              <div>
                <p className="text-xs text-slate-500">
                  Your community
                </p>
                <p className="mt-1 text-lg font-semibold text-[#12332a]">
                  CampusRecover
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Your purpose
                </p>
                <p className="mt-1 text-sm text-[#12332a]">
                  Lost something? Help someone find it.
                </p>
              </div>
            </div>

            <div className="my-5 border-t border-dashed border-slate-300" />

            <div className="flex h-10 items-stretch gap-[3px]" aria-hidden="true">
              {Array.from({ length: 34 }, (_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-[#12332a]"
                  style={{
                    opacity: i % 3 === 0 ? 0.65 : 1,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <ol className="relative grid max-w-md gap-3 text-sm text-emerald-50/90">
          <li className="flex items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-300 text-xs font-bold text-[#0f3a2f]">
              1
            </span>
            Find your lost belongings.
          </li>

          <li className="flex items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-300 text-xs font-bold text-[#0f3a2f]">
              2
            </span>
            Connect with verified students.
          </li>

          <li className="flex items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-300 text-xs font-bold text-[#0f3a2f]">
              3
            </span>
            Make campus a better place.
          </li>
        </ol>
      </aside>

      {/* Right: Login form */}

      <section className="flex items-center justify-center px-5 py-10 sm:px-10">

        <div className="w-full max-w-md">

          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-emerald-800 lg:hidden"
          >
            <ArrowLeft size={17} />
            Back to CampusRecover
          </Link>

          <div className="mb-8">

            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#176f59] text-white">
              <Search size={24} />
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-[#12332a]">
              Welcome back
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Log in to your CampusRecover account and
              reconnect with your campus community.
            </p>

          </div>

          <form onSubmit={handleLogin} className="space-y-5" noValidate>

            {/* Email */}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                DIU email address
              </label>

              <input
                id="email"
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={`name${DIU_DOMAIN}`}
                className={inputClass}
              />
            </div>

            {/* Password */}

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <div className="relative">

                <input
                  id="password"
                  required
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`${inputClass} pr-12`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#176f59]"
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>

              </div>
            </div>

            {/* Error */}

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-sm text-red-600"
              >
                {error}
              </p>
            )}

            {/* Submit */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#176f59] py-3.5 text-sm font-semibold text-white transition hover:bg-[#125b49] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#176f59] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>

            <p className="flex items-start gap-2 text-xs leading-5 text-slate-500">
              <ShieldCheck
                size={16}
                className="mt-0.5 shrink-0 text-[#176f59]"
              />
              Your account is protected by Supabase
              authentication. Only verified DIU students
              can access the community.
            </p>

          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-[#176f59] hover:underline"
            >
              Create account
            </Link>
          </p>

        </div>
      </section>
    </main>
  );
}
