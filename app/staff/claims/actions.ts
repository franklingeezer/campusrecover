
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

const allowedStatuses = [
  "under_review",
  "approved",
  "rejected",
  "disputed",
] as const;

type ReviewStatus = (typeof allowedStatuses)[number];

export async function reviewClaim(formData: FormData) {
  const claimId = String(formData.get("claimId") ?? "");
  const newStatus = String(formData.get("newStatus") ?? "");

  if (!claimId || !allowedStatuses.includes(newStatus as ReviewStatus)) {
    throw new Error("Invalid claim review request.");
  }

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
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    profileError ||
    !profile ||
    !["security", "admin"].includes(profile.role)
  ) {
    redirect("/dashboard");
  }

  const { error: reviewError } = await supabase.rpc("review_claim", {
    p_claim_id: claimId,
    p_new_status: newStatus as ReviewStatus,
  });

  if (reviewError) {
    throw new Error(`Claim review failed: ${reviewError.message}`);
  }

  revalidatePath("/staff/claims");
  revalidatePath("/my-claims");
  revalidatePath("/my-reports");
  revalidatePath("/dashboard");
}


export async function verifyHandover(formData: FormData) {
  const handoverId = String(formData.get("handoverId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!handoverId) {
    throw new Error("Invalid handover verification request.");
  }

  const supabase = await createClient();

  // Verify authenticated user.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Verify staff role.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    profileError ||
    !profile ||
    !["security", "admin"].includes(profile.role)
  ) {
    redirect("/dashboard");
  }

  // Call the protected database function.
  const { error } = await supabase.rpc("verify_handover", {
    p_handover_id: handoverId,
    p_notes: notes || null,
  });

  if (error) {
    throw new Error(`Handover verification failed: ${error.message}`);
  }

  revalidatePath("/staff/claims");
  revalidatePath("/my-claims");
  revalidatePath("/my-reports");
  revalidatePath("/dashboard");
}
