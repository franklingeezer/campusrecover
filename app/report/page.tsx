
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  ImagePlus,
  MapPin,
  PackagePlus,
  Search,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Category = {
  id: number;
  name: string;
};

type Location = {
  id: string;
  name: string;
  building: string | null;
};

export default function ReportPage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [reportType, setReportType] = useState<"lost" | "found">("lost");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [incidentTime, setIncidentTime] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadOptions() {
      const [categoryResult, locationResult] = await Promise.all([
        supabase
          .from("categories")
          .select("id, name")
          .eq("is_active", true)
          .order("name"),

        supabase
          .from("locations")
          .select("id, name, building")
          .eq("is_active", true)
          .order("name"),
      ]);

      if (categoryResult.error) {
        console.error("Category loading error:", categoryResult.error);
      } else {
        setCategories(categoryResult.data ?? []);
      }

      if (locationResult.error) {
        console.error("Location loading error:", locationResult.error);
      } else {
        setLocations(locationResult.data ?? []);
      }

      setLoadingOptions(false);
    }

    loadOptions();
  }, []);

  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");

    const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

if (!allowedTypes.includes(file.type)) {
  setError("Only JPG, PNG, and WEBP images are allowed.");
  return;
}

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be 5 MB or less.");
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImage(null);
    setImagePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  
async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (isSubmitting) return;

  setError("");
  setSuccess("");

  if (!title.trim() || !description.trim()) {
    setError("Please complete the item title and description.");
    return;
  }

  if (!categoryId || !locationId) {
    setError("Please select a category and campus location.");
    return;
  }

  if (!incidentDate) {
    setError("Please select the date of the incident.");
    return;
  }

  setIsSubmitting(true);

  let uploadedImagePath: string | null = null;

  try {
    // 1. Verify the authenticated user.
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Your session has expired. Please log in again.");
    }

    // 2. Upload the optional image.
    if (image) {
      const extension = image.name.split(".").pop()?.toLowerCase();

      if (!extension || !["jpg", "jpeg", "png", "webp"].includes(extension)) {
        throw new Error("Please upload a JPG, PNG, or WEBP image.");
      }

      const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("item-images")
        .upload(filePath, image, {
          cacheControl: "3600",
          contentType: image.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Image upload failed: ${uploadError.message}`);
      }

      uploadedImagePath = filePath;
    }

    // 3. Convert the selected date and optional time to a timestamp.
    const incidentDateTime = new Date(
      `${incidentDate}T${incidentTime || "12:00"}:00`
    );

    if (Number.isNaN(incidentDateTime.getTime())) {
      throw new Error("Please enter a valid incident date and time.");
    }

    // 4. Insert the report into Supabase.
    const { error: insertError } = await supabase
      .from("item_reports")
      .insert({
        reporter_id: user.id,
        category_id: Number(categoryId),
        location_id: locationId,
        report_type: reportType,
        title: title.trim(),
        description: description.trim(),
        incident_at: incidentDateTime.toISOString(),
        image_path: uploadedImagePath,
      });

    if (insertError) {
      throw new Error(`Report submission failed: ${insertError.message}`);
    }

    // 5. Show success feedback.
    setSuccess("Your report has been submitted successfully!");

    setTitle("");
    setDescription("");
    setCategoryId("");
    setLocationId("");
    setIncidentDate("");
    setIncidentTime("");
    removeImage();
  } catch (err) {
    // Remove the uploaded image if report insertion failed.
    if (uploadedImagePath) {
      const { error: cleanupError } = await supabase.storage
        .from("item-images")
        .remove([uploadedImagePath]);

      if (cleanupError) {
        console.error("Image cleanup error:", cleanupError.message);
      }
    }

    console.error("Report submission error:", err);

    setError(
      err instanceof Error
        ? err.message
        : "Something went wrong. Please try again."
    );
  } finally {
    setIsSubmitting(false);
  }
}


  return (
    <main className="min-h-screen bg-[#F4F8F6]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#E2ECE7] bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-medium text-[#176F59] transition hover:text-[#0F3A2F]"
          >
            <ArrowLeft size={18} />
            Back to dashboard
          </Link>

          <span className="font-semibold tracking-tight text-[#0F3A2F]">
            CampusRecover
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-10">
        {/* Page heading */}
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#E6F3ED] px-3 py-1.5 text-xs font-semibold text-[#176F59]">
            <PackagePlus size={14} />
            CAMPUS COMMUNITY
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#0F3A2F]">
            Report an item
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Help reunite lost belongings with their owners.
            Provide accurate information so the community can help.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Report type */}
          <section className="rounded-2xl border border-[#E0EAE5] bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="font-semibold text-[#0F3A2F]">
                What would you like to report?
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Choose the type of report.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setReportType("lost")}
                className={`rounded-xl border p-4 text-left transition ${
                  reportType === "lost"
                    ? "border-[#176F59] bg-[#EAF5F0] ring-1 ring-[#176F59]"
                    : "border-slate-200 hover:border-[#9BC8B5]"
                }`}
              >
                <Search
                  size={22}
                  className={
                    reportType === "lost"
                      ? "text-[#176F59]"
                      : "text-slate-400"
                  }
                />
                <p className="mt-3 font-semibold text-[#0F3A2F]">
                  I lost something
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Report a missing item.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setReportType("found")}
                className={`rounded-xl border p-4 text-left transition ${
                  reportType === "found"
                    ? "border-[#176F59] bg-[#EAF5F0] ring-1 ring-[#176F59]"
                    : "border-slate-200 hover:border-[#9BC8B5]"
                }`}
              >
                <PackagePlus
                  size={22}
                  className={
                    reportType === "found"
                      ? "text-[#176F59]"
                      : "text-slate-400"
                  }
                />
                <p className="mt-3 font-semibold text-[#0F3A2F]">
                  I found something
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Help someone recover it.
                </p>
              </button>
            </div>
          </section>

          {/* Item details */}
          <section className="rounded-2xl border border-[#E0EAE5] bg-white p-6 shadow-sm">
            <h2 className="mb-5 font-semibold text-[#0F3A2F]">
              Item information
            </h2>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="title"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Item title *
                </label>
                <input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Black Samsung Galaxy phone"
                  maxLength={100}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#176F59] focus:ring-2 focus:ring-[#176F59]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Description *
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the item, its color, brand, identifying marks, or other useful details..."
                  rows={5}
                  maxLength={1500}
                  required
                  className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#176F59] focus:ring-2 focus:ring-[#176F59]/10"
                />
                <p className="mt-1 text-right text-xs text-slate-400">
                  {description.length}/1500
                </p>
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Category *
                </label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  disabled={loadingOptions}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#176F59] focus:ring-2 focus:ring-[#176F59]/10"
                >
                  <option value="">
                    {loadingOptions
                      ? "Loading categories..."
                      : "Select a category"}
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Location and date */}
          <section className="rounded-2xl border border-[#E0EAE5] bg-white p-6 shadow-sm">
            <h2 className="mb-5 font-semibold text-[#0F3A2F]">
              Where and when?
            </h2>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="location"
                  className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700"
                >
                  <MapPin size={16} className="text-[#176F59]" />
                  Campus location *
                </label>
                <select
                  id="location"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  required
                  disabled={loadingOptions}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#176F59] focus:ring-2 focus:ring-[#176F59]/10"
                >
                  <option value="">
                    {loadingOptions
                      ? "Loading locations..."
                      : "Select a campus location"}
                  </option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                      {location.building
                        ? ` — ${location.building}`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="incidentDate"
                    className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700"
                  >
                    <CalendarDays size={16} className="text-[#176F59]" />
                    Date *
                  </label>
                  <input
                    id="incidentDate"
                    type="date"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#176F59] focus:ring-2 focus:ring-[#176F59]/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="incidentTime"
                    className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700"
                  >
                    <Clock3 size={16} className="text-[#176F59]" />
                    Approximate time
                  </label>
                  <input
                    id="incidentTime"
                    type="time"
                    value={incidentTime}
                    onChange={(e) => setIncidentTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#176F59] focus:ring-2 focus:ring-[#176F59]/10"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Image upload */}
          <section className="rounded-2xl border border-[#E0EAE5] bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-[#0F3A2F]">
              Item photograph
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Add a photo to help others identify the item. Maximum size: 5 MB.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />

            {imagePreview ? (
              <div className="relative mt-5 overflow-hidden rounded-xl border border-slate-200">
                <img
                  src={imagePreview}
                  alt="Selected item preview"
                  className="max-h-72 w-full object-contain bg-slate-50"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute right-3 top-3 flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-red-600 shadow-sm hover:bg-red-50"
                >
                  <Trash2 size={14} />
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-5 flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#C9DDD3] bg-[#F8FBF9] px-5 py-10 text-center transition hover:border-[#176F59] hover:bg-[#F0F7F3]"
              >
                <div className="mb-3 rounded-full bg-[#E6F3ED] p-3">
                  <UploadCloud size={25} className="text-[#176F59]" />
                </div>
                <span className="text-sm font-semibold text-[#176F59]">
                  Click to upload an image
                </span>
                <span className="mt-1 text-xs text-slate-400">
                  JPG, PNG or WEBP · Up to 5 MB
                </span>
                <ImagePlus
                  size={17}
                  className="mt-3 text-slate-400"
                />
              </button>
            )}

            {image && (
              <p className="mt-3 text-xs text-slate-500">
                Selected: {image.name}
              </p>
            )}
          </section>

          {/* Error / status */}
{error && (
  <div
    role="alert"
    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
  >
    {error}
  </div>
)}

{success && (
  <div
    role="status"
    className="rounded-xl border border-[#D8E8DF] bg-[#EDF7F1] px-4 py-4 text-sm text-[#176F59]"
  >
    <p className="font-semibold">{success}</p>
    <Link
      href="/dashboard"
      className="mt-2 inline-block font-medium underline underline-offset-4"
    >
      Return to dashboard →
    </Link>
  </div>
)}

          {/* Submit */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Link
              href="/dashboard"
              className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
  type="submit"
  disabled={isSubmitting || loadingOptions}
  className="flex items-center justify-center gap-2 rounded-xl bg-[#176F59] px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0F3A2F] disabled:cursor-not-allowed disabled:opacity-60"
>
  <PackagePlus size={17} />
  {isSubmitting ? "Submitting report..." : "Submit report"}
</button>
          </div>

          <p className="pb-5 text-center text-xs text-slate-400">
            Your report will be visible to authenticated CampusRecover members.
          </p>
        </form>
      </div>
    </main>
  );
}
