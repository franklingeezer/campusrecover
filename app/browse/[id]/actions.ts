
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ClaimState = {
  success: boolean;
  message: string;
};

export async function submitClaim(
  reportId: string,
  previousState: ClaimState,
  formData: FormData
): Promise<ClaimState> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      message: "Please log in before submitting a claim.",
    };
  }

  const details = String(formData.get("details") ?? "").trim();

  if (details.length < 20) {
    return {
      success: false,
      message: "Please provide at least 20 characters of information.",
    };
  }

  if (details.length > 2000) {
    return {
      success: false,
      message: "Your claim details cannot exceed 2,000 characters.",
    };
  }

  const { data: report, error: reportError } = await supabase
    .from("item_reports")
    .select("reporter_id, report_type, status")
    .eq("id", reportId)
    .maybeSingle();

  if (reportError || !report) {
    return {
      success: false,
      message: "This report could not be found.",
    };
  }

  if (report.report_type !== "found" || report.status !== "open") {
    return {
      success: false,
      message: "This item is not currently accepting claims.",
    };
  }

  if (report.reporter_id === user.id) {
    return {
      success: false,
      message: "You cannot claim your own report.",
    };
  }

  const { error: claimError } = await supabase
    .from("claims")
    .insert({
      report_id: reportId,
      claimant_id: user.id,
      details,
    });

  if (claimError) {
    if (claimError.code === "23505") {
      return {
        success: false,
        message: "You have already submitted a claim for this item.",
      };
    }

    console.error("Claim submission error:", claimError.message);

    return {
      success: false,
      message: "Claim submission failed. Please try again.",
    };
  }

  revalidatePath(`/browse/${reportId}`);
  revalidatePath("/browse");

  return {
    success: true,
    message: "Your claim has been submitted successfully!",
  };
}
