import { formatCurrencyAmount, tripTypeLabels } from "@boat/domain";
import { listPricingMatrix } from "@boat/db";
import { Pill, ShellCard } from "@boat/ui";
import Link from "next/link";
import { getPricingFeedback } from "@/lib/pricing-feedback";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { updatePriceRuleAction } from "./actions";

export const dynamic = "force-dynamic";

type PricingPageProps = {
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
};

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const resolvedSearchParams = await searchParams;
  const pricingMatrix = await listPricingMatrix();
  const feedback = getPricingFeedback(resolvedSearchParams.feedback);
  const supportedPriceCount = pricingMatrix.reduce(
    (total, row) => total + row.prices.filter((price) => price.isSupported).length,
    0
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-16">
      <ShellCard
        eyebrow="Admin Pricing"
        title="Pricing"
        description="Update phase-1 boat pricing by boat and trip type. Saved amounts immediately affect the public booking price display."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Pill tone="accent">{pricingMatrix.length} boats</Pill>
          <Pill tone="success">{supportedPriceCount} active price cells</Pill>
          <Link
            className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
            href="/"
          >
            Back to dashboard
          </Link>
        </div>
      </ShellCard>

      {feedback ? (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm ${
            feedback.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <ShellCard
        eyebrow="Matrix"
        title="Boat pricing rules"
        description="Unsupported trip types stay visible but cannot be edited. Each save updates one boat and one trip type only."
      >
        {pricingMatrix.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
            No boats are available yet, so pricing cannot be configured.
          </div>
        ) : (
          <div className="space-y-6">
            {pricingMatrix.map((row) => (
              <div
                key={row.boatId}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-950">
                      {row.boatName}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">Slug: {row.boatSlug}</p>
                  </div>
                  <Link
                    className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                    href={`/availability?boatId=${row.boatId}`}
                  >
                    Open availability
                  </Link>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {row.prices.map((price) => (
                    <div
                      key={`${row.boatId}-${price.tripType}`}
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {tripTypeLabels[price.tripType]}
                        </p>
                        <Pill tone={price.isSupported ? "accent" : "neutral"}>
                          {price.isSupported ? "Editable" : "Not offered"}
                        </Pill>
                      </div>

                      <p className="mt-3 text-sm text-slate-500">
                        {price.amount === null
                          ? "No saved price yet."
                          : `Current price: ${formatCurrencyAmount(
                              price.amount,
                              price.currency
                            )}`}
                      </p>

                      {price.isSupported ? (
                        <form action={updatePriceRuleAction} className="mt-4 space-y-3">
                          <input name="boatId" type="hidden" value={row.boatId} />
                          <input name="tripType" type="hidden" value={price.tripType} />
                          <label className="block text-sm text-slate-600">
                            Amount (EUR)
                            <input
                              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                              defaultValue={price.amount?.toFixed(2) ?? "0.00"}
                              inputMode="decimal"
                              min="0"
                              name="amount"
                              step="0.01"
                              type="number"
                            />
                          </label>
                          <PendingSubmitButton
                            className="inline-flex items-center rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                            idleLabel="Save price"
                            pendingLabel="Saving..."
                          />
                        </form>
                      ) : (
                        <p className="mt-4 text-sm text-slate-500">
                          Enable this trip type on the boat before adding a price rule.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ShellCard>
    </main>
  );
}
