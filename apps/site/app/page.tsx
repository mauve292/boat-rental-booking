import { ShellCard } from "@boat/ui";

export default function SitePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-20">
      <ShellCard
        eyebrow="Public Site"
        title="Boat Rental Fleet"
        description="Monorepo scaffold for the marketing site. Shared packages are wired, but booking, auth, and data layers are intentionally deferred."
      >
        <p className="text-sm text-slate-600">
          Next steps can add fleet browsing, booking flows, and shared domain
          logic without changing the workspace shape.
        </p>
      </ShellCard>
    </main>
  );
}

