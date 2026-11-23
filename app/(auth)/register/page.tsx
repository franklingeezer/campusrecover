"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Mail,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

const DIU_DOMAIN = "@diu.edu.bd";

const inputClass =
  "w-full rounded-lg border border-[#cfdcd5] bg-white px-4 py-3 text-sm text-[#12332a] outline-none transition placeholder:text-slate-400 focus:border-[#176f59] focus:ring-2 focus:ring-[#176f59]/20";

function getStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (!password) return { score: 0, label: "", color: "bg-slate-200" };
  if (score <= 2) return { score: 1, label: "Weak", color: "bg-red-500" };
  if (score === 3) return { score: 2, label: "Fair", color: "bg-amber-500" };
  if (score === 4) return { score: 3, label: "Good", color: "bg-emerald-500" };
  return { score: 4, label: "Strong", color: "bg-emerald-700" };
}

function ClaimTag({
  name,
  studentId,
  email,
}: {
  name: string;
  studentId: string;
  email: string;
}) {
  // Barcode bars are derived from the student ID so the tag feels "issued" to the person.
  const bars = useMemo(() => {
    const seed = studentId.trim() || "CAMPUSRECOVER";
    return Array.from({ length: 34 }, (_, i) => {
      const code = seed.charCodeAt(i % seed.length);
      return 1 + ((code + i * 7) % 3);
    });
  }, [studentId]);

  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      {/* string */}
      <div className="absolute left-1/2 top-0 h-10 w-px -translate-x-1/2 bg-amber-300/70" />

      <div className="mt-9 -rotate-2 rounded-2xl bg-[#fbfaf5] p-6 pt-9 shadow-[0_24px_50px_-18px_rgba(0,0,0,0.55)]">
        {/* punched hole */}
        <div className="absolute left-1/2 top-[22px] h-4 w-4 -translate-x-1/2 rounded-full bg-[#0f3a2f] ring-2 ring-amber-300" />

        <div className="flex items-center gap-2 text-[#176f59]">
          <Search size={16} />
          <span className="text-sm font-bold tracking-tight">
            CampusRecover
          </span>
        </div>

        <p className="mt-1 text-xs text-slate-500">Member tag</p>

        <div className="mt-6 space-y-4">
          <div>
            <p className="text-xs text-slate-500">Name</p>
            <p
              className={`mt-0.5 truncate text-lg font-semibold ${
                name.trim() ? "text-[#12332a]" : "text-slate-300"
              }`}
            >
              {name.trim() || "Your full name"}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Student ID</p>
            <p
              className={`mt-0.5 truncate font-mono text-base ${
                studentId.trim() ? "text-[#12332a]" : "text-slate-300"
              }`}
            >
              {studentId.trim() || "000-00-0000"}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">DIU email</p>
            <p
              className={`mt-0.5 truncate text-sm ${
                email.trim() ? "text-[#12332a]" : "text-slate-300"
              }`}
            >
              {email.trim() || `you${DIU_DOMAIN}`}
            </p>
          </div>
        </div>

        <div className="my-5 border-t border-dashed border-slate-300" />

        <div className="flex h-10 items-stretch gap-[2px]" aria-hidden="true">
          {bars.map((w, i) => (
            <div
              key={i}
              className="bg-[#12332a]"
              style={{ width: `${w * 2}px` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const strength = getStrength(password);
  const normalizedEmail = email.trim().toLowerCase();
  const emailLooksWrong =
    normalizedEmail.length > 0 &&
    normalizedEmail.includes("@") &&
    !normalizedEmail.endsWith(DIU_DOMAIN);
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const diuEmailPattern = /^[a-zA-Z0-9._%+-]+@diu\.edu\.bd$/;

    if (!diuEmailPattern.test(normalizedEmail)) {
    setError("Please enter a valid DIU email address.");
    return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!fullName.trim() || !studentId.trim()) {
    setError("Please complete all required fields.");
    return;
    }

   const studentIdPattern = /^\d{3}-\d{2}-\d{3,4}$/; 

    if (!studentIdPattern.test(studentId.trim())) {
    setError("Please enter a valid DIU Student ID.");
    return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName.trim(),
            student_id: studentId.trim(),
          },
        },
      });

        if (error) throw error;

    if (data.session) {
    window.location.href = "/dashboard";
    return;
    }

    setSuccess(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

    
async function handleResend() {
  if (!normalizedEmail) {
    setError("Email address is missing.");
    return;
  }

  setResending(true);
  setError("");
  setResent(false);

  try {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: normalizedEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw error;
    }

    setResent(true);
  } catch (err: unknown) {
    setError(
      err instanceof Error
        ? err.message
        : "Unable to resend confirmation email. Please try again."
    );
  } finally {
    setResending(false);
  }
}


  return (
    <main className="grid min-h-screen bg-[#f3f7f5] lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Left: brand + live claim tag */}
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
            Lost something on campus? Someone may have already found it.
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-6 text-emerald-100/75">
            CampusRecover connects DIU students who lose items with the people
            who find them.
          </p>
        </div>

        <div className="relative my-auto py-10">
          <ClaimTag name={fullName} studentId={studentId} email={email} />
        </div>

        <ol className="relative grid max-w-md gap-3 text-sm text-emerald-50/90">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-300 text-xs font-bold text-[#0f3a2f]">
              1
            </span>
            Post what you lost or found, with a photo and the place.
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-300 text-xs font-bold text-[#0f3a2f]">
              2
            </span>
            Get matched with reports from other verified students.
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-300 text-xs font-bold text-[#0f3a2f]">
              3
            </span>
            Arrange a safe handover and mark the item as returned.
          </li>
        </ol>
      </aside>

      {/* Right: form */}
      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-emerald-800 lg:hidden"
          >
            <ArrowLeft size={17} />
            Back to CampusRecover
          </Link>

          {success ? (
            <div className="rounded-2xl border border-[#d9e5df] bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                <Mail size={30} className="text-[#176f59]" />
              </div>

              <h2 className="text-2xl font-bold text-[#12332a]">
                Check your inbox
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                We sent a confirmation link to{" "}
                <strong className="break-all text-[#12332a]">
                  {normalizedEmail}
                </strong>
                . Confirm your email, then log in to start posting.
              </p>

              {error && (
                <p
                  role="alert"
                  className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600"
                >
                  {error}
                </p>
              )}

              <Link
                href="/login"
                className="mt-7 inline-block w-full rounded-lg bg-[#176f59] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#125b49]"
              >
                Go to login
              </Link>

              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="mt-4 text-sm font-medium text-[#176f59] hover:underline disabled:opacity-60"
              >
                {resending
                  ? "Sending..."
                  : resent
                  ? "Email sent again. Check your spam folder too."
                  : "Didn't get it? Resend email"}
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#176f59] text-white">
                  <Search size={24} />
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-[#12332a]">
                  Create your account
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  Only DIU students can join, so every report comes from a
                  verified member of campus.
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-5" noValidate>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="fullName"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Full name
                    </label>
                    <input
                      id="fullName"
                      required
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="studentId"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Student ID
                    </label>
                    <input
                      id="studentId"
                      required
                      inputMode="numeric"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="e.g. 221-15-0000"
                      className={inputClass}
                    />
                  </div>
                </div>

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
                    aria-invalid={emailLooksWrong}
                    className={`${inputClass} ${
                      emailLooksWrong
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : ""
                    }`}
                  />
                  {emailLooksWrong && (
                    <p className="mt-2 text-xs text-red-600">
                      Use your university address ending in {DIU_DOMAIN}.
                    </p>
                  )}
                </div>

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
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
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
                      {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>

                  {password && (
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex flex-1 gap-1.5">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                              i <= strength.score
                                ? strength.color
                                : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="w-12 text-right text-xs text-slate-500">
                        {strength.label}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Confirm password
                  </label>
                  <input
                    id="confirmPassword"
                    required
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className={inputClass}
                  />
                  {passwordsMatch && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700">
                      <Check size={14} /> Passwords match
                    </p>
                  )}
                  {passwordsMismatch && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
                      <X size={14} /> Passwords don&apos;t match yet
                    </p>
                  )}
                </div>

                {error && (
                  <p
                    role="alert"
                    className="rounded-lg bg-red-50 p-3 text-sm text-red-600"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-[#176f59] py-3.5 text-sm font-semibold text-white transition hover:bg-[#125b49] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#176f59] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Creating account..." : "Create account"}
                </button>

                <p className="flex items-start gap-2 text-xs leading-5 text-slate-500">
                  <ShieldCheck
                    size={16}
                    className="mt-0.5 shrink-0 text-[#176f59]"
                  />
                    We&apos;ll send a confirmation link to your DIU email
                    address. Your student ID will be associated with your
                    CampusRecover profile.
                </p>
              </form>

              <p className="mt-8 text-center text-sm text-slate-500">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-[#176f59] hover:underline"
                >
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}