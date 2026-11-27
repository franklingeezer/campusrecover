
"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Camera,
  Loader2,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  removeAvatar,
  saveAvatar,
} from "./actions";

type Props = {
  initialUrl: string | null;
  fullName: string;
  initials: string;
};

export default function AvatarUpload({
  initialUrl,
  fullName,
  initials,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setMessage("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be 5 MB or less.");
      event.target.value = "";
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setLoading(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Please log in again.");
      }

      const extension = file.type === "image/jpeg"
        ? "jpg"
        : file.type === "image/png"
          ? "png"
          : "webp";

      const filePath =
        `${user.id}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-avatars")
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const result = await saveAvatar(filePath);

      if (result.error) {
        await supabase.storage
          .from("profile-avatars")
          .remove([filePath]);

        throw new Error(result.error);
      }

      setPreview(result.url ?? null);
      setMessage("Profile picture updated successfully.");

      window.dispatchEvent(new Event("profile-avatar-updated"));
    } catch (err) {
      setPreview(initialUrl);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload your picture."
      );
    } finally {
      URL.revokeObjectURL(localPreview);
      setLoading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function handleRemove() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const result = await removeAvatar();

      if (result.error) {
        throw new Error(result.error);
      }

      setPreview(null);
      setMessage("Profile picture removed.");
      window.dispatchEvent(new Event("profile-avatar-updated"));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to remove your picture."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-center gap-3">
      <div className="relative">
        {preview ? (
          <img
            src={preview}
            alt={fullName}
            className="h-24 w-24 rounded-full border-4 border-white/20 object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#D7EDE3] text-2xl font-bold text-[#176F59]">
            {initials || <UserRound size={32} />}
          </div>
        )}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          aria-label="Change profile picture"
          className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#176F59] text-white shadow-md transition hover:bg-[#0F3A2F] disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Camera size={17} />
          )}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleUpload}
        disabled={loading}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="text-xs font-semibold text-white/90 transition hover:text-white disabled:opacity-50"
      >
        {loading ? "Uploading..." : preview ? "Change photo" : "Upload photo"}
      </button>

      {preview && (
        <button
          type="button"
          onClick={handleRemove}
          disabled={loading}
          className="flex items-center gap-1 text-xs text-red-200 transition hover:text-white disabled:opacity-50"
        >
          <Trash2 size={13} />
          Remove
        </button>
      )}

      {message && (
        <p role="status" className="max-w-40 text-center text-xs text-emerald-100">
          {message}
        </p>
      )}

      {error && (
        <p role="alert" className="max-w-48 text-center text-xs text-red-200">
          {error}
        </p>
      )}
    </div>
  );
}
