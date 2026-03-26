"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSignOut() {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const result = await authClient.signOut();

      if (result.error) {
        setErrorMessage("Unable to sign out right now.");
        return;
      }

      router.replace("/signin");
      router.refresh();
    } catch {
      setErrorMessage("Unable to sign out right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 md:items-end">
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isSubmitting}
        className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Signing out..." : "Sign out"}
      </button>
      {errorMessage ? (
        <p className="text-xs text-rose-200">{errorMessage}</p>
      ) : null}
    </div>
  );
}
