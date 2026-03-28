import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/app/providers/AuthProvider";
import { useLanguage } from "@/app/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { logger } from "@/lib/logger";
import { config } from "@/lib/config";
import logo from "@/logo.png";
import {
  AtSign,
  KeyRound,
  LogIn,
  Eye,
  EyeOff,
  LayoutList,
} from "lucide-react";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { t } = useLanguage();
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await login({ email, password });
      const nextPath = searchParams.get("next")
        || (result.needsOnboarding ? "/iep/analyse?welcome=1" : config.routes.dashboard);
      navigate(nextPath, { replace: true });
    } catch (error) {
      logger.error("Login failed", { error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await loginWithGoogle();
      // New users: ConsentOverlay handles redirect after consent
      // Existing users: dashboard detects no children and redirects to onboarding
      const nextPath = searchParams.get("next") || config.routes.dashboard;
      navigate(nextPath, { replace: true });

      logger.info("Google sign-in completed", { requiresSetup: result.requiresSetup });
    } catch (error) {
      logger.error("Google sign-in failed", { error });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="w-full rounded-[32px] bg-white text-slate-900 shadow-2xl">

          {/* HEADER */}
          <CardHeader className="pt-5 pb-1 text-center">
            <div className="mx-auto mb-4 flex h-[52px] w-[52px] items-center justify-center">
              <img src={logo} alt="AskIEP Logo" className="h-[52px] w-[52px] object-contain" />
            </div>

            <CardTitle className="text-[26px] font-semibold text-slate-800">
              {t.login.title}
            </CardTitle>

            <p className="mt-1 text-[15px] text-slate-500">
              {t.login.subtitle}
            </p>
          </CardHeader>

          {/* CONTENT */}
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* EMAIL */}
              <div className="space-y-2">
                <Label className="text-xs tracking-wider text-slate-500">
                  {t.login.email}
                </Label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    type="email"
                    placeholder={t.login.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading || isGoogleLoading}
                    className="pl-9 h-12 rounded-2xl bg-slate-100 border-none
                               !text-slate-900 caret-slate-900
                               placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div className="space-y-2">
                <Label className="text-xs tracking-wider text-slate-500">
                  {t.login.password}
                </Label>

                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />

                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading || isGoogleLoading}
                    className="pl-9 pr-10 h-12 rounded-2xl bg-slate-100 border-none
                               !text-slate-900 caret-slate-900"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    disabled={isLoading || isGoogleLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2
                               text-slate-400 hover:text-slate-600
                               focus:outline-none"
                    aria-label={showPassword ? t.login.hidePassword : t.login.showPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* DEV MODE */}
              {config.isDevelopment && (
                <div className="rounded-2xl bg-slate-900 p-3 text-xs text-slate-300">
                  <p className="mb-1 font-medium text-slate-200">
                    {t.login.devModeAccounts}
                  </p>
                  <ul className="space-y-1">
                    <li>parent@askiep.com</li>
                    <li>advocate@askiep.com</li>
                    <li>teacher@askiep.com</li>
                    <li>counselor@askiep.com</li>
                    <li>admin@askiep.com</li>
                  <li className="italic">Password: Demo123</li>
                </ul>
              </div>
              )}

              <Button
                type="button"
                variant="outline"
                disabled={isLoading || isGoogleLoading}
                onClick={handleGoogleLogin}
                className="w-full h-12 rounded-2xl border-slate-200 bg-white text-slate-800"
              >
                <LogIn className="size-4" />
                {isGoogleLoading ? t.login.connectingToGoogle : t.login.continueWithGoogle}
              </Button>

              {/* SUBMIT BUTTON */}
              <Button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full h-14 rounded-2xl bg-[#5B5AF7]
                           hover:bg-[#4A49E8] text-white text-base
                           shadow-[0_10px_28px_rgba(91,90,247,0.45)]
                           flex items-center justify-center gap-2"
              >
                <LogIn className="size-4" />
                {isLoading ? t.login.authenticating : t.login.authenticate}
              </Button>

              {/* Register link */}
              <p className="text-center text-sm text-slate-500">
                {t.login.noAccount}{" "}
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="font-medium text-[#5B5AF7] hover:underline"
                >
                  {t.login.createAccount}
                </button>
              </p>

              {/* View Plans button */}
              <button
                type="button"
                onClick={() => navigate("/plans")}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-slate-400 hover:text-[#5B5AF7] transition-colors"
              >
                <LayoutList className="size-4" />
                View subscription plans
              </button>

            </form>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} AskIEP · All rights reserved
      </div>
    </div>
  );
}
