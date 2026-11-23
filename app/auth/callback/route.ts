
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  // Handle errors returned directly by Supabase
  const authError = url.searchParams.get("error_code")
    || url.searchParams.get("error");

  if (authError) {
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("error", "verification_failed");
    loginUrl.searchParams.set("reason", authError);

    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("error", "verification_failed");
    loginUrl.searchParams.set("reason", "missing_code");

    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createClient();

  const { error } =
    await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error(
      "Supabase callback exchange failed:",
      error.message
    );

    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("error", "verification_failed");
    loginUrl.searchParams.set("reason", "exchange_failed");

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(
    new URL("/dashboard", url.origin)
  );
}
