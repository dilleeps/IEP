import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Check, Sparkles, ArrowLeft, LayoutList, Rocket, Clock } from "lucide-react";
import { planService, type PlanResponse } from "@/domain/admin/plans.service";
import logo from "@/logo.png";

/* ─── Pricing Card ──────────────────────────────────────────────────────── */
function PricingCard({ plan }: { plan: PlanResponse }) {
  const accent = plan.color ?? "#6B7280";
  return (
    <div
      className={`relative flex flex-col rounded-2xl border-2 overflow-hidden transition-all
        hover:-translate-y-1 hover:shadow-xl
        ${plan.isFeatured ? "shadow-2xl scale-[1.03]" : "bg-white/5 backdrop-blur-sm shadow-md"}
      `}
      style={{
        borderColor: plan.isFeatured ? accent : "rgba(255,255,255,0.12)",
        backgroundColor: plan.isFeatured ? `${accent}18` : undefined,
      }}
    >
      {/* Top accent bar */}
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: plan.isFeatured ? accent : "rgba(255,255,255,0.08)" }}
      />

      {/* Featured badge */}
      {plan.badgeText && (
        <div
          className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow"
          style={{ backgroundColor: accent }}
        >
          <Sparkles className="size-3" />
          {plan.badgeText}
        </div>
      )}

      <div className="p-6 flex flex-col gap-4 flex-1">
        {/* Name + price */}
        <div>
          <p className="font-bold text-white text-lg tracking-tight">{plan.name}</p>
          <div className="flex items-baseline gap-2 mt-1">
            {(() => {
              const [amt, period] = plan.price.split("/");
              return (
                <>
                  <span className="text-2xl font-extrabold" style={{ color: accent }}>{amt}</span>
                  {period && <span className="text-sm text-slate-400">/{period}</span>}
                </>
              );
            })()}
            {plan.regularPrice && (
              <span className="text-sm text-slate-500 line-through">{plan.regularPrice}</span>
            )}
          </div>
          {plan.regularPrice && (
            <p className="text-[11px] text-amber-400 font-medium mt-0.5">Introductory early bird price</p>
          )}
          {plan.targetAudience && (
            <p className="text-xs text-slate-400 mt-1 leading-snug">{plan.targetAudience}</p>
          )}
        </div>

        {plan.description && (
          <p className="text-sm text-slate-400 leading-relaxed">{plan.description}</p>
        )}

        {/* Features */}
        <ul className="space-y-2 flex-1">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
              <Check className="size-4 mt-0.5 shrink-0" style={{ color: accent }} />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ─── Plans Page ────────────────────────────────────────────────────────── */
export function PlansPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["public", "plans"],
    queryFn: () => planService.getPublicPlans(),
    staleTime: 5 * 60 * 1000,
  });
  const plans = data?.plans ?? [];

  const gridCols =
    plans.length === 1
      ? "grid-cols-1 max-w-sm mx-auto"
      : plans.length === 2
      ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"
      : plans.length === 3
      ? "grid-cols-1 sm:grid-cols-3 max-w-4xl mx-auto"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Login
        </button>
        <div className="flex items-center gap-2">
          <img src={logo} alt="AskIEP" className="h-7 w-7 object-contain" />
          <span className="text-white font-semibold text-sm">AskIEP</span>
        </div>
      </header>

      {/* Early Bird Banner */}
      <div className="mx-4 mt-6 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 px-6 py-4 text-center max-w-3xl sm:mx-auto">
        <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-sm mb-1">
          <Rocket className="size-4" />
          Launching July 4th, 2026
        </div>
        <p className="text-slate-300 text-sm">
          Lock in <span className="text-amber-400 font-semibold">early bird pricing</span> now — rates go up after launch.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-3 pt-3 border-t border-amber-500/20 text-sm">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Check className="size-4 text-green-400" />
            <span><span className="text-white font-semibold">1 month free</span> for early bird subscribers</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Check className="size-4 text-green-400" />
            <span><span className="text-white font-semibold">1 free expert consultation</span> call</span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="text-center pt-10 pb-10 px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5B5AF7]/15 border border-[#5B5AF7]/30 text-[#8887ff] text-xs font-medium mb-4">
          <LayoutList className="size-3.5" />
          Subscription Plans
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          Choose your plan
        </h1>
        <p className="mt-3 text-slate-400 text-lg max-w-xl mx-auto">
          Flexible pricing for every family. Cancel anytime.
        </p>
      </div>

      {/* Plan cards */}
      <main className="flex-1 px-4 pb-16">
        {isLoading ? (
          <div className={`grid gap-6 ${gridCols}`}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 rounded-2xl bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-24 text-slate-500">No plans available.</div>
        ) : (
          <div className={`grid gap-6 ${gridCols}`}>
            {plans.map((plan) => (
              <PricingCard key={plan.id} plan={plan} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center pb-8 text-xs text-slate-600">
        © {new Date().getFullYear()} AskIEP · All rights reserved
      </footer>
    </div>
  );
}
