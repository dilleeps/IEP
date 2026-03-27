import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/app/providers/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { planService, type PlanResponse } from "@/domain/admin/plans.service";
import { PageHeader } from "@/app/ui/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Crown,
  CreditCard,
  Check,
  Zap,
  Sparkles,
  ArrowRight,
  Receipt,
  Shield,
  Clock,
  Download,
  AlertTriangle,
  Rocket,
} from "lucide-react";
import { config } from "@/lib/config";

/* ─── Mock billing history (until real payment gateway) ─────────── */
const MOCK_INVOICES = [
  { id: "INV-001", date: "2025-01-15", description: "Informed Parent — Monthly", amount: "$0.00", status: "paid" as const },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/* ─── Billing period type ──────────────────────────────────────── */
type BillingMode = "monthly" | "yearly";

/* ─── Plan comparison card ──────────────────────────────────────── */
function PlanCard({
  plan,
  isCurrent,
  onUpgrade,
  billingMode,
}: {
  plan: PlanResponse;
  isCurrent: boolean;
  onUpgrade: () => void;
  billingMode: BillingMode;
}) {
  const color = plan.color ?? "#6B7280";
  const isYearly = billingMode === "yearly";
  const hasYearly = !!plan.yearlyPriceCents;

  // Determine display price and strikethrough based on billing mode
  const displayPrice = isYearly && hasYearly ? plan.yearlyMonthlyPrice ?? plan.price : plan.price;
  const strikethroughPrice = isYearly && hasYearly
    ? plan.yearlyRegularPrice
      ? (() => {
          const monthlyFromYearly = ((plan.yearlyRegularPriceCents ?? 0) / 100 / 12).toFixed(2);
          return `$${monthlyFromYearly}/month`;
        })()
      : undefined
    : plan.regularPrice;
  const yearlyTotal = isYearly && hasYearly ? plan.yearlyPrice : undefined;

  // Compute savings percentage for yearly
  const yearlySavingsPercent = isYearly && hasYearly && plan.priceCents > 0
    ? Math.round((1 - (plan.yearlyPriceCents! / (plan.priceCents * 12))) * 100)
    : 0;

  return (
    <Card
      className={`relative overflow-hidden transition-shadow hover:shadow-lg ${
        plan.isFeatured ? "ring-2" : "ring-1 ring-border"
      }`}
      style={plan.isFeatured ? { borderColor: color, boxShadow: `0 0 24px ${color}22` } : {}}
    >
      {/* Badge ribbon */}
      {(plan.badgeText || plan.isFeatured) && (
        <div
          className="absolute top-0 right-0 px-3 py-1.5 text-[11px] font-bold text-white rounded-bl-lg z-10"
          style={{ backgroundColor: plan.badgeText?.toLowerCase().includes("early") ? "#d97706" : color }}
        >
          {plan.badgeText?.toLowerCase().includes("early") ? (
            <Clock className="inline size-3 mr-1 -mt-0.5" />
          ) : (
            <Sparkles className="inline size-3 mr-1 -mt-0.5" />
          )}
          {isYearly && hasYearly && yearlySavingsPercent > 0
            ? `Save ${yearlySavingsPercent}% Yearly`
            : plan.badgeText ?? "Popular"
          }
        </div>
      )}

      {/* Early bird / savings badge for paid plans without badgeText */}
      {!plan.badgeText && plan.priceCents > 0 && (
        <div className="absolute top-0 right-0 px-3 py-1.5 text-[11px] font-bold text-white rounded-bl-lg z-10 bg-amber-600">
          <Clock className="inline size-3 mr-1 -mt-0.5" />
          {isYearly && hasYearly && yearlySavingsPercent > 0
            ? `Save ${yearlySavingsPercent}% Yearly`
            : "Early Bird Pricing"
          }
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-full" style={{ backgroundColor: color }} />
          <CardTitle className="text-lg">{plan.name}</CardTitle>
        </div>
        {plan.description && (
          <CardDescription className="text-xs mt-1">{plan.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Price */}
        <div>
          <div className="flex items-baseline gap-1">
            {(() => {
              const [amt, period] = displayPrice.split("/");
              return (
                <>
                  <span className="text-2xl font-extrabold" style={{ color }}>{amt}</span>
                  {period && (
                    <span className="text-sm font-medium text-muted-foreground">/{period}</span>
                  )}
                </>
              );
            })()}
            {strikethroughPrice && (
              <span className="text-sm text-muted-foreground line-through ml-1">
                {strikethroughPrice}
              </span>
            )}
          </div>
          {isYearly && yearlyTotal ? (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
              Billed as {yearlyTotal} annually
              {yearlySavingsPercent > 0 && ` — save ${yearlySavingsPercent}%`}
            </p>
          ) : strikethroughPrice ? (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
              Introductory early bird price
            </p>
          ) : null}
        </div>

        {/* Features */}
        <ul className="space-y-1.5">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Check className="size-4 mt-0.5 shrink-0 text-green-500" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        {isCurrent ? (
          <Badge className="w-full justify-center py-1.5 text-white" style={{ backgroundColor: color, border: "none" }}>
            Current Plan
          </Badge>
        ) : (
          <Button
            className="w-full"
            style={{ backgroundColor: color }}
            onClick={onUpgrade}
          >
            Upgrade <ArrowRight className="size-4 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Payment method placeholder card ───────────────────────────── */
function PaymentMethodCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="size-5 text-blue-500" />
          Payment Method
        </CardTitle>
        <CardDescription>Manage your payment methods</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center py-6 text-center gap-3">
          <div className="size-14 rounded-full bg-muted flex items-center justify-center">
            <CreditCard className="size-7 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">No payment method on file</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add a payment method when you're ready to upgrade.
            </p>
          </div>
          <Button variant="outline" size="sm" disabled>
            <CreditCard className="size-4 mr-1.5" /> Add Payment Method
          </Button>
          <p className="text-[11px] text-muted-foreground/60">
            <Shield className="inline size-3 mr-0.5 -mt-0.5" />
            Secured with 256-bit encryption. Payment integration coming soon.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Main page ─────────────────────────────────────────────────── */
export function SubscriptionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState("plans");
  const [billingMode, setBillingMode] = useState<BillingMode>("monthly");

  const { data: plansData, isLoading } = useQuery({
    queryKey: ["public", "plans"],
    queryFn: () => planService.getPublicPlans(),
    staleTime: 5 * 60_000,
  });

  const publicPlans = plansData?.plans ?? [];
  const currentPlanSlug = user?.subscriptionPlan ?? "informed_parent";
  const currentPlan = publicPlans.find((p) => p.slug === currentPlanSlug) ?? null;

  const goCheckout = (plan: PlanResponse) => {
    const path = config.routes.billingCheckout(plan.slug);
    navigate(billingMode === "yearly" ? `${path}?billing=yearly` : path);
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Subscription & Billing"
        description="Manage your plan, payment methods, and billing history"
      />

      {/* ── Current plan banner ────────────────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          <div
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl p-5"
            style={{
              borderLeft: `4px solid ${currentPlan?.color ?? "#6B7280"}`,
              background: `${currentPlan?.color ?? "#6B7280"}08`,
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="size-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${currentPlan?.color ?? "#6B7280"}20` }}
              >
                <Crown className="size-6" style={{ color: currentPlan?.color ?? "#6B7280" }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Current Plan</p>
                <p className="text-xl font-bold text-foreground">{currentPlan?.name ?? "Informed Parent"}</p>
                <p className="text-sm font-semibold" style={{ color: currentPlan?.color ?? "#6B7280" }}>
                  {currentPlan?.price ?? "$0/month"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                className="text-white text-xs px-3 py-1"
                style={{ backgroundColor: currentPlan?.color ?? "#6B7280", border: "none" }}
              >
                {currentPlanSlug === "informed_parent" ? "Free Tier" : "Active"}
              </Badge>
              {currentPlanSlug !== "informed_parent" && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  Renews monthly
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── July 4th Launch Banner ─────────────────────────────────── */}
      <div className="rounded-xl border-2 border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 px-5 py-4">
        <div className="flex items-center gap-4">
          <div className="size-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <Rocket className="size-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-foreground">
              Launching July 4th, 2026
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="text-amber-600 dark:text-amber-400 font-semibold">Early bird pricing available!</span>{" "}
              Lock in introductory rates before they go up at launch.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium shrink-0">
            <Clock className="size-3.5" />
            Limited time
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-amber-500/20 text-sm">
          <div className="flex items-center gap-2">
            <Check className="size-4 text-green-500 shrink-0" />
            <span className="text-muted-foreground"><span className="font-semibold text-foreground">1 month free</span> for early bird subscribers</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="size-4 text-green-500 shrink-0" />
            <span className="text-muted-foreground"><span className="font-semibold text-foreground">1 free expert consultation</span> call included</span>
          </div>
        </div>
      </div>

      {/* ── Tabbed content ─────────────────────────────────────────── */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="plans" className="gap-1.5">
            <Zap className="size-3.5" /> Plans
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-1.5">
            <CreditCard className="size-3.5" /> Payment
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <Receipt className="size-3.5" /> History
          </TabsTrigger>
        </TabsList>

        {/* ── Plans tab ──────────────────────────────────────────── */}
        <TabsContent value="plans" className="mt-4">
          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-72 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : publicPlans.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">No plans available.</div>
          ) : (
            <>
              {/* Monthly / Yearly toggle */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    billingMode === "monthly"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setBillingMode("monthly")}
                >
                  Monthly
                </button>
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    billingMode === "yearly"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setBillingMode("yearly")}
                >
                  Yearly
                  <span className="ml-1.5 text-[10px] font-bold bg-green-500 text-white px-1.5 py-0.5 rounded-full">
                    Save 17%
                  </span>
                </button>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {publicPlans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    isCurrent={plan.slug === currentPlanSlug}
                    onUpgrade={() => goCheckout(plan)}
                    billingMode={billingMode}
                  />
                ))}
              </div>

              {/* Current plan features */}
              {currentPlan && currentPlan.features.length > 0 && (
                <Card className="mt-5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Included in {currentPlan.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {currentPlan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="size-4 mt-0.5 shrink-0 text-green-500" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ── Payment tab ────────────────────────────────────────── */}
        <TabsContent value="payment" className="mt-4">
          <div className="grid gap-5 md:grid-cols-2">
            <PaymentMethodCard />

            {/* Billing information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Receipt className="size-5 text-emerald-500" />
                  Billing Information
                </CardTitle>
                <CardDescription>Your billing address and details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center py-6 text-center gap-3">
                  <div className="size-14 rounded-full bg-muted flex items-center justify-center">
                    <Receipt className="size-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No billing address saved</p>
                  <p className="text-xs text-muted-foreground">
                    Billing details will be collected during your first purchase.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── History tab ────────────────────────────────────────── */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Receipt className="size-5 text-violet-500" />
                    Billing History
                  </CardTitle>
                  <CardDescription>Your past invoices and receipts</CardDescription>
                </div>
                <Button variant="outline" size="sm" disabled>
                  <Download className="size-4 mr-1.5" /> Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {MOCK_INVOICES.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  No billing history yet.
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {MOCK_INVOICES.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                          <TableCell className="text-sm">{formatDate(inv.date)}</TableCell>
                          <TableCell className="text-sm">{inv.description}</TableCell>
                          <TableCell className="text-sm text-right font-medium">{inv.amount}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                              {inv.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <AlertTriangle className="size-4 text-amber-500 shrink-0" />
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Payment processing is not yet active. This is preview data only.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
