"use client";

import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Zap, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import BrandMark from "@/components/BrandMark";

export const dynamic = "force-dynamic";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null && "message" in error) {
    const msg = (error as Record<string, unknown>).message;
    if (typeof msg === "string") return msg;
  }
  return "Unknown error";
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const redirectBaseUrl = appUrl || location.origin;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const blockedResponse = await fetch("/api/account/blocked", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const blockedData = await blockedResponse.json().catch(() => undefined);

        if (!blockedResponse.ok) {
          throw new Error(
            blockedData?.error || "Unable to verify email status",
          );
        }
        if (blockedData?.blocked) {
          throw new Error(
            "This email was previously deleted and cannot sign up again.",
          );
        }

        const plan = searchParams.get("plan");
        const redirectPath = plan ? `/profile?plan=${plan}` : "/profile";
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${redirectBaseUrl}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
          },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        const plan = searchParams.get("plan");
        const nextPath = plan ? `/profile?plan=${plan}` : "/profile";
        toast.success("Successfully logged in!");
        router.push(nextPath);
        router.refresh();
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      toast.error("Please enter your email first");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${redirectBaseUrl}/auth/callback`,
        },
      });
      if (error) throw error;
      toast.success("Check your email for the magic link!");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden border-r border-slate-200 bg-slate-950 text-white lg:flex">
          <div className="flex h-full w-full flex-col justify-between p-10 xl:p-14">
            <BrandMark inverted />

            <div className="max-w-xl space-y-6">
              <div className="eyebrow border-slate-700 bg-slate-900 text-slate-300">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Outbound operating system
              </div>
              <h2 className="text-5xl font-semibold tracking-tight text-white xl:text-6xl">
                Build a cleaner lead workflow from sourcing to outreach.
              </h2>
              <p className="text-lg leading-8 text-slate-300">
                LeadIntel Pro combines verified sourcing, AI qualification, and
                contact preparation in one focused workspace for teams running
                real outbound volume.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  "Verified sourcing",
                  "AI qualification",
                  "Draft + export",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-md border border-slate-800 bg-slate-900 px-4 py-4 text-sm font-medium text-slate-200"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-400">
              <div className="section-label text-slate-500">
                Why teams use it
              </div>
              <div className="grid gap-2">
                {[
                  "Find lead lists faster with structured sourcing sessions.",
                  "Score fit before outreach so reps spend time on better accounts.",
                  "Generate drafts and exports without leaving the workspace.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 lg:p-10">
          <div className="w-full max-w-md space-y-8">
            <div className="lg:hidden">
              <BrandMark />
            </div>

            <div className="surface space-y-8 p-6 sm:p-8">
              <div className="space-y-3">
                <div className="eyebrow">
                  {isSignUp ? "Create workspace access" : "Sign in"}
                </div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                    {isSignUp ? "Create an account" : "Welcome back"}
                  </h1>
                  <p className="mt-2 text-sm text-slate-600">
                    {isSignUp
                      ? "Set up your account to start sourcing and qualifying leads."
                      : "Use your email and password to enter the workspace."}
                  </p>
                </div>
              </div>

              <form onSubmit={handleAuth} className="space-y-5">
                <label className="block space-y-2">
                  <span className="section-label">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="field-input"
                    placeholder="name@company.com"
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="section-label">Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="field-input"
                    placeholder="••••••••"
                    required
                  />
                </label>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full justify-center"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {isSignUp ? "Create Account" : "Sign In"}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="section-label">Alternative access</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <button
                  type="button"
                  onClick={handleMagicLink}
                  disabled={isLoading || !email}
                  className="btn-secondary w-full justify-center"
                >
                  <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                  Send Magic Link
                </button>
              </div>

              <div className="surface-muted p-4 text-sm text-slate-600">
                {isSignUp ? "Already have an account?" : "Need an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="font-semibold text-blue-700 transition-colors hover:text-blue-600"
                >
                  {isSignUp ? "Sign in" : "Create one"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-slate-500">
              <Link href="/" className="transition-colors hover:text-blue-700">
                Back to site
              </Link>
              <Link
                href="/pricing"
                className="transition-colors hover:text-blue-700"
              >
                View pricing
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
