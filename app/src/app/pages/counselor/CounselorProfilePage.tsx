import { useEffect, useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Edit,
  Video,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Globe,
  Award,
  Bell,
  Monitor,
  Sun,
  Moon,
} from "lucide-react";
import { getCounselorDataService } from "@/domain/counselor/counselor.service";
import { useNotification } from "@/hooks/useNotification";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { getSettingsService } from "@/domain/settings/settings.service";
import type { UserPreferences } from "@/domain/settings/types";
import { useTheme } from "@/app/providers/ThemeProvider";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Phoenix",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
];

const SPECIALIZATION_OPTIONS = [
  "IEP Advocacy",
  "Special Education Law",
  "Autism Spectrum",
  "ADHD Support",
  "Learning Disabilities",
  "Behavioral Supports",
  "Parent Coaching",
  "Transition Planning",
  "Early Intervention",
];

export function CounselorProfilePage() {
  const { user, accessToken, updateProfile } = useAuth();
  const { showError, showSuccess } = useNotification();
  const { theme, setTheme } = useTheme();
  const counselorDataService = getCounselorDataService();

  // Profile form state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState(user?.displayName || "");
  const [editBio, setEditBio] = useState("");
  const [editTimezone, setEditTimezone] = useState("America/New_York");
  const [editCredentials, setEditCredentials] = useState("");
  const [editSpecializations, setEditSpecializations] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [bio, setBio] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [credentials, setCredentials] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isPaymentConfigured, setIsPaymentConfigured] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const googleStatus = search.get('google');
    if (googleStatus === 'connected') {
      showSuccess('Google connected', 'Calendar and Meet auto-creation is now enabled.');
      search.delete('google');
      const next = search.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${next ? `?${next}` : ''}`);
    }
    if (googleStatus === 'failed') {
      showError('Google connection failed', 'Please try connecting your Google account again.');
      search.delete('google');
      const next = search.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${next ? `?${next}` : ''}`);
    }
  }, [showError, showSuccess]);

  useEffect(() => {
    if (!accessToken) return;
    let active = true;

    setIsLoading(true);
    counselorDataService
      .getProfile(accessToken)
      .then((profile) => {
        if (!active) return;
        setBio(profile.bio || "");
        setTimezone(profile.timezone || "America/New_York");
        setCredentials(profile.credentials || "");
        setSpecializations(profile.specializations || []);
        setIsGoogleConnected(!!profile.googleConnected);
        setIsPaymentConfigured(!!profile.paymentEnabled);
      })
      .catch((error) => {
        if (!active) return;
        showError("Failed to load profile", error instanceof Error ? error.message : "Please try again.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken, counselorDataService, showError]);

  useEffect(() => {
    if (!accessToken) return;
    let active = true;

    setIsLoadingPrefs(true);
    getSettingsService()
      .getPreferences(accessToken)
      .then((prefs) => {
        if (!active) return;
        setPreferences(prefs);
      })
      .catch((error) => {
        if (!active) return;
        showError("Failed to load preferences", error instanceof Error ? error.message : "Please try again.");
      })
      .finally(() => {
        if (active) setIsLoadingPrefs(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken, showError]);

  const openEdit = () => {
    setEditDisplayName(user?.displayName || "");
    setEditBio(bio);
    setEditTimezone(timezone);
    setEditCredentials(credentials);
    setEditSpecializations([...specializations]);
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    if (!accessToken) {
      showError("Unable to save profile", "You are not authenticated.");
      return;
    }

    setIsSaving(true);
    try {
      if (editDisplayName !== user?.displayName) {
        await updateProfile({ displayName: editDisplayName });
      }

      const saved = await counselorDataService.updateProfile(accessToken, {
        bio: editBio,
        timezone: editTimezone,
        credentials: editCredentials,
        specializations: [...editSpecializations],
      });

      setBio(saved.bio || "");
      setTimezone(saved.timezone || "America/New_York");
      setCredentials(saved.credentials || "");
      setSpecializations(saved.specializations || []);
      setIsGoogleConnected(!!saved.googleConnected);
      setIsPaymentConfigured(!!saved.paymentEnabled);
      setIsEditOpen(false);
      showSuccess("Profile updated", "Your counselor profile has been saved.");
    } catch (error) {
      showError("Failed to save profile", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSpecialization = (s: string) => {
    setEditSpecializations((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const togglePreference = async (key: "notifications" | "emailUpdates") => {
    if (!accessToken || !preferences) return;

    try {
      const updated = await getSettingsService().updatePreferences(accessToken, {
        [key]: !preferences[key],
      });
      setPreferences(updated);
      showSuccess("Preferences updated", "Your preference has been saved.");
    } catch (error) {
      showError("Failed to update preferences", error instanceof Error ? error.message : "Please try again.");
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-6 pb-20">
      {isLoading && (
        <div className="rounded-[20px] border border-border bg-card p-4 text-sm font-medium text-muted-foreground">
          Loading profile...
        </div>
      )}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 rounded-xl">
          <TabsTrigger value="profile" className="font-bold">Profile</TabsTrigger>
          <TabsTrigger value="preferences" className="font-bold">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-8">
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-8 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-indigo-500/30 blur-[110px] rounded-full" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-72 h-72 bg-teal-500/20 blur-[80px] rounded-full" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-[24px] bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center shadow-xl shrink-0">
            <span className="text-3xl font-black text-white">
              {(user?.displayName || "?")[0].toUpperCase()}
            </span>
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold uppercase tracking-widest text-teal-200">
                <Sparkles className="w-3.5 h-3.5" /> Counselor
              </div>
              {user?.status === "active" ? (
                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
                </Badge>
              ) : (
                <Badge className="bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" /> Pending Approval
                </Badge>
              )}
            </div>
            <h2 className="text-3xl md:text-4xl font-black">
              {user?.displayName || "Your Name"}
            </h2>
            <p className="text-indigo-100/70 text-sm flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {user?.email}
            </p>
            {bio && (
              <p className="text-indigo-100/80 text-sm max-w-xl leading-relaxed">{bio}</p>
            )}
          </div>

          <Button
            onClick={openEdit}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 rounded-xl font-bold shrink-0"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        {/* Specializations */}
        {specializations.length > 0 && (
          <div className="relative z-10 mt-6 flex flex-wrap gap-2">
            {specializations.map((s) => (
              <Badge
                key={s}
                className="bg-white/10 text-white border-white/20 font-medium text-xs"
              >
                {s}
              </Badge>
            ))}
          </div>
        )}
      </section>

      {/* Info Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Credentials */}
        <Card className="rounded-[20px] border border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" /> Credentials
            </CardTitle>
          </CardHeader>
          <CardContent>
            {credentials ? (
              <p className="text-sm font-medium text-foreground">{credentials}</p>
            ) : (
              <p className="text-xs text-muted-foreground italic">No credentials added yet</p>
            )}
          </CardContent>
        </Card>

        {/* Timezone */}
        <Card className="rounded-[20px] border border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500" /> Timezone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-foreground">{timezone}</p>
          </CardContent>
        </Card>

        {/* Role */}
        <Card className="rounded-[20px] border border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-foreground">Counselor</p>
            <p className="text-xs text-muted-foreground mt-1">{user?.status || "Unknown"} status</p>
          </CardContent>
        </Card>
      </div>

      {/* Google Meet Integration */}
      <Card className="rounded-[24px] border border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                <Video className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base font-black">Google Meet Integration</CardTitle>
                <CardDescription>Auto-generate Meet links when appointments are accepted</CardDescription>
              </div>
            </div>
            {isGoogleConnected ? (
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 font-bold">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Connected
              </Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 font-bold">
                <AlertTriangle className="w-3 h-3 mr-1" /> Not Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isGoogleConnected ? (
            <div className="flex items-center gap-3 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              Google sign-in is active. Meet links and calendar sync are enabled automatically when available.
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Sign in with Google to automatically enable calendar and meet capabilities. Manual connect is not required.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      </TabsContent>

      <TabsContent value="preferences" className="space-y-6">
        <Card className="rounded-[24px] border border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-black">Preferences</CardTitle>
            <CardDescription>Customize notifications and appearance for your counselor account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingPrefs ? (
              <p className="text-sm text-muted-foreground">Loading preferences...</p>
            ) : (
              <>
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5 flex-1">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Notifications
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {preferences?.notifications ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                  <Button
                    variant={preferences?.notifications ? "default" : "outline"}
                    size="sm"
                    onClick={() => togglePreference("notifications")}
                  >
                    {preferences?.notifications ? "Enabled" : "Disabled"}
                  </Button>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5 flex-1">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Updates
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {preferences?.emailUpdates ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                  <Button
                    variant={preferences?.emailUpdates ? "default" : "outline"}
                    size="sm"
                    onClick={() => togglePreference("emailUpdates")}
                  >
                    {preferences?.emailUpdates ? "Enabled" : "Disabled"}
                  </Button>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5 flex-1">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Theme
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {theme === "auto" ? "Following system preference" : `Using ${theme} mode`}
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
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      </Tabs>

      {/* Payment Configuration */}
      <Card className="rounded-[24px] border border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-base font-black">Payment Configuration</CardTitle>
                <CardDescription>Accept fees from parents through the platform</CardDescription>
              </div>
            </div>
            {isPaymentConfigured ? (
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 font-bold">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Configured
              </Badge>
            ) : (
              <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-0 font-bold">
                Not Set Up
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect a payment processor to collect fees from parents before releasing Google Meet links. Services marked as "Free" do not require payment setup.
          </p>
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300">
            <strong>Coming Soon:</strong> Payment integration via Stripe / Razorpay will be available here. For now, you can mark services as Free or coordinate payment outside the platform.
          </div>
          <Button
            variant="outline"
            className="rounded-xl font-bold"
            disabled
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Set Up Payment — Coming Soon
          </Button>
        </CardContent>
      </Card>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                placeholder="Your full name"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Professional Bio</Label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Tell parents about your background and approach..."
                rows={3}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Credentials / Certifications</Label>
              <Input
                value={editCredentials}
                onChange={(e) => setEditCredentials(e.target.value)}
                placeholder="e.g. M.Ed., Board Certified Advocate"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={editTimezone} onValueChange={setEditTimezone}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Specializations</Label>
              <div className="flex flex-wrap gap-2">
                {SPECIALIZATION_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSpecialization(s)}
                    className={`text-xs font-bold px-3 py-1 rounded-full border transition-all ${
                      editSpecializations.includes(s)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-muted text-muted-foreground border-border hover:border-indigo-400"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              disabled={isSaving}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !editDisplayName} className="rounded-xl">
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
