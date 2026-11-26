
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationAsRead(formData: FormData) {
  const notificationId = formData.get("notificationId");

  if (typeof notificationId !== "string" || !notificationId) {
    return;
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId)
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    throw new Error("Unable to mark notification as read.");
  }

  revalidatePath("/notifications");
}

export async function markAllNotificationsAsRead() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    throw new Error("Unable to mark notifications as read.");
  }

  revalidatePath("/notifications");
}
