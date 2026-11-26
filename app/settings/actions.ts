"use server";

import { createClient } from "@/lib/supabase/server";

export type ThemePreference = "light" | "dark" | "system";

export async function updateThemePreference(theme: ThemePreference) {
  if (!["light", "dark", "system"].includes(theme)) {
    return { success: false, error: "Invalid theme preference." };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Please sign in again." };
  }

  const { error } = await supabase
    .from("user_settings")
    .upsert(
      {
        user_id: user.id,
        theme,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("Theme preference update error:", error.message);
    return { success: false, error: "Could not save your theme preference." };
  }

  return { success: true };
}