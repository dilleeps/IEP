import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/app/providers/AuthProvider";
import { useNotification } from "@/hooks/useNotification";
import { planService, type PlanResponse } from "@/domain/admin/plans.service";
import { PageHeader } from "@/app/ui/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Lock,
  Shield,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { config } from "@/lib/config";

type PayStep = "form" | "review" | "processing" | "success";

/* ─── Order summary sidebar ─────────────────────────────────────── */
function OrderSummary({ plan, isYearly }: { plan: PlanResponse; isYearly: boolean }) {
  const color = plan.color ?? "#6B7280";
  const hasYearly = !!plan.yearlyPriceCents;
  const useYearly = isYearly && hasYearly;

  const displayPrice = useYearly ? (plan.yearlyPrice ?? plan.price) : plan.price;
  const billingLabel = useYearly ? "Billed annually" : `Billed ${plan.billingPeriod ?? "month"}ly`;

  return (
    <Card className="sticky top-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Plan info */}
        <div
          className="rounded-xl p-4 space-y-2"
          style={{ background: `${color}10`, border: `1px solid ${color}30` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="font-semibold text-sm">{plan.name}</span>
            </div>
            {plan.isFeatured && (
              <Badge className="text-[10px] text-white" style={{ backgroundColor: color, border: "none" }}>
                <Sparkles className="size-2.5 mr-0.5" /> Popular
              </Badge>
            )}
          </div>
          {plan.description && (
            <p className="text-xs text-muted-foreground">{plan.description}</p>
          )}
        </div>

        {/* Features */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">What's included</p>
          <ul className="space-y-1">
            {plan.features.slice(0, 6).map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <Check className="size-3.5 mt-0.5 shrink-0 text-green-500" />
                <span>{f}</span>
              </li>
            ))}
            {plan.features.length > 6 && (
              <li className="text-xs text-muted-foreground pl-5">
                +{plan.features.length - 6} more features
              </li>
            )}
          </ul>
        </div>

        {/* Price breakdown */}
        <div className="border-t pt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{displayPrice}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span className="text-muted-foreground">$0.00</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-bold text-base">
            <span>Total</span>
            <span style={{ color }}>{displayPrice}</span>
          </div>
          {useYearly && plan.yearlyMonthlyPrice && (
            <p className="text-[11px] text-green-600 dark:text-green-400 text-center font-medium">
              {plan.yearlyMonthlyPrice} per month
            </p>
          )}
          <p className="text-[11px] text-muted-foreground text-center">
            {billingLabel} · Cancel anytime
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Success view ──────────────────────────────────────────────── */
function SuccessView({ plan, onDone }: { plan: PlanResponse; onDone: () => void }) {
  const color = plan.color ?? "#6B7280";

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto gap-6">
      <div
        className="size-20 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${color}20` }}
      >
        <Check className="size-10" style={{ color }} />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-foreground">You're all set! 🎉</h2>
        <p className="text-muted-foreground mt-2">
          Your upgrade to <strong>{plan.name}</strong> has been recorded.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Payment integration will be activated when billing credentials are configured.
          You can start using your new features immediately.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={onDone}>
          View Billing
        </Button>
        <Button style={{ backgroundColor: color }} onClick={() => window.location.assign(config.routes.dashboard)}>
          Go to Dashboard <ChevronRight className="size-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

/* ─── Processing overlay ────────────────────────────────────────── */
function ProcessingView({ plan }: { plan: PlanResponse }) {
  const color = plan.color ?? "#6B7280";

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
      <div className="relative">
        <div
          className="size-16 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: `${color}30`, borderTopColor: color }}
        />
      </div>
      <div>
        <p className="font-semibold text-foreground">Processing your upgrade…</p>
        <p className="text-sm text-muted-foreground mt-1">This will only take a moment.</p>
      </div>
    </div>
  );
}

/* ─── Main checkout page ────────────────────────────────────────── */
export function PaymentCheckoutPage() {
  const { planSlug } = useParams<{ planSlug: string }>();
  const [searchParams] = useSearchParams();
  const isYearly = searchParams.get("billing") === "yearly";
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError } = useNotification();
  const [step, setStep] = useState<PayStep>("form");

  const [card, setCard] = useState({
    name: "",
    number: "",
    expiry: "",
    cvv: "",
  });
  const [billingEmail, setBillingEmail] = useState(user?.email ?? "");

  const { data: plansData, isLoading } = useQuery({
    queryKey: ["public", "plans"],
    queryFn: () => planService.getPublicPlans(),
    staleTime: 5 * 60_000,
  });

  const plans = plansData?.plans ?? [];
  const plan = plans.find((p) => p.slug === planSlug) ?? null;
  const color = plan?.color ?? "#6B7280";

  const goBack = () => navigate(config.routes.billing);

  const validateForm = (): boolean => {
    if (!card.name.trim()) {
      showError("Missing field", "Please enter the cardholder name.");
      return false;
    }
    if (card.number.replace(/\s/g, "").length < 15) {
      showError("Invalid card", "Please enter a valid card number.");
      return false;
    }
    if (!/^\d{2}\/\d{2}$/.test(card.expiry)) {
      showError("Invalid expiry", "Enter expiry as MM/YY.");
      return false;
    }
    if (card.cvv.length < 3) {
      showError("Invalid CVV", "Please enter a valid CVV.");
      return false;
    }
    if (!billingEmail.includes("@")) {
      showError("Invalid email", "Please enter a valid billing email.");
      return false;
    }
    return true;
  };

  const handleReview = () => {
    if (!validateForm()) return;
    setStep("review");
  };

  const handlePay = () => {
    setStep("processing");
    // Simulate processing delay
    setTimeout(() => setStep("success"), 2200);
  };

  /* ── Loading / not found states ─────────────────────────────── */
  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="h-96 bg-muted animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-center py-20">
        <p className="text-lg text-muted-foreground">Plan not found.</p>
        <Button variant="outline" className="mt-4" onClick={goBack}>
          <ArrowLeft className="size-4 mr-1.5" /> Back to Billing
        </Button>
      </div>
    );
  }

  /* ── Success state ──────────────────────────────────────────── */
  if (step === "success") {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <SuccessView plan={plan} onDone={goBack} />
      </div>
    );
  }

  /* ── Processing state ───────────────────────────────────────── */
  if (step === "processing") {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <ProcessingView plan={plan} />
      </div>
    );
  }

  /* ── Form / Review states ───────────────────────────────────── */
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader
        title={step === "review" ? "Review & Pay" : `Upgrade to ${plan.name}`}
        description={step === "review" ? "Confirm your details before payment" : "Complete your purchase securely"}
      />

      <Button variant="ghost" size="sm" className="gap-1.5 -mt-2" onClick={goBack}>
        <ArrowLeft className="size-4" /> Back to Billing
      </Button>

      <div className="grid gap-6 lg:grid-cols-[1fr,360px]">
        {/* Left column — form or review */}
        <div className="space-y-5">
          {step === "form" ? (
            <>
              {/* Card details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="size-5" style={{ color }} />
                    Payment Details
                  </CardTitle>
                  <CardDescription>
                    <Shield className="inline size-3 mr-0.5 -mt-0.5" />
                    All transactions are secured with 256-bit SSL encryption
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="card-name">Cardholder Name</Label>
                    <Input
                      id="card-name"
                      placeholder="Jane Smith"
                      value={card.name}
                      onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="card-number">Card Number</Label>
                    <div className="relative">
                      <Input
                        id="card-number"
                        placeholder="4242 4242 4242 4242"
                        maxLength={19}
                        value={card.number}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                          setCard((c) => ({
                            ...c,
                            number: v.replace(/(\d{4})/g, "$1 ").trim(),
                          }));
                        }}
                        className="pr-12"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <div className="size-6 rounded bg-blue-600 text-white text-[8px] font-bold flex items-center justify-center">
                          VISA
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="card-expiry">Expiry Date</Label>
                      <Input
                        id="card-expiry"
                        placeholder="MM/YY"
                        maxLength={5}
                        value={card.expiry}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                          setCard((c) => ({
                            ...c,
                            expiry: v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v,
                          }));
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="card-cvv">CVV</Label>
                      <Input
                        id="card-cvv"
                        placeholder="123"
                        maxLength={4}
                        type="password"
                        value={card.cvv}
                        onChange={(e) =>
                          setCard((c) => ({
                            ...c,
                            cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
                          }))
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Billing email */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Billing Contact</CardTitle>
                  <CardDescription>Receipt will be sent to this email</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="billing-email">Email Address</Label>
                    <Input
                      id="billing-email"
                      type="email"
                      placeholder="you@example.com"
                      value={billingEmail}
                      onChange={(e) => setBillingEmail(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Button className="w-full h-11 text-base" style={{ backgroundColor: color }} onClick={handleReview}>
                <Lock className="size-4 mr-2" />
                Review Order
              </Button>
            </>
          ) : (
            /* ── Review step ─────────────────────────────────────── */
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Review Your Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Cardholder</p>
                      <p className="text-sm font-medium">{card.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Card Number</p>
                      <p className="text-sm font-medium font-mono">
                        •••• •••• •••• {card.number.replace(/\s/g, "").slice(-4)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Expiry</p>
                      <p className="text-sm font-medium">{card.expiry}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Billing Email</p>
                      <p className="text-sm font-medium">{billingEmail}</p>
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" onClick={() => setStep("form")}>
                    <ArrowLeft className="size-3.5 mr-1" /> Edit Details
                  </Button>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-3">
                <Button className="w-full h-12 text-base font-semibold" style={{ backgroundColor: color }} onClick={handlePay}>
                  <CreditCard className="size-5 mr-2" />
                  Pay {isYearly && plan.yearlyPrice ? plan.yearlyPrice : plan.price}
                </Button>
                <p className="text-center text-[11px] text-muted-foreground">
                  <Lock className="inline size-3 mr-0.5 -mt-0.5" />
                  🚧 Mock payment — no charge will be made. Payment gateway activation coming soon.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Right column — order summary */}
        <div className="hidden lg:block">
          <OrderSummary plan={plan} isYearly={isYearly} />
        </div>

        {/* Mobile order summary (collapsed) */}
        <div className="lg:hidden">
          <OrderSummary plan={plan} isYearly={isYearly} />
        </div>
      </div>
    </div>
  );
}
