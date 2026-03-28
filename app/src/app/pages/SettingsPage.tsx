import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/app/providers/AuthProvider";
import { useTheme } from "@/app/providers/ThemeProvider";
import { useLanguage } from "@/app/providers/LanguageProvider";
import { useNotification } from "@/hooks/useNotification";
import { useQuery } from "@tanstack/react-query";
import { getSettingsService } from "@/domain/settings/settings.service";
import type { UserPreferences } from "@/domain/settings/types";
import { planService } from "@/domain/admin/plans.service";
import { PageHeader } from "@/app/ui/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { User, AlertTriangle, Bell, Mail, Sun, Moon, Monitor, Edit, Lock, Eye, EyeOff, Globe, Languages, Check, CreditCard, Crown, Zap, Sparkles, ArrowRight } from "lucide-react";
import { config } from "@/lib/config";
import { logger } from "@/lib/logger";
import { isPasswordValid, PASSWORD_POLICY_MESSAGE } from "@/lib/passwordPolicy";

export function SettingsPage() {
  const { user, accessToken, updateProfile, changePassword } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { showSuccess, showError } = useNotification();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);

  // Subscription state
  const navigate = useNavigate();

  const { data: plansData } = useQuery({
    queryKey: ['public', 'plans'],
    queryFn: () => planService.getPublicPlans(),
    staleTime: 5 * 60 * 1000,
    enabled: user?.role === 'PARENT',
  });
  const publicPlans = plansData?.plans ?? [];
  const currentPlanSlug = user?.subscriptionPlan ?? 'informed_parent';
  const currentPlan = publicPlans.find((p) => p.slug === currentPlanSlug) ?? null;

  // Profile edit state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password change state
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!user || !accessToken) return;

    const loadPreferences = async () => {
      try {
        const service = getSettingsService();
        const prefs = await service.getPreferences(accessToken);
        setPreferences(prefs);
        logger.debug("User preferences loaded");
      } catch (error) {
        logger.error("Error loading preferences", { error });
      } finally {
        setIsLoadingPrefs(false);
      }
    };

    loadPreferences();
  }, [user]);

  const openEditProfile = () => {
    if (user) {
      setEditDisplayName(user.displayName);
      setEditEmail(user.email);
      setIsEditProfileOpen(true);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    setIsUpdatingProfile(true);
    try {
      const updates: { displayName?: string; email?: string } = {};
      
      if (editDisplayName !== user.displayName) {
        updates.displayName = editDisplayName;
      }
      
      if (editEmail !== user.email) {
        updates.email = editEmail;
      }

      if (Object.keys(updates).length === 0) {
        showError(t.settings.noChanges, t.settings.noChangesDesc);
        setIsEditProfileOpen(false);
        return;
      }

      await updateProfile(updates);
      setIsEditProfileOpen(false);
    } catch (error) {
      // Error is handled in AuthProvider
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showError(t.settings.passwordsDontMatch, t.settings.passwordsDontMatchDesc);
      return;
    }

    if (!isPasswordValid(newPassword)) {
      showError('Weak password', PASSWORD_POLICY_MESSAGE);
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setIsChangePasswordOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      // Error is handled in AuthProvider
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleToggleNotifications = async () => {
    if (!user || !accessToken || !preferences) return;

    try {
      const service = getSettingsService();
      const updated = await service.updatePreferences(accessToken, {
        notifications: !preferences.notifications,
      });
      setPreferences(updated);
      showSuccess(t.settings.preferencesUpdated, t.settings.notificationSettings);
      logger.info("Notifications toggled", { enabled: updated.notifications });
    } catch (error) {
      logger.error("Error updating preferences", { error });
    }
  };

  const handleToggleEmailUpdates = async () => {
    if (!user || !accessToken || !preferences) return;

    try {
      const service = getSettingsService();
      const updated = await service.updatePreferences(accessToken, {
        emailUpdates: !preferences.emailUpdates,
      });
      setPreferences(updated);
      showSuccess(t.settings.preferencesUpdated, t.settings.emailSettings);
      logger.info("Email updates toggled", { enabled: updated.emailUpdates });
    } catch (error) {
      logger.error("Error updating preferences", { error });
    }
  };

  // Removed IndexedDB reset: no longer applicable with API-backed data

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title={t.settings.title}
        description={t.settings.subtitle}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t.settings.profileInfo}
              </CardTitle>
              <CardDescription>{t.settings.accountDetails}</CardDescription>
            </div>
            <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={openEditProfile}>
                  <Edit className="h-4 w-4 mr-0.5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t.settings.editProfile}</DialogTitle>
                  <DialogDescription>{t.settings.editProfileDesc}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">{t.settings.displayName}</Label>
                    <Input
                      id="edit-name"
                      value={editDisplayName}
                      onChange={(e) => setEditDisplayName(e.target.value)}
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">{t.settings.emailAddress}</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditProfileOpen(false)} disabled={isUpdatingProfile}>
                    {t.common.cancel}
                  </Button>
                  <Button onClick={handleUpdateProfile} disabled={isUpdatingProfile}>
                    {isUpdatingProfile ? t.settings.saving : t.settings.saveChanges}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{t.settings.name}</Label>
              <p className="text-sm font-medium">{user?.displayName}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{t.settings.email}</Label>
              <p className="text-sm font-medium">{user?.email}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{t.settings.role}</Label>
              <p className="text-sm font-medium">{user?.role.replace("_", " ")}</p>
            </div>
          </div>
          <div className="pt-4">
            <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Lock className="h-4 w-4 mr-2" />
                  {t.settings.changePassword}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t.settings.changePassword}</DialogTitle>
                  <DialogDescription>{t.settings.changePasswordDesc}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">{t.settings.currentPassword}</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">{t.settings.newPassword}</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">{t.settings.confirmNewPassword}</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsChangePasswordOpen(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    disabled={isChangingPassword}
                  >
                    {t.common.cancel}
                  </Button>
                  <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                    {isChangingPassword ? t.settings.changing : t.settings.changePassword}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.settings.preferences}</CardTitle>
          <CardDescription>{t.settings.customizeExperience}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingPrefs ? (
            <p className="text-sm text-muted-foreground">{t.common.loading}</p>
          ) : (
            <>
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5 flex-1">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    {t.settings.notifications}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {preferences?.notifications ? t.common.enabled : t.common.disabled}
                  </p>
                </div>
                <Button
                  variant={preferences?.notifications ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleNotifications}
                >
                  {preferences?.notifications ? t.common.enabled : t.common.disabled}
                </Button>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5 flex-1">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {t.settings.emailUpdates}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {preferences?.emailUpdates ? t.common.enabled : t.common.disabled}
                  </p>
                </div>
                <Button
                  variant={preferences?.emailUpdates ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleEmailUpdates}
                >
                  {preferences?.emailUpdates ? t.common.enabled : t.common.disabled}
                </Button>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5 flex-1">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    {t.settings.theme}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {theme === "auto"
                      ? t.settings.followingSystem
                      : t.settings.usingMode.replace("{mode}", theme)}
                  </p>
                </div>

                <div className="flex items-center gap-1 rounded-lg border bg-muted p-1">
                  <Button
                    variant={theme === "light" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setTheme("light")}
                    className="px-3"
                  >
                    <Sun className="h-4 w-4" />
                  </Button>

                  <Button
                    variant={theme === "dark" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setTheme("dark")}
                    className="px-3"
                  >
                    <Moon className="h-4 w-4" />
                  </Button>

                  <Button
                    variant={theme === "auto" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setTheme("auto")}
                    className="px-3"
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5 flex-1">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Languages className="h-4 w-4" />
                    {t.settings.language}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {language === "en" ? "English" : "Español"}
                  </p>
                </div>

                <div className="flex items-center gap-1 rounded-lg border bg-muted p-1">
                  <Button
                    variant={language === "en" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setLanguage("en")}
                    className="px-3 text-xs font-semibold"
                  >
                    EN
                  </Button>

                  <Button
                    variant={language === "es" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setLanguage("es")}
                    className="px-3 text-xs font-semibold"
                  >
                    ES
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ─── Subscription & Billing (PARENT only) ─────────────────────── */}
      {user?.role === 'PARENT' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Subscription &amp; Billing
            </CardTitle>
            <CardDescription>Your current plan and billing management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current plan banner */}
            <div
              className="flex items-center justify-between rounded-xl border-2 p-4"
              style={{ borderColor: currentPlan?.color ?? '#6B7280', background: `${currentPlan?.color ?? '#6B7280'}18` }}
            >
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Current Plan</p>
                <p className="font-bold text-lg text-foreground">{currentPlan?.name ?? 'Informed Parent'}</p>
                <p className="text-sm font-semibold" style={{ color: currentPlan?.color ?? '#6B7280' }}>
                  {currentPlan?.price ?? '$0/month'}
                </p>
              </div>
              <Badge
                className="text-white text-xs"
                style={{ backgroundColor: currentPlan?.color ?? '#6B7280', border: 'none' }}
              >
                {currentPlanSlug === 'informed_parent' ? 'Free Tier' : 'Active'}
              </Badge>
            </div>

            {/* Current plan features (top 4) */}
            {currentPlan && currentPlan.features.length > 0 && (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {currentPlan.features.slice(0, 4).map((f, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-sm text-foreground">
                    <Check className="size-3.5 mt-0.5 shrink-0 text-green-500" />
                    {f}
                  </li>
                ))}
                {currentPlan.features.length > 4 && (
                  <li className="text-xs text-muted-foreground">+{currentPlan.features.length - 4} more</li>
                )}
              </ul>
            )}

            <Button
              className="w-full"
              variant="outline"
              onClick={() => navigate(config.routes.billing)}
            >
              <CreditCard className="size-4 mr-2" />
              Manage Subscription & Billing
              <ArrowRight className="size-4 ml-auto" />
            </Button>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
