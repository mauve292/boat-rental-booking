import { formatCurrencyAmount, tripTypeLabels } from "@boat/domain";
import { listPricingMatrix } from "@boat/db";
import { EmptyState, FeedbackBanner, Pill, ShellCard, StatCard } from "@boat/ui";
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
  const missingPriceCount = pricingMatrix.reduce(
    (total, row) =>
      total +
      row.prices.filter((price) => price.isSupported && price.amount === null).length,
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
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
            href="/"
          >
            Back to dashboard
          </Link>
        </div>
      </ShellCard>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          detail="Boat rows currently available for pricing updates."
          label="Boats"
          tone="accent"
          value={String(pricingMatrix.length)}
        />
        <StatCard
          detail="Supported trip-type cells that accept direct saves."
          label="Editable cells"
          tone="success"
          value={String(supportedPriceCount)}
        />
        <StatCard
          detail="Supported cells still waiting for a saved amount."
          label="Missing prices"
          tone={missingPriceCount > 0 ? "warning" : "neutral"}
          value={String(missingPriceCount)}
        />
        <StatCard
          detail="Any saved change is reflected on the public booking page after the next render."
          label="Effect"
          tone="neutral"
          value="Public pricing live"
        />
      </section>

      {feedback ? (
        <FeedbackBanner
          title={
            feedback.tone === "success"
              ? "Pricing updated"
              : "Pricing update could not be completed"
          }
          tone={feedback.tone === "success" ? "success" : "error"}
        >
          {feedback.message}
        </FeedbackBanner>
      ) : null}

      <ShellCard
        eyebrow="Matrix"
        title="Boat pricing rules"
        description="Unsupported trip types stay visible but cannot be edited. Each save updates one boat and one trip type only."
      >
        {pricingMatrix.length === 0 ? (
          <EmptyState
            description="Create or seed boats first, then revisit this page to configure the pricing matrix."
            title="No boats available for pricing"
          />
        ) : (
          <div className="space-y-6">
            {pricingMatrix.map((row) => (
              <div
                key={row.boatId}
                className="rounded-[26px] border border-slate-200 bg-slate-50 p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-950">
                      {row.boatName}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">Slug: {row.boatSlug}</p>
                  </div>
                  <Link
                    className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                    href={`/availability?boatId=${row.boatId}`}
                  >
                    Open availability
                  </Link>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {row.prices.map((price) => (
                    <div
                      key={`${row.boatId}-${price.tripType}`}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
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
                              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-slate-900"
                              defaultValue={price.amount?.toFixed(2) ?? "0.00"}
                              inputMode="decimal"
                              min="0"
                              name="amount"
                              step="0.01"
                              type="number"
                            />
                          </label>
                          <PendingSubmitButton
                            className="inline-flex items-center rounded-full bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-700"
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
