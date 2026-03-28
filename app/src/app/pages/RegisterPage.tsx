import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/app/providers/AuthProvider";
import { useLanguage } from "@/app/providers/LanguageProvider";
import { useNotification } from "@/hooks/useNotification";
import { ROLES, type Role } from "@/domain/auth/roles";
import { config } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { logger } from "@/lib/logger";
import { isPasswordValid, PASSWORD_MIN_LENGTH, PASSWORD_POLICY_MESSAGE } from "@/lib/passwordPolicy";

export function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>(ROLES.PARENT);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const { t } = useLanguage();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreedToTerms) {
      showError(t.register.acceptTerms);
      return;
    }

    if (password !== confirmPassword) {
      showError(t.register.passwordsDontMatch, t.register.passwordsDontMatchDesc);
      logger.warn("Password mismatch");
      return;
    }

    // Validate password requirements
    if (!isPasswordValid(password)) {
      showError(t.register.weakPassword, PASSWORD_POLICY_MESSAGE);
      return;
    }

    setIsLoading(true);

    try {
      let endpointOverride: string | undefined;
      if (role === ROLES.PARENT) endpointOverride = config.api.endpoints.auth.registerParent;
      if (role === ROLES.ADVOCATE) endpointOverride = config.api.endpoints.auth.registerAdvocate;
      if (role === ROLES.TEACHER_THERAPIST) endpointOverride = config.api.endpoints.auth.registerTeacher;

      await register({ email, password, displayName: name, role, endpointOverride });
      logger.info("Registration successful", { email });
      navigate(config.routes.login, { replace: true });
    } catch (error) {
      logger.error("Registration failed", { email, error });
      // Error notification handled in AuthProvider
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await loginWithGoogle();
      // Google OAuth auto-creates account as PARENT — go to dashboard (ConsentOverlay handles new users)
      navigate(config.routes.dashboard, { replace: true });
      logger.info("Google sign-up completed", { isNewUser: result.isNewUser });
    } catch (error) {
      logger.error("Google sign-up failed", { error });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t.register.title}</CardTitle>
          <CardDescription>
            {t.register.subtitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Google Sign-Up */}
          <Button
            type="button"
            variant="outline"
            disabled={isLoading || isGoogleLoading}
            onClick={handleGoogleSignUp}
            className="w-full h-12 mb-4"
          >
            <LogIn className="size-4 mr-2" />
            {isGoogleLoading ? "Connecting..." : "Continue with Google"}
          </Button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or register with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t.register.fullName}</Label>
              <Input
                id="name"
                type="text"
                placeholder={t.register.fullNamePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t.register.email}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t.register.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">{t.register.iAmA}</Label>
              <Select value={role} onValueChange={(value) => setRole(value as Role)} disabled={isLoading}>
                <SelectTrigger id="role">
                  <SelectValue placeholder={t.register.selectRole} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ROLES.PARENT}>{t.register.parent}</SelectItem>
                  <SelectItem value={ROLES.ADVOCATE}>{t.register.advocate}</SelectItem>
                  <SelectItem value={ROLES.TEACHER_THERAPIST}>{t.register.teacherTherapist}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t.register.roleNote}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t.register.password}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={PASSWORD_MIN_LENGTH}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium">{t.register.passwordMust}</p>
                <ul className="list-disc list-inside space-y-0.5 ml-1">
                  <li>{t.register.minLength}</li>
                  <li>{t.register.uppercase}</li>
                  <li>{t.register.lowercase}</li>
                  <li>{t.register.number}</li>
                </ul>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t.register.confirmPassword}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !agreedToTerms}>
              {isLoading ? t.register.creatingAccount : t.register.register}
            </Button>

            {/* Terms & Privacy consent */}
            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(v) => setAgreedToTerms(v === true)}
                disabled={isLoading}
                className="mt-0.5"
              />
              <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                {t.register.agreeTerms}{" "}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-2 hover:underline">
                  {t.register.termsOfService}
                </a>{" "}and{" "}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-2 hover:underline">
                  {t.register.privacyPolicy}
                </a>.
                {t.register.aiDisclaimer}
              </label>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              {t.register.alreadyHaveAccount}{" "}
              <Link to="/login" className="text-primary hover:underline">
                {t.register.signIn}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
