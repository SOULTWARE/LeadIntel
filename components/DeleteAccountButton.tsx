"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

type DeleteAccountButtonProps = {
  email: string;
};

export default function DeleteAccountButton({ email }: DeleteAccountButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const reset = () => {
    setConfirming(false);
    setConfirmationText("");
    setLoading(false);
  };

  const handleDelete = async () => {
    if (confirmationText.trim().toUpperCase() !== "DELETE") {
      toast.error('Type "DELETE" to confirm.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "user_initiated" }),
      });
      const data = await response.json().catch(() => undefined);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Failed to delete account");
      }

      await supabase.auth.signOut();
      toast.success("Account deleted. Goodbye!");
      router.replace("/");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete account");
    } finally {
      setLoading(false);
    }
  };

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-600 transition-transform hover:-translate-y-0.5 hover:bg-rose-100"
      >
        Delete account
      </button>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-rose-100 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-600">
        This will permanently remove {email}. Type <span className="font-semibold text-rose-600">DELETE</span> to confirm.
      </p>
      <input
        type="text"
        value={confirmationText}
        onChange={(event) => setConfirmationText(event.target.value)}
        className="w-full rounded-2xl border border-rose-200 px-4 py-3 text-sm outline-none focus:border-rose-500"
        placeholder="DELETE"
      />
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          className="flex-1 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white transition-transform hover:-translate-y-0.5 hover:bg-rose-700 disabled:opacity-60"
        >
          {loading ? "Deleting..." : "Confirm deletion"}
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={loading}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
