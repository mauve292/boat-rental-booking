import type { Metadata } from "next";
import { ShellCard } from "@boat/ui";
import { redirectIfAuthenticated } from "@/lib/session";
import { SignInForm } from "@/components/sign-in-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Sign In",
  description: "Sign in to the protected admin surface."
};

export default async function SignInPage() {
  await redirectIfAuthenticated();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-16">
      <div className="grid w-full gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <ShellCard
          eyebrow="Admin Access"
          title="Sign in"
          description="Use the seeded admin credentials from your local environment. The public site and booking app remain unauthenticated in this phase."
        >
          <SignInForm />
        </ShellCard>

        <ShellCard
          eyebrow="Phase 1"
          title="What changed"
          description="Better Auth now protects the admin dashboard with credential-based sessions stored in Prisma. This keeps the setup portable for Vercel and a later self-hosted deployment."
        >
          <ul className="space-y-3 text-sm leading-6 text-slate-600">
            <li>Admin-only sign-in with email and password.</li>
            <li>Server-side route protection for the dashboard surface.</li>
            <li>Prisma-backed sessions and account records.</li>
          </ul>
        </ShellCard>
      </div>
    </main>
  );
}
