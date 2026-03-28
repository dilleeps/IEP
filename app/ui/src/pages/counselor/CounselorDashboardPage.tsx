import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/app/providers/AuthProvider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getCounselorDataService } from "@/domain/counselor/counselor.service";
import type { CounselorAppointmentItem } from "@/domain/counselor/types";
import { useNotification } from "@/hooks/useNotification";
import {
  Sparkles,
  Calendar,
  Briefcase,
  UserCircle,
  Clock,
  CheckCircle2,
  Users,
  AlertTriangle,
  ChevronRight,
  Video,
  CalendarPlus,
} from "lucide-react";

export function CounselorDashboardPage() {
  const { user, accessToken } = useAuth();
  const { showError } = useNotification();
  const navigate = useNavigate();
  const counselorDataService = getCounselorDataService();

  const [appointments, setAppointments] = useState<CounselorAppointmentItem[]>([]);
  const [hasServices, setHasServices] = useState(false);
  const [hasAvailability, setHasAvailability] = useState(false);
  const [isPaymentConfigured, setIsPaymentConfigured] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    let active = true;

    Promise.all([
      counselorDataService.listServices(accessToken),
      counselorDataService.listAvailability(accessToken),
      counselorDataService.getProfile(accessToken),
      counselorDataService.listAppointments(accessToken),
    ])
      .then(([services, windows, profile, appointmentItems]) => {
        if (!active) return;
        setHasServices(services.length > 0);
        setHasAvailability(windows.length > 0);
        setIsPaymentConfigured(profile.paymentEnabled);
        setAppointments(appointmentItems);
      })
      .catch((error) => {
        if (!active) return;
        showError("Failed to load counselor dashboard", error instanceof Error ? error.message : "Please try again.");
      });

    return () => {
      active = false;
    };
  }, [accessToken, counselorDataService, showError]);

  const visibleAppointments = useMemo(
    () => (accessToken ? appointments : []),
    [accessToken, appointments],
  );
  const visibleHasServices = accessToken ? hasServices : false;
  const visibleHasAvailability = accessToken ? hasAvailability : false;
  const visiblePaymentConfigured = accessToken ? isPaymentConfigured : false;

  const stats = useMemo(() => {
    const now = new Date();
    const todayKey = now.toDateString();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const acceptedToday = visibleAppointments.filter((item) => {
      if (item.status !== "ACCEPTED" || !item.scheduledAt) return false;
      return new Date(item.scheduledAt).toDateString() === todayKey;
    }).length;

    const completedThisWeek = visibleAppointments.filter((item) => {
      if (item.status !== "COMPLETED" || !item.scheduledAt) return false;
      return new Date(item.scheduledAt) >= weekAgo;
    }).length;

    const totalClients = new Set(
      visibleAppointments
        .map((item) => `${item.parentName}::${item.childName}`)
        .filter(Boolean),
    ).size;

    return {
      pendingRequests: visibleAppointments.filter((item) => item.status === "REQUESTED").length,
      acceptedToday,
      completedThisWeek,
      totalClients,
    };
  }, [visibleAppointments]);

  return (
    <div className="space-y-10 p-4 md:p-6 pb-12">
      {/* Setup Alerts */}
      {(!visibleHasServices || !visibleHasAvailability || !visiblePaymentConfigured) && (
        <div className="space-y-3">
          {!visibleHasServices && (
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="flex items-center justify-between gap-4">
                <span className="text-amber-800 dark:text-amber-300 font-medium">
                  You haven't added any services yet. Parents can't book you until you define what you offer.
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate("/counselor/services")}
                  className="shrink-0 border-amber-400 text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40"
                >
                  Add Services
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {!visibleHasAvailability && (
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="flex items-center justify-between gap-4">
                <span className="text-blue-800 dark:text-blue-300 font-medium">
                  Your availability isn't set. Set your weekly schedule so parents can see when you're free.
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate("/counselor/availability")}
                  className="shrink-0 border-blue-400 text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/40"
                >
                  Set Availability
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {!visiblePaymentConfigured && (
            <Alert className="border-violet-200 bg-violet-50 dark:bg-violet-950/20 dark:border-violet-800">
              <AlertTriangle className="h-4 w-4 text-violet-600" />
              <AlertDescription className="flex items-center justify-between gap-4">
                <span className="text-violet-800 dark:text-violet-300 font-medium">
                  Payment is not configured. You can still accept appointments, but you won't be able to collect fees.
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate("/counselor/profile")}
                  className="shrink-0 border-violet-400 text-violet-700 hover:bg-violet-100 dark:text-violet-300 dark:hover:bg-violet-900/40"
                >
                  Configure Profile
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[32px] md:rounded-[40px] bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-8 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-indigo-500/30 blur-[110px] rounded-full" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-teal-500/20 blur-[90px] rounded-full" />

        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold uppercase tracking-widest text-teal-200">
            <Sparkles className="w-3.5 h-3.5" /> Counselor Hub
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-black leading-tight">
              Welcome,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-blue-200">
                {user?.displayName?.split(" ")[0] || "Counselor"}
              </span>
              .
            </h2>
            <p className="text-indigo-100/80 text-lg leading-relaxed">
              Manage your appointments, set your schedule, and support families navigating the IEP process — all from one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => navigate("/counselor/appointments")}
              size="lg"
              className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black hover:bg-teal-50 transition-all flex items-center gap-2 shadow-lg hover:scale-[1.02] active:scale-95"
            >
              <Calendar className="w-5 h-5 text-teal-600" />
              View Appointments
            </Button>
            <Button
              onClick={() => navigate("/counselor/availability")}
              size="lg"
              variant="outline"
              className="border-white/20 text-white px-8 py-4 rounded-2xl font-black hover:bg-white/5 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-95"
            >
              <CalendarPlus className="w-5 h-5" />
              Manage Availability
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Pending Requests",
            value: stats.pendingRequests,
            icon: Clock,
            color: "text-amber-500",
            bg: "bg-amber-50 dark:bg-amber-950/20",
            onClick: () => navigate("/counselor/appointments"),
          },
          {
            label: "Accepted Today",
            value: stats.acceptedToday,
            icon: CheckCircle2,
            color: "text-emerald-500",
            bg: "bg-emerald-50 dark:bg-emerald-950/20",
            onClick: () => navigate("/counselor/appointments"),
          },
          {
            label: "Completed This Week",
            value: stats.completedThisWeek,
            icon: Video,
            color: "text-blue-500",
            bg: "bg-blue-50 dark:bg-blue-950/20",
            onClick: () => navigate("/counselor/appointments"),
          },
          {
            label: "Total Clients",
            value: stats.totalClients,
            icon: Users,
            color: "text-violet-500",
            bg: "bg-violet-50 dark:bg-violet-950/20",
            onClick: () => navigate("/counselor/appointments"),
          },
        ].map((stat, i) => (
          <button
            key={i}
            onClick={stat.onClick}
            className={`group text-left p-6 rounded-[24px] border border-border shadow-sm hover:shadow-md transition-all ${stat.bg}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-white dark:bg-slate-800 shadow-sm`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-3xl font-black text-foreground">{stat.value}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-2xl font-black text-foreground tracking-tight mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Appointments",
              description: "Review booking requests, accept or waitlist clients, and manage your schedule.",
              icon: Calendar,
              iconColor: "text-teal-600",
              iconBg: "bg-teal-50 dark:bg-slate-800",
              hoverBorder: "hover:border-teal-100 dark:hover:border-teal-400/40",
              actionColor: "text-teal-600",
              actionText: "View Appointments",
              path: "/counselor/appointments",
            },
            {
              title: "Availability",
              description: "Set your weekly schedule — morning, afternoon, or evening windows per day.",
              icon: CalendarPlus,
              iconColor: "text-blue-600",
              iconBg: "bg-blue-50 dark:bg-slate-800",
              hoverBorder: "hover:border-blue-100 dark:hover:border-blue-400/40",
              actionColor: "text-blue-600",
              actionText: "Edit Schedule",
              path: "/counselor/availability",
            },
            {
              title: "Services",
              description: "Define what you offer — counseling types, session lengths, and pricing.",
              icon: Briefcase,
              iconColor: "text-violet-600",
              iconBg: "bg-violet-50 dark:bg-slate-800",
              hoverBorder: "hover:border-violet-100 dark:hover:border-violet-400/40",
              actionColor: "text-violet-600",
              actionText: "Manage Services",
              path: "/counselor/services",
            },
            {
              title: "My Profile",
              description: "Update your bio, specializations, and connect your Google account for Meet links.",
              icon: UserCircle,
              iconColor: "text-indigo-600",
              iconBg: "bg-indigo-50 dark:bg-slate-800",
              hoverBorder: "hover:border-indigo-100 dark:hover:border-indigo-400/40",
              actionColor: "text-indigo-600",
              actionText: "Edit Profile",
              path: "/counselor/profile",
            },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => navigate(item.path)}
              className={`group relative bg-card text-card-foreground p-8 rounded-[28px] border border-border shadow-sm hover:shadow-xl ${item.hoverBorder} transition-all text-left overflow-hidden`}
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <item.icon className="w-24 h-24 text-foreground" />
              </div>
              <div className={`w-12 h-12 ${item.iconBg} rounded-2xl flex items-center justify-center mb-6 ${item.iconColor} group-hover:bg-current/10 transition-colors`}>
                <item.icon className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-black mb-2">{item.title}</h4>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">{item.description}</p>
              <div className={`flex items-center gap-2 ${item.actionColor} font-bold text-sm`}>
                {item.actionText} <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Google Meet Info Card */}
      <Card className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-[28px] p-8 text-white relative overflow-hidden shadow-xl shadow-teal-100 dark:shadow-teal-900/40 border-0">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
            <Video className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-black mb-1">Google Meet Auto-Generation</h4>
            <p className="text-teal-100/80 text-sm leading-relaxed">
              When you accept an appointment, a Google Meet link is automatically created and will be shared with the client once payment is confirmed. No manual link sharing needed.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
