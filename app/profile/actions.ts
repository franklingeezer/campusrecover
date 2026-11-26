
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const department = String(formData.get("department") ?? "").trim();
  const batch = String(formData.get("batch") ?? "").trim();

  if (fullName.length < 2 || fullName.length > 100) {
    redirect("/profile?error=Please+enter+a+valid+full+name.");
  }

  if (department.length > 100 || batch.length > 50) {
    redirect("/profile?error=One+or+more+fields+are+too+long.");
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      department: department || null,
      batch: batch || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("Profile update error:", error.message);
    redirect("/profile?error=Profile+update+failed.+Please+try+again.");
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");

  redirect("/profile?updated=1");
}
