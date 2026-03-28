import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Clock,
  User,
  Video,
  CreditCard,
  CheckCircle2,
  XCircle,
  Hourglass,
  ExternalLink,
  MessageSquare,
  ChevronRight,
  Sparkles,
  Search,
  FilterX,
} from "lucide-react";
import { config } from "@/lib/config";
import { useAuth } from "@/app/providers/AuthProvider";
import { getCounselorDataService } from "@/domain/counselor/counselor.service";
import type {
  CounselorAppointmentItem,
  CounselorAppointmentStatus,
  CounselorPaymentStatus,
} from "@/domain/counselor/types";
import { useNotification } from "@/hooks/useNotification";

const TABS: { key: CounselorAppointmentStatus; label: string; icon: LucideIcon }[] = [
  { key: "REQUESTED", label: "Requested", icon: Hourglass },
  { key: "ACCEPTED", label: "Accepted", icon: CheckCircle2 },
  { key: "WAITLISTED", label: "Waitlisted", icon: Clock },
  { key: "COMPLETED", label: "Completed", icon: Sparkles },
];

const STATUS_BADGE: Record<CounselorAppointmentStatus, { label: string; className: string }> = {
  REQUESTED: { label: "Requested", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200" },
  ACCEPTED: { label: "Accepted", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200" },
  WAITLISTED: { label: "Waitlisted", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200" },
  COMPLETED: { label: "Completed", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200" },
  CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200" },
};

const PAYMENT_BADGE: Record<CounselorPaymentStatus, { label: string; className: string }> = {
  NOT_REQUIRED: { label: "Free", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200" },
  PENDING: { label: "Payment Pending", className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200" },
  PAID: { label: "Paid", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200" },
};

const MAX_MESSAGE_LENGTH = 2000;

function toIsoFromDateAndTime(date: string, time: string): string {
  return new Date(`${date}T${time}:00.000Z`).toISOString();
}

function getTodayDateInputValue(): string {
  const now = new Date();
  const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const offsetMs = localMidnight.getTimezoneOffset() * 60_000;
  return new Date(localMidnight.getTime() - offsetMs).toISOString().slice(0, 10);
}

function formatReadableSlot(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function slotFromIso(value: string): { date: string; time: string } {
  const iso = new Date(value).toISOString();
  return {
    date: iso.slice(0, 10),
    time: iso.slice(11, 16),
  };
}

function toCalendarDateTime(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function toGoogleCalendarUrl(appt: CounselorAppointmentItem): string | null {
  if (!appt.scheduledAt) return null;

  const start = new Date(appt.scheduledAt);
  const end = new Date(start.getTime() + appt.durationMinutes * 60 * 1000);
  const details = [
    `Counseling session for ${appt.childName}`,
    appt.counselorMessage ? `Counselor message: ${appt.counselorMessage}` : "",
    appt.notes ? `Notes: ${appt.notes}` : "",
  ].filter(Boolean).join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${appt.serviceName} - ${appt.childName}`,
    dates: `${toCalendarDateTime(start.toISOString())}/${toCalendarDateTime(end.toISOString())}`,
    details,
    location: appt.meetLink || "",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function AppointmentCard({ appt, onAccept, onWaitlist, onCancel, onReschedule, onCreateMeetLink, isUpdating }: {
  appt: CounselorAppointmentItem;
  onAccept?: (id: string) => void;
  onWaitlist?: (id: string) => void;
  onCancel?: (id: string) => void;
  onReschedule?: (appointment: CounselorAppointmentItem) => void;
  onCreateMeetLink?: (appointment: CounselorAppointmentItem) => void;
  isUpdating?: boolean;
}) {
  const status = STATUS_BADGE[appt.status];
  const effectivePaymentStatus: CounselorPaymentStatus = appt.status === 'CANCELLED' ? 'NOT_REQUIRED' : appt.paymentStatus;
  const payment = PAYMENT_BADGE[effectivePaymentStatus];

  const showMeetLink = appt.status === 'ACCEPTED' && !!appt.meetLink;
  const calendarUrl = appt.status === 'ACCEPTED' ? toGoogleCalendarUrl(appt) : null;

  return (
    <Card className="rounded-[20px] border border-border shadow-sm hover:shadow-md transition-all bg-card">
      <CardContent className="p-6 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-black text-sm">{appt.parentName}</span>
              <span className="text-xs text-muted-foreground">for {appt.childName}</span>
            </div>
            <p className="text-base font-bold text-foreground">{appt.serviceName}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge className={`text-xs font-bold border ${status.className}`}>{status.label}</Badge>
            <Badge className={`text-xs font-bold border ${payment.className}`}>
              <CreditCard className="w-3 h-3 mr-1" />
              {payment.label}
            </Badge>
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {appt.durationMinutes} min
          </span>
          {appt.scheduledAt && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {new Date(appt.scheduledAt).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          {!appt.scheduledAt && (
            <span className="flex items-center gap-1.5 text-amber-600">
              <Calendar className="w-4 h-4" />
              Time not scheduled yet
            </span>
          )}
        </div>

        {/* Notes */}
        {(appt.notes || appt.counselorMessage) && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted rounded-xl px-3 py-2">
            <MessageSquare className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="space-y-1">
              {appt.counselorMessage && <p><span className="font-semibold">Update to parent:</span> {appt.counselorMessage}</p>}
              {appt.notes && <p><span className="font-semibold">Parent notes:</span> {appt.notes}</p>}
            </div>
          </div>
        )}

        {/* Meet Link */}
        {showMeetLink && (
          <a
            href={appt.meetLink || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-bold text-teal-600 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-200 transition-colors"
          >
            <Video className="w-4 h-4" />
            Join Google Meet
            <ExternalLink className="w-3 h-3" />
          </a>
        )}

        {appt.status === "ACCEPTED" && appt.scheduledAt && !appt.meetLink && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCreateMeetLink?.(appt)}
            disabled={isUpdating}
            className="rounded-xl font-bold"
          >
            <Video className="w-4 h-4" />
            {isUpdating ? 'Creating...' : 'Create Meet Link'}
          </Button>
        )}

        {calendarUrl && (
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Add to Calendar
            <ExternalLink className="w-3 h-3" />
          </a>
        )}

        {/* Payment pending message */}
        {!config.isDevelopment && appt.status === "ACCEPTED" && appt.paymentStatus === "PENDING" && (
          <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 rounded-xl px-3 py-2">
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>Meet link will be shared once the client completes payment.</span>
          </div>
        )}

        {/* Actions */}
        {appt.status === "REQUESTED" && (
          <div className="flex gap-3 pt-1">
            <Button
              size="sm"
              onClick={() => onAccept?.(appt.id)}
              disabled={isUpdating}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onWaitlist?.(appt.id)}
              disabled={isUpdating}
              className="flex-1 rounded-xl font-bold"
            >
              <Hourglass className="w-4 h-4 mr-1.5" />
              Waitlist
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onCancel?.(appt.id)}
              disabled={isUpdating}
              className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <XCircle className="w-4 h-4" />
            </Button>
          </div>
        )}

        {appt.status !== "COMPLETED" && appt.status !== "CANCELLED" && (
          <Button
            size="sm"
            variant="outline"
            disabled={isUpdating}
            className="w-full rounded-xl"
            onClick={() => onReschedule?.(appt)}
          >
            Reschedule & Notify Parent
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function CounselorAppointmentsPage() {
  const { accessToken } = useAuth();
  const { showError, showSuccess } = useNotification();
  const navigate = useNavigate();
  const counselorDataService = getCounselorDataService();
  const [activeTab, setActiveTab] = useState<CounselorAppointmentStatus>("REQUESTED");
  const [appointments, setAppointments] = useState<CounselorAppointmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"ALL" | CounselorPaymentStatus>("ALL");
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [childFilter, setChildFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [editingAppointment, setEditingAppointment] = useState<CounselorAppointmentItem | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlot, setRescheduleSlot] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>([]);
  const [rescheduleDay, setRescheduleDay] = useState("");
  const [rescheduleMessage, setRescheduleMessage] = useState("");
  const [rescheduleError, setRescheduleError] = useState("");
  const [isLoadingRescheduleSlots, setIsLoadingRescheduleSlots] = useState(false);
  const minDate = getTodayDateInputValue();

  useEffect(() => {
    if (!accessToken) {
      setAppointments([]);
      return;
    }

    let active = true;
    setIsLoading(true);

    counselorDataService
      .listAppointments(accessToken)
      .then((items) => {
        if (!active) return;
        setAppointments(items);
      })
      .catch((error) => {
        if (!active) return;
        showError("Failed to load appointments", error instanceof Error ? error.message : "Please try again.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken, counselorDataService, showError]);

  useEffect(() => {
    if (!accessToken || !editingAppointment || !rescheduleDate || !editingAppointment.counselorServiceId) {
      setRescheduleSlots([]);
      setRescheduleSlot("");
      setRescheduleDay("");
      return;
    }

    let active = true;
    setIsLoadingRescheduleSlots(true);
    setRescheduleError("");

    if (rescheduleDate < minDate) {
      setRescheduleSlots([]);
      setRescheduleSlot("");
      setRescheduleDay("");
      setRescheduleError("Please choose today or a future date.");
      setIsLoadingRescheduleSlots(false);
      return;
    }

    counselorDataService
      .listCatalogSlots(accessToken, editingAppointment.counselorServiceId, rescheduleDate)
      .then((response) => {
        if (!active) return;
        setRescheduleDay(response.day);
        setRescheduleSlots(response.availableSlots);
        setRescheduleSlot((current) => (
          response.availableSlots.includes(current) ? current : (response.availableSlots[0] || "")
        ));
      })
      .catch((error) => {
        if (!active) return;
        setRescheduleSlots([]);
        showError("Failed to load slots", error instanceof Error ? error.message : "Please try again.");
      })
      .finally(() => {
        if (active) {
          setIsLoadingRescheduleSlots(false);
        }
      });

    return () => {
      active = false;
    };
  }, [accessToken, counselorDataService, editingAppointment, minDate, rescheduleDate, showError]);

  const filtered = useMemo(() => {
    return appointments
      .filter((item) => item.status === activeTab)
      .filter((item) => {
        if (paymentFilter !== "ALL" && item.paymentStatus !== paymentFilter) return false;
        if (serviceFilter !== "ALL" && item.serviceName !== serviceFilter) return false;
        if (childFilter !== "ALL" && item.childName !== childFilter) return false;

        if (fromDate || toDate) {
          if (!item.scheduledAt) return false;
          const appointmentDate = item.scheduledAt.slice(0, 10);
          if (fromDate && appointmentDate < fromDate) return false;
          if (toDate && appointmentDate > toDate) return false;
        }

        const query = search.trim().toLowerCase();
        if (!query) return true;

        const haystack = [item.parentName, item.childName, item.serviceName, item.notes, item.counselorMessage]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(query);
      });
  }, [appointments, activeTab, paymentFilter, serviceFilter, childFilter, fromDate, toDate, search]);

  const serviceOptions = useMemo(
    () => Array.from(new Set(appointments.map((item) => item.serviceName))).sort((a, b) => a.localeCompare(b)),
    [appointments],
  );
  const childOptions = useMemo(
    () => Array.from(new Set(appointments.map((item) => item.childName))).sort((a, b) => a.localeCompare(b)),
    [appointments],
  );

  const updateStatus = async (id: string, status: CounselorAppointmentStatus) => {
    if (!accessToken) {
      showError("Unable to update appointment", "You are not authenticated.");
      return;
    }

    setUpdatingIds((prev) => ({ ...prev, [id]: true }));

    try {
      const updated = await counselorDataService.updateAppointmentStatus(accessToken, id, { status });
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));

      if (status === "ACCEPTED") {
        showSuccess("Appointment accepted", "The booking request has been accepted.");
      } else if (status === "WAITLISTED") {
        showSuccess("Moved to waitlist", "The booking has been moved to your waitlist.");
      } else if (status === "CANCELLED") {
        showSuccess("Appointment cancelled", "The booking request has been cancelled.");
      }
    } catch (error) {
      showError("Failed to update appointment", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setUpdatingIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleAccept = (id: string) => updateStatus(id, "ACCEPTED");
  const handleWaitlist = (id: string) => updateStatus(id, "WAITLISTED");
  const handleCancel = (id: string) => updateStatus(id, "CANCELLED");

  const handleCreateMeetLink = async (appointment: CounselorAppointmentItem) => {
    if (!accessToken) {
      showError('Unable to create meet link', 'You are not authenticated.');
      return;
    }

    setUpdatingIds((prev) => ({ ...prev, [appointment.id]: true }));
    try {
      const updated = await counselorDataService.createAppointmentMeetLink(accessToken, appointment.id);
      setAppointments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      showSuccess('Meet link created', 'Saved to appointment. Parent and counselor can now join using the same link.');
    } catch (error) {
      const errorCode = (error as { data?: { code?: string } } | undefined)?.data?.code;
      if (errorCode === 'GOOGLE_OAUTH_NOT_CONFIGURED') {
        showError('Google Meet not available', 'Google Calendar integration is not configured in this environment. Meet links cannot be created.');
      } else if (errorCode === 'MEET_LINK_NOT_AVAILABLE') {
        try {
          const connect = await counselorDataService.getGoogleConnectUrl(accessToken);
          window.open(connect.url, '_blank', 'noopener,noreferrer');
          showError('Google connection required', 'Opened Google connect page. Complete it, then try again.');
        } catch {
          showError('Google connection required', 'Connect your Google Calendar in Profile settings to generate a Meet link.');
        }
      } else {
        showError('Failed to create meet link', error instanceof Error ? error.message : 'Please try again.');
      }
    } finally {
      setUpdatingIds((prev) => {
        const next = { ...prev };
        delete next[appointment.id];
        return next;
      });
    }
  };

  const openRescheduleDialog = (appointment: CounselorAppointmentItem) => {
    setEditingAppointment(appointment);
    if (appointment.scheduledAt) {
      const parsed = slotFromIso(appointment.scheduledAt);
      setRescheduleDate(parsed.date);
      setRescheduleSlot(parsed.time);
    } else {
      setRescheduleDate("");
      setRescheduleSlot("");
    }
    setRescheduleMessage(appointment.counselorMessage || "");
    setRescheduleError("");
  };

  const closeRescheduleDialog = () => {
    if (isLoadingRescheduleSlots) return;
    setEditingAppointment(null);
    setRescheduleDate("");
    setRescheduleSlot("");
    setRescheduleSlots([]);
    setRescheduleDay("");
    setRescheduleMessage("");
    setRescheduleError("");
  };

  const handleRescheduleAndNotify = async () => {
    if (!accessToken || !editingAppointment) return;

    if (!rescheduleDate) {
      setRescheduleError("Please select a date.");
      return;
    }
    if (rescheduleDate < minDate) {
      setRescheduleError("Please choose today or a future date.");
      return;
    }
    if (!rescheduleSlot) {
      setRescheduleError("Please select a time slot.");
      return;
    }
    if (!rescheduleSlots.includes(rescheduleSlot)) {
      setRescheduleError("Selected slot is no longer available.");
      return;
    }
    if (rescheduleMessage.trim().length < 3) {
      setRescheduleError("Add a short message so the parent understands the schedule change.");
      return;
    }
    if (rescheduleMessage.trim().length > MAX_MESSAGE_LENGTH) {
      setRescheduleError(`Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`);
      return;
    }

    setRescheduleError("");
    setUpdatingIds((prev) => ({ ...prev, [editingAppointment.id]: true }));

    try {
      const updated = await counselorDataService.updateAppointment(accessToken, editingAppointment.id, {
        status: "ACCEPTED",
        scheduledAt: toIsoFromDateAndTime(rescheduleDate, rescheduleSlot),
        counselorMessage: rescheduleMessage.trim(),
      });
      setAppointments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      closeRescheduleDialog();
      showSuccess("Schedule updated", "Parent will see the new slot and your message in their dashboard.");
    } catch (error) {
      showError("Failed to reschedule", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setUpdatingIds((prev) => {
        const next = { ...prev };
        delete next[editingAppointment.id];
        return next;
      });
    }
  };

  const resetFilters = () => {
    setSearch("");
    setPaymentFilter("ALL");
    setServiceFilter("ALL");
    setChildFilter("ALL");
    setFromDate("");
    setToDate("");
  };

  return (
    <div className="space-y-6 p-4 md:p-6 pb-20">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 text-white p-7 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-teal-500/20 blur-[80px] rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold uppercase tracking-widest text-teal-200 mb-2">
              <Calendar className="w-3.5 h-3.5" /> Appointments
            </div>
            <h2 className="text-2xl md:text-3xl font-black">Your Bookings</h2>
            <p className="text-teal-100/70 text-sm">
              Review requests, manage your schedule, and track payment status.
            </p>
          </div>
          <div className="flex gap-4">
            {TABS.map((tab) => {
              const count = appointments.filter((a) => a.status === tab.key).length;
              return count > 0 ? (
                <div key={tab.key} className="text-center">
                  <p className="text-2xl font-black">{count}</p>
                  <p className="text-xs text-teal-200 font-bold uppercase tracking-widest">{tab.label}</p>
                </div>
              ) : null;
            })}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((tab) => {
          const count = appointments.filter((a) => a.status === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                activeTab === tab.key
                  ? "bg-foreground text-background border-foreground shadow-md"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {count > 0 && (
                <span
                  className={`text-xs rounded-full px-1.5 py-0.5 font-black ${
                    activeTab === tab.key ? "bg-background/20" : "bg-muted-foreground/20"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card/70 p-3 md:p-4 space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative w-full md:max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-10 pl-9 rounded-xl"
              placeholder="Search parent, child, service, notes"
            />
          </div>
          <div className="w-full md:w-56">
            <Select value={paymentFilter} onValueChange={(value) => setPaymentFilter(value as "ALL" | CounselorPaymentStatus)}>
              <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Payment" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All payments</SelectItem>
                <SelectItem value="NOT_REQUIRED">Free</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="rounded-xl" onClick={resetFilters}>
            <FilterX className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Service" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All services</SelectItem>
              {serviceOptions.map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={childFilter} onValueChange={setChildFilter}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Child" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All children</SelectItem>
              {childOptions.map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="rounded-xl" />
          <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="rounded-xl" />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground font-semibold">
          Loading appointments...
        </div>
      ) : (
      <>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <p className="text-lg font-black text-muted-foreground">No {activeTab.toLowerCase()} appointments</p>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            {activeTab === "REQUESTED"
              ? "New booking requests from parents will appear here."
              : activeTab === "ACCEPTED"
              ? "Appointments you've accepted will show here."
              : activeTab === "WAITLISTED"
              ? "Clients on your waitlist will appear here."
              : "Completed sessions will be recorded here."}
          </p>
          {activeTab === "REQUESTED" && (
            <Button variant="outline" onClick={() => navigate("/counselor/availability")} className="rounded-xl">
              <ChevronRight className="w-4 h-4 mr-2" />
              Set Availability to Get Bookings
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map((appt) => (
            <AppointmentCard
              key={appt.id}
              appt={appt}
              onAccept={handleAccept}
              onWaitlist={handleWaitlist}
              onCancel={handleCancel}
              onReschedule={openRescheduleDialog}
              onCreateMeetLink={handleCreateMeetLink}
              isUpdating={!!updatingIds[appt.id]}
            />
          ))}
        </div>
      )}
      </>
      )}

      <Dialog open={!!editingAppointment} onOpenChange={(open) => { if (!open) closeRescheduleDialog(); }}>
        <DialogContent className="sm:max-w-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Reschedule and Notify Parent</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl border border-border p-3 bg-muted/30">
              <p className="font-bold">{editingAppointment?.serviceName}</p>
              <p className="text-sm text-muted-foreground">{editingAppointment?.parentName} · {editingAppointment?.childName}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={rescheduleDate}
                  min={minDate}
                  onChange={(event) => {
                    setRescheduleDate(event.target.value);
                    setRescheduleSlot("");
                  }}
                  className="rounded-xl"
                />
                {rescheduleDay && <p className="text-xs text-muted-foreground">Selected day: {rescheduleDay}</p>}
              </div>
              <div className="space-y-2">
                <Label>Available Slots</Label>
                {isLoadingRescheduleSlots ? (
                  <div className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">Loading slots...</div>
                ) : rescheduleDate && rescheduleSlots.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">No slots available on this date. Please choose another date.</div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                    {rescheduleSlots.map((slot) => (
                      <Button
                        key={slot}
                        type="button"
                        variant={rescheduleSlot === slot ? "default" : "outline"}
                        className="rounded-xl"
                        onClick={() => setRescheduleSlot(slot)}
                      >
                        {formatReadableSlot(slot)}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Message to Parent</Label>
              <Textarea
                rows={4}
                value={rescheduleMessage}
                onChange={(event) => setRescheduleMessage(event.target.value)}
                maxLength={MAX_MESSAGE_LENGTH}
                className="rounded-xl"
                placeholder="Example: I moved this to a slot where we have a full 60-minute window available."
              />
              <p className="text-xs text-muted-foreground text-right">{rescheduleMessage.length}/{MAX_MESSAGE_LENGTH}</p>
            </div>

            {rescheduleError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {rescheduleError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={closeRescheduleDialog}>Cancel</Button>
            <Button className="rounded-xl font-bold" onClick={handleRescheduleAndNotify}>
              Save and Notify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

