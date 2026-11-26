
"use client";

import { useActionState } from "react";
import { submitClaim, type ClaimState } from "./actions";

const initialState: ClaimState = {
  success: false,
  message: "",
};

export default function ClaimForm({
  reportId,
}: {
  reportId: string;
}) {
  const action = submitClaim.bind(null, reportId);

  const [state, formAction, isPending] = useActionState(
    action,
    initialState
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <label
          htmlFor="details"
          className="mb-2 block text-sm font-medium text-[#0F3A2F]"
        >
          Explain why this item belongs to you
        </label>

        <textarea
          id="details"
          name="details"
          required
          minLength={20}
          maxLength={2000}
          rows={5}
          placeholder="Describe identifying features, contents, or other details that can help verify ownership..."
          className="w-full rounded-xl border border-[#DCE7E1] bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#176F59] focus:ring-2 focus:ring-[#176F59]/10"
        />

        <p className="mt-2 text-xs text-slate-400">
          Please provide at least 20 characters. Avoid sharing sensitive
          personal information.
        </p>
      </div>

      {state.message && (
        <div
          role="status"
          className={`rounded-xl border p-3 text-sm ${
            state.success
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || state.success}
        className="rounded-xl bg-[#176F59] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0F3A2F] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending
          ? "Submitting claim..."
          : state.success
            ? "Claim submitted"
            : "Submit claim"}
      </button>
    </form>
  );
}
