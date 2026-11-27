
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getAvatarPath(url: string | null) {
  if (!url) return null;

  const marker = "/storage/v1/object/public/profile-avatars/";

  try {
    const pathname = new URL(url).pathname;
    const index = pathname.indexOf(marker);

    if (index === -1) return null;

    return decodeURIComponent(
      pathname.slice(index + marker.length)
    );
  } catch {
    return null;
  }
}

function isValidAvatarPath(path: string, userId: string) {
  return (
    path.startsWith(`${userId}/`) &&
    /^[a-zA-Z0-9-]+\/[a-f0-9-]+\.(jpg|png|webp)$/i.test(path)
  );
}

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

export async function saveAvatar(filePath: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Your session has expired. Please log in again." };
  }

  if (!isValidAvatarPath(filePath, user.id)) {
    return { error: "Invalid avatar file path." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Unable to load your profile." };
  }

  const { data } = supabase.storage
    .from("profile-avatars")
    .getPublicUrl(filePath);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      avatar_url: data.publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("Avatar update error:", updateError.message);
    return { error: "Unable to save your profile picture." };
  }

  const oldPath = getAvatarPath(profile.avatar_url);

  if (oldPath && oldPath !== filePath &&
      isValidAvatarPath(oldPath, user.id)) {
    const { error: removeError } = await supabase.storage
      .from("profile-avatars")
      .remove([oldPath]);

    if (removeError) {
      console.error("Old avatar cleanup error:", removeError.message);
    }
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");

  return { success: true, url: data.publicUrl };
}

export async function removeAvatar() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Please log in again." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Unable to load your profile." };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      avatar_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("Avatar removal error:", updateError.message);
    return { error: "Unable to remove your profile picture." };
  }

  const oldPath = getAvatarPath(profile.avatar_url);

  if (oldPath && isValidAvatarPath(oldPath, user.id)) {
    const { error: storageError } = await supabase.storage
      .from("profile-avatars")
      .remove([oldPath]);

    if (storageError) {
      console.error("Avatar file cleanup error:", storageError.message);
    }
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");

  return { success: true };
}
