import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/app/providers/AuthProvider';
import { getChildService } from '@/domain/child/child.service';
import type { Child } from '@/domain/child/types';
import { getCounselorDataService } from '@/domain/counselor/counselor.service';
import type {
  CounselorAppointmentItem,
  CounselorAppointmentStatus,
  CounselorCatalogServiceItem,
  CounselorDirectoryItem,
  CounselorPaymentSession,
  CounselorPaymentStatus,
} from '@/domain/counselor/types';
import { getIEPService } from '@/domain/iep/iep.service';
import type { DocumentListItem, ExtractionResponse } from '@/domain/iep/types';
import { useNotification } from '@/hooks/useNotification';
import {
  AlertTriangle, Bell, Calendar, CheckCircle2,
  ChevronLeft, ChevronRight,
  Clock, CreditCard, ExternalLink, FileSearch, Info,
  Search, Upload, UserCircle, Video,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_NOTES_LENGTH = 2000;
const MAX_SUPPORTING_FILES = 10;
const MAX_SUPPORTING_FILE_SIZE = 10 * 1024 * 1024;
const REMINDER_WINDOW_HOURS = 48;
const BOOKING_STEPS = ['Select Child', 'Pick Date & Time', 'Review & Submit'] as const;

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

const STATUS_BADGE: Record<CounselorAppointmentStatus, string> = {
  REQUESTED: 'bg-amber-100 text-amber-800 border-amber-200',
  ACCEPTED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  WAITLISTED: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETED: 'bg-slate-100 text-slate-700 border-slate-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
};

const STATUS_LABEL: Record<CounselorAppointmentStatus, string> = {
  REQUESTED: 'Pending Review',
  ACCEPTED: 'Confirmed',
  WAITLISTED: 'Waitlisted',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const PAYMENT_BADGE: Record<CounselorPaymentStatus, string> = {
  NOT_REQUIRED: 'bg-slate-100 text-slate-700 border-slate-200',
  PENDING: 'bg-orange-100 text-orange-800 border-orange-200',
  PAID: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

// ─── Utilities ────────────────────────────────────────────────────────────────
function formatPrice(cents: number | null): string {
  if (cents === null) return 'Free';
  return `$${(cents / 100).toFixed(2)}`;
}

/** Combines a YYYY-MM-DD date with a UTC HH:mm slot into a full ISO string */
function toIsoFromDateAndSlot(date: string, slot: string): string {
  return new Date(`${date}T${slot}:00.000Z`).toISOString();
}

function getLocalTodayYMD(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function formatReadableSlot(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setUTCHours(h, m, 0, 0);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
}

function formatScheduled(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function formatCountdown(targetMs: number): string {
  const diff = Math.max(0, targetMs - Date.now());
  const totalMin = Math.floor(diff / 60_000);
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  if (hours > 0) return `in ${hours}h ${minutes}m`;
  if (minutes > 0) return `in ${minutes}m`;
  return 'starting now';
}

function slotFromIso(value: string): { date: string; time: string } {
  const iso = new Date(value).toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
}

function toCalendarDateTime(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function toGoogleCalendarUrl(appointment: CounselorAppointmentItem): string | null {
  if (!appointment.scheduledAt) return null;
  const start = new Date(appointment.scheduledAt);
  const end = new Date(start.getTime() + appointment.durationMinutes * 60_000);
  const details = [
    `Session for ${appointment.childName}`,
    appointment.counselorMessage ? `Counselor message: ${appointment.counselorMessage}` : '',
    appointment.notes ? `Notes: ${appointment.notes}` : '',
  ].filter(Boolean).join('\n');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${appointment.serviceName} - ${appointment.childName}`,
    dates: `${toCalendarDateTime(start.toISOString())}/${toCalendarDateTime(end.toISOString())}`,
    details,
    location: appointment.meetLink || '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function groupSlotsByPeriod(slots: string[]): { label: string; slots: string[] }[] {
  const morning: string[] = [], afternoon: string[] = [], evening: string[] = [];
  for (const s of slots) {
    const h = Number(s.split(':')[0]);
    if (h < 12) morning.push(s);
    else if (h < 17) afternoon.push(s);
    else evening.push(s);
  }
  return [
    { label: 'Morning', slots: morning },
    { label: 'Afternoon', slots: afternoon },
    { label: 'Evening', slots: evening },
  ].filter((g) => g.slots.length > 0);
}

function supportFileValidationError(file: File): string | null {
  if (file.size > MAX_SUPPORTING_FILE_SIZE) return `${file.name} is larger than 10 MB.`;
  return null;
}

// ─── Step-level validation ─────────────────────────────────────────────────
function validateStep1(childId: string, children: Child[]): string | null {
  if (!childId) return 'Please select a child before continuing.';
  if (!children.find((c) => c.id === childId)) return 'Selected child is not valid.';
  return null;
}

function validateStep2(date: string, slot: string, availableSlots: string[], today: string): string | null {
  if (!date) return 'Please pick a date.';
  if (date < today) return 'Date cannot be in the past.';
  if (!slot) return 'Please select a time slot.';
  if (!availableSlots.includes(slot)) return 'Selected slot is no longer available — please pick another.';
  return null;
}

function validateStep3(notes: string, files: File[]): string | null {
  if (notes.trim().length > MAX_NOTES_LENGTH) return `Notes cannot exceed ${MAX_NOTES_LENGTH} characters.`;
  if (files.length > MAX_SUPPORTING_FILES) return `You can upload up to ${MAX_SUPPORTING_FILES} files.`;
  const fe = files.map(supportFileValidationError).find(Boolean);
  if (fe) return fe!;
  return null;
}

// ─── CalendarGrid — month view ─────────────────────────────────────────────
interface CalendarGridProps {
  year: number;
  month: number; // 0-indexed
  today: string; // YYYY-MM-DD
  selectedDate: string;
  onSelectDate: (ymd: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

function CalendarGrid({ year, month, today, selectedDate, onSelectDate, onPrevMonth, onNextMonth }: CalendarGridProps) {
  const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const now = new Date();
  const isPrevDisabled = year === now.getFullYear() && month === now.getMonth();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-3">
        <Button size="icon" variant="ghost" className="rounded-full h-8 w-8" onClick={onPrevMonth} disabled={isPrevDisabled}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="font-bold text-sm">{MONTHS[month]} {year}</span>
        <Button size="icon" variant="ghost" className="rounded-full h-8 w-8" onClick={onNextMonth}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} />;
          const ymd = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isPast = ymd < today;
          const isToday = ymd === today;
          const isSelected = ymd === selectedDate;
          return (
            <button
              key={ymd}
              type="button"
              disabled={isPast}
              onClick={() => !isPast && onSelectDate(ymd)}
              className={[
                'rounded-lg py-1.5 text-sm font-medium transition-colors',
                isPast ? 'text-muted-foreground/40 cursor-not-allowed' : 'hover:bg-primary/10 cursor-pointer',
                isSelected ? 'bg-primary text-primary-foreground hover:bg-primary' : '',
                isToday && !isSelected ? 'ring-2 ring-primary ring-offset-1' : '',
              ].join(' ')}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── SlotGrid — time slots with period grouping ────────────────────────────
interface SlotGridProps {
  slots: string[];
  selected: string;
  onSelect: (s: string) => void;
  isLoading: boolean;
  date: string;
}

function SlotGrid({ slots, selected, onSelect, isLoading, date }: SlotGridProps) {
  if (!date) {
    return (
      <div className="flex flex-col items-center justify-center min-h-40 gap-2 text-muted-foreground text-sm">
        <Calendar className="w-8 h-8 opacity-30" />
        <p>Select a date to see available times</p>
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-40 gap-2 text-muted-foreground text-sm">
        <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
        <p>Loading available times…</p>
      </div>
    );
  }
  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-40 gap-2 text-muted-foreground text-sm">
        <Info className="w-6 h-6 opacity-50" />
        <p className="font-medium">No slots available</p>
        <p className="text-xs">Pick a different date</p>
      </div>
    );
  }
  return (
    <div className="space-y-3 overflow-y-auto max-h-64 pr-1">
      <div className="flex flex-wrap gap-1.5">
        {slots.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSelect(s)}
            className={[
              'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
              selected === s
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'border-border hover:border-primary hover:bg-primary/5 text-foreground',
            ].join(' ')}
          >
            {formatReadableSlot(s)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── ReminderBanner — upcoming appointments in next 48h ───────────────────
function ReminderBanner({ appointments }: { appointments: CounselorAppointmentItem[] }) {
  const now = Date.now();
  const cutoff = now + REMINDER_WINDOW_HOURS * 3_600_000;
  const upcoming = appointments
    .filter((a) => a.status === 'ACCEPTED' && a.scheduledAt)
    .filter((a) => {
      const t = new Date(a.scheduledAt!).getTime();
      return t >= now && t <= cutoff;
    })
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());

  if (upcoming.length === 0) return null;

  const isVeryClose = new Date(upcoming[0].scheduledAt!).getTime() - now < 3_600_000;

  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${isVeryClose ? 'border-red-300 bg-red-50 dark:bg-red-950/20' : 'border-amber-200 bg-amber-50 dark:bg-amber-950/20'}`}>
      <div className="flex items-center gap-2">
        <Bell className={`w-4 h-4 ${isVeryClose ? 'text-red-600' : 'text-amber-600'}`} />
        <span className={`font-bold text-sm ${isVeryClose ? 'text-red-800 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'}`}>
          Upcoming Appointment Reminder
        </span>
        <Badge variant="outline" className={`ml-auto text-xs ${isVeryClose ? 'border-red-400 text-red-700' : 'border-amber-400 text-amber-700'}`}>
          {upcoming.length} in next {REMINDER_WINDOW_HOURS}h
        </Badge>
      </div>
      <div className="space-y-2">
        {upcoming.map((appt) => (
          <div key={appt.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-border/60 bg-background/80 px-3 py-2">
            <div className="space-y-0.5">
              <p className="font-semibold text-sm">{appt.serviceName}</p>
              <p className="text-xs text-muted-foreground">
                For {appt.childName} · {formatScheduled(appt.scheduledAt!)} · {appt.durationMinutes} min
              </p>
              <p className={`text-xs font-bold ${isVeryClose ? 'text-red-600' : 'text-amber-700'}`}>
                {formatCountdown(new Date(appt.scheduledAt!).getTime())}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {appt.meetLink && (
                <a href={appt.meetLink} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="default" className="rounded-xl h-8 text-xs gap-1.5">
                    <Video className="w-3.5 h-3.5" /> Join Now
                  </Button>
                </a>
              )}
              {toGoogleCalendarUrl(appt) && (
                <a href={toGoogleCalendarUrl(appt)!} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                  <Calendar className="w-3.5 h-3.5" /> Add to Calendar
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CounselorBookingPage() {
  const { accessToken } = useAuth();
  const { showError, showSuccess } = useNotification();
  const counselorDataService = getCounselorDataService();
  const childService = getChildService();
  const iepService = getIEPService();

  // ── Core data ──────────────────────────────────────────────────────────
  const [catalog, setCatalog] = useState<CounselorCatalogServiceItem[]>([]);
  const [counselors, setCounselors] = useState<CounselorDirectoryItem[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [myAppointments, setMyAppointments] = useState<CounselorAppointmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ── Search / filter ────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('ALL');

  // ── Booking wizard ─────────────────────────────────────────────────────
  const [selectedService, setSelectedService] = useState<CounselorCatalogServiceItem | null>(null);
  // When booking a counselor directly (no service), store their id here
  const [directCounselorId, setDirectCounselorId] = useState<string | null>(null);
  const [directCounselorName, setDirectCounselorName] = useState<string>('');
  const [directDuration, setDirectDuration] = useState<number>(60);
  const [wizardStep, setWizardStep] = useState<0 | 1 | 2>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepError, setStepError] = useState('');

  // Wizard — Step 0
  const [selectedChildId, setSelectedChildId] = useState('');
  const [childIeps, setChildIeps] = useState<DocumentListItem[]>([]);
  const [isLoadingIeps, setIsLoadingIeps] = useState(false);
  const [selectedIepDocumentId, setSelectedIepDocumentId] = useState('');
  const [selectedIepExtraction, setSelectedIepExtraction] = useState<ExtractionResponse['data'] | null>(null);
  const [isLoadingIepExtraction, setIsLoadingIepExtraction] = useState(false);

  // Wizard — Step 1: Calendar + slot picker
  const today = getLocalTodayYMD();
  const todayDateObj = new Date();
  const [calYear, setCalYear] = useState(todayDateObj.getFullYear());
  const [calMonth, setCalMonth] = useState(todayDateObj.getMonth());
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotDay, setSlotDay] = useState('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Wizard — Step 2
  const [notes, setNotes] = useState('');
  const [supportingFiles, setSupportingFiles] = useState<File[]>([]);

  // ── Reschedule dialog ──────────────────────────────────────────────────
  const [editingAppointment, setEditingAppointment] = useState<CounselorAppointmentItem | null>(null);
  const [rCalYear, setRCalYear] = useState(todayDateObj.getFullYear());
  const [rCalMonth, setRCalMonth] = useState(todayDateObj.getMonth());
  const [rescDate, setRescDate] = useState('');
  const [rescSlot, setRescSlot] = useState('');
  const [rescSlots, setRescSlots] = useState<string[]>([]);
  const [rescDay, setRescDay] = useState('');
  const [rescNotes, setRescNotes] = useState('');
  const [rescError, setRescError] = useState('');
  const [isLoadingRescSlots, setIsLoadingRescSlots] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // ── Payment dialog ─────────────────────────────────────────────────────
  const [payingAppointmentId, setPayingAppointmentId] = useState<string | null>(null);
  const [paymentSession, setPaymentSession] = useState<CounselorPaymentSession | null>(null);
  const [paymentAppointment, setPaymentAppointment] = useState<CounselorAppointmentItem | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);

  // ─── Initial data load ────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    setIsLoading(true);
    Promise.all([
      counselorDataService.listCatalog(accessToken),
      counselorDataService.listCounselors(accessToken),
      counselorDataService.listMyAppointments(accessToken),
      childService.getAll(accessToken),
    ])
      .then(([catalogItems, counselorItems, appointmentItems, childItems]) => {
        if (!active) return;
        setCatalog(catalogItems);
        setCounselors(counselorItems);
        setMyAppointments(appointmentItems);
        setChildren(childItems);
      })
      .catch((err) => {
        if (!active) return;
        showError('Failed to load data', err instanceof Error ? err.message : 'Please try again.');
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [accessToken, childService, counselorDataService, showError]);

  // ─── Load child IEPs ──────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken || !selectedChildId) { setChildIeps([]); setSelectedIepDocumentId(''); return; }
    let active = true;
    setIsLoadingIeps(true);
    iepService.getAll(selectedChildId)
      .then((docs) => { if (active) setChildIeps(docs as DocumentListItem[]); })
      .catch(() => { if (active) setChildIeps([]); })
      .finally(() => { if (active) setIsLoadingIeps(false); });
    return () => { active = false; };
  }, [accessToken, iepService, selectedChildId]);

  // ─── Load IEP extraction when doc chosen ─────────────────────────────
  useEffect(() => {
    if (!accessToken || !selectedIepDocumentId) { setSelectedIepExtraction(null); return; }
    let active = true;
    setIsLoadingIepExtraction(true);
    iepService.getExtraction(selectedIepDocumentId)
      .then((r) => { if (active) setSelectedIepExtraction(r.data); })
      .catch(() => { if (active) setSelectedIepExtraction(null); })
      .finally(() => { if (active) setIsLoadingIepExtraction(false); });
    return () => { active = false; };
  }, [accessToken, iepService, selectedIepDocumentId]);

  // ─── Load slots when booking date changes ────────────────────────────
  useEffect(() => {
    const isServiceBooking = !!selectedService;
    const isDirectBooking = !selectedService && !!directCounselorId;
    if (!accessToken || (!isServiceBooking && !isDirectBooking) || !selectedDate) {
      setAvailableSlots([]); setSelectedSlot(''); setSlotDay(''); return;
    }
    if (selectedDate < today) {
      setAvailableSlots([]); setSelectedSlot(''); setSlotDay('');
      setStepError('Please choose today or a future date.'); return;
    }
    let active = true;
    setIsLoadingSlots(true);
    setStepError('');
    const slotsPromise = isDirectBooking
      ? counselorDataService.listCounselorSlots(accessToken, directCounselorId!, selectedDate, directDuration)
      : counselorDataService.listCatalogSlots(accessToken, selectedService!.id, selectedDate);
    slotsPromise
      .then((r) => {
        if (!active) return;
        setSlotDay(r.day);
        setAvailableSlots(r.availableSlots);
        // Keep currently-selected slot if still available, else pick first
        setSelectedSlot((cur) => r.availableSlots.includes(cur) ? cur : (r.availableSlots[0] || ''));
      })
      .catch((err) => {
        if (!active) return;
        setAvailableSlots([]);
        showError('Failed to load slots', err instanceof Error ? err.message : 'Please try again.');
      })
      .finally(() => { if (active) setIsLoadingSlots(false); });
    return () => { active = false; };
  }, [accessToken, counselorDataService, directCounselorId, directDuration, selectedDate, selectedService, showError, today]);

  // ─── Load reschedule slots ────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken || !editingAppointment || !rescDate) {
      setRescSlots([]); setRescSlot(''); setRescDay(''); return;
    }
    if (rescDate < today) {
      setRescSlots([]); setRescSlot(''); setRescDay('');
      setRescError('Please choose today or a future date.'); return;
    }
    const isDirectResc = !editingAppointment.counselorServiceId;
    if (isDirectResc && !editingAppointment.counselorId) {
      setRescSlots([]); setRescSlot(''); setRescDay(''); return;
    }
    let active = true;
    setIsLoadingRescSlots(true);
    setRescError('');
    const slotsPromise = isDirectResc
      ? counselorDataService.listCounselorSlots(accessToken, editingAppointment.counselorId, rescDate, editingAppointment.durationMinutes)
      : counselorDataService.listCatalogSlots(accessToken, editingAppointment.counselorServiceId!, rescDate);
    slotsPromise
      .then((r) => {
        if (!active) return;
        setRescDay(r.day);
        setRescSlots(r.availableSlots);
        setRescSlot((cur) => r.availableSlots.includes(cur) ? cur : (r.availableSlots[0] || ''));
      })
      .catch((err) => {
        if (!active) return;
        setRescSlots([]);
        showError('Failed to load slots', err instanceof Error ? err.message : 'Please try again.');
      })
      .finally(() => { if (active) setIsLoadingRescSlots(false); });
    return () => { active = false; };
  }, [accessToken, counselorDataService, editingAppointment, rescDate, showError, today]);

  // ─── Derived ─────────────────────────────────────────────────────────
  const filteredCatalog = useMemo(() => {
    const q = search.trim().toLowerCase();
    const byType = serviceTypeFilter === 'ALL' ? catalog : catalog.filter((s) => s.serviceType === serviceTypeFilter);
    if (!q) return byType;
    return byType.filter(
      (s) => s.name.toLowerCase().includes(q) || s.serviceType.toLowerCase().includes(q) || s.counselor.displayName.toLowerCase().includes(q),
    );
  }, [catalog, search, serviceTypeFilter]);

  const serviceTypes = useMemo(() => Array.from(new Set(catalog.map((s) => s.serviceType))).sort(), [catalog]);

  // Unique counselors extracted from catalog — used for the counselor-based booking section
  const uniqueCounselors = useMemo(() => {
    const seen = new Set<string>();
    return catalog
      .filter((s) => { if (seen.has(s.counselor.id)) return false; seen.add(s.counselor.id); return true; })
      .map((s) => ({ ...s.counselor, firstServiceId: s.id, durationMinutes: s.durationMinutes }));
  }, [catalog]);
  // counselors from direct API endpoint (includes counselors with no services)
  void uniqueCounselors; // kept for reference, use `counselors` instead

  const appointmentGroups = useMemo(() => {
    const now = Date.now();
    return {
      upcoming: myAppointments
        .filter((a) => a.status === 'ACCEPTED' && a.scheduledAt && new Date(a.scheduledAt).getTime() >= now)
        .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime()),
      pending: myAppointments
        .filter((a) => a.status === 'REQUESTED' || a.status === 'WAITLISTED')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      past: myAppointments
        .filter((a) => a.status === 'COMPLETED' || (a.status === 'ACCEPTED' && a.scheduledAt && new Date(a.scheduledAt).getTime() < now))
        .sort((a, b) => new Date(b.scheduledAt || b.createdAt).getTime() - new Date(a.scheduledAt || a.createdAt).getTime()),
      cancelled: myAppointments
        .filter((a) => a.status === 'CANCELLED')
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    };
  }, [myAppointments]);

  const selectedChild = useMemo(() => children.find((c) => c.id === selectedChildId), [children, selectedChildId]);

  // ─── Dialog controls ──────────────────────────────────────────────────
  const resetWizardState = () => {
    setWizardStep(0);
    setStepError('');
    setSelectedChildId(children[0]?.id || '');
    setSelectedDate(''); setSelectedSlot(''); setAvailableSlots([]); setSlotDay('');
    setNotes(''); setSupportingFiles([]);
    setSelectedIepDocumentId(''); setSelectedIepExtraction(null);
    setCalYear(new Date().getFullYear()); setCalMonth(new Date().getMonth());
  };

  const openBooking = (service: CounselorCatalogServiceItem) => {
    setSelectedService(service);
    setDirectCounselorId(null);
    setDirectCounselorName('');
    resetWizardState();
  };

  /** Opens the booking wizard for a counselor (using service if available, otherwise direct) */
  const openCounselorBooking = (counselor: CounselorDirectoryItem) => {
    const service = catalog.find((s) => s.counselor.id === counselor.id);
    if (service) {
      openBooking(service);
    } else {
      // Direct booking — counselor has availability but no service defined
      setSelectedService(null);
      setDirectCounselorId(counselor.id);
      setDirectCounselorName(counselor.displayName);
      setDirectDuration(60);
      resetWizardState();
    }
  };

  const closeBooking = () => {
    if (!isSubmitting) {
      setSelectedService(null);
      setDirectCounselorId(null);
      setDirectCounselorName('');
    }
  };

  const canParentEdit = (status: CounselorAppointmentStatus) => status !== 'COMPLETED' && status !== 'CANCELLED';

  const openReschedule = (appt: CounselorAppointmentItem) => {
    setEditingAppointment(appt);
    if (appt.scheduledAt) {
      const p = slotFromIso(appt.scheduledAt);
      setRescDate(p.date); setRescSlot(p.time);
      const d = new Date(appt.scheduledAt);
      setRCalYear(d.getUTCFullYear()); setRCalMonth(d.getUTCMonth());
    } else {
      setRescDate(''); setRescSlot('');
      setRCalYear(new Date().getFullYear()); setRCalMonth(new Date().getMonth());
    }
    setRescNotes(appt.notes || '');
    setRescError('');
  };

  const closeReschedule = () => {
    if (isUpdating) return;
    setEditingAppointment(null);
    setRescDate(''); setRescSlot(''); setRescSlots([]); setRescDay(''); setRescNotes(''); setRescError('');
  };

  const updateLocalAppointment = (updated: CounselorAppointmentItem) => {
    setMyAppointments((prev) => prev.map((a) => a.id === updated.id ? updated : a));
  };

  // ─── Wizard step navigation with validation ───────────────────────────
  const goToNextStep = () => {
    setStepError('');
    if (wizardStep === 0) {
      const err = validateStep1(selectedChildId, children);
      if (err) { setStepError(err); return; }
      setWizardStep(1);
    } else if (wizardStep === 1) {
      const err = validateStep2(selectedDate, selectedSlot, availableSlots, today);
      if (err) { setStepError(err); return; }
      setWizardStep(2);
    }
  };

  // ─── Submit booking ───────────────────────────────────────────────────
  const submitRequest = async () => {
    if (!accessToken || (!selectedService && !directCounselorId)) return;

    // Re-validate all steps before submitting
    const e1 = validateStep1(selectedChildId, children);
    if (e1) { setStepError(e1); setWizardStep(0); return; }
    const e2 = validateStep2(selectedDate, selectedSlot, availableSlots, today);
    if (e2) { setStepError(e2); setWizardStep(1); return; }
    const e3 = validateStep3(notes, supportingFiles);
    if (e3) { setStepError(e3); return; }

    // Final freshness check
    if (!availableSlots.includes(selectedSlot)) {
      setStepError('Your selected slot is no longer available. Please go back and choose a new time.');
      setWizardStep(1);
      return;
    }

    setIsSubmitting(true);
    setStepError('');
    try {
      const supportingDocumentIds: string[] = [];
      for (const file of supportingFiles) {
        const fd = new FormData();
        fd.append('childId', selectedChildId);
        fd.append('file', file);
        const r = await iepService.uploadDocument(fd);
        supportingDocumentIds.push(r.documentId);
      }

      const appointmentPayload = selectedService
        ? {
          counselorServiceId: selectedService.id,
          childId: selectedChildId,
          iepDocumentId: selectedIepDocumentId || null,
          supportingDocumentIds,
          scheduledAt: toIsoFromDateAndSlot(selectedDate, selectedSlot),
          notes: notes.trim(),
        }
        : {
          counselorId: directCounselorId!,
          serviceName: 'Counseling Session',
          durationMinutes: directDuration,
          childId: selectedChildId,
          iepDocumentId: selectedIepDocumentId || null,
          supportingDocumentIds,
          scheduledAt: toIsoFromDateAndSlot(selectedDate, selectedSlot),
          notes: notes.trim(),
        };

      const displayName = selectedService ? selectedService.name : `Session with ${directCounselorName}`;
      const created = await counselorDataService.createAppointment(accessToken, appointmentPayload);

      setMyAppointments((prev) => [created, ...prev]);
      setSelectedService(null);
      setDirectCounselorId(null);
      setDirectCounselorName('');
      showSuccess('Appointment requested!', `Your request for ${displayName} has been sent to the counselor.`);
    } catch (err) {
      showError('Submission failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Cancel appointment ───────────────────────────────────────────────
  const handleCancel = async (appt: CounselorAppointmentItem) => {
    if (!accessToken) return;
    setIsUpdating(true);
    try {
      const updated = await counselorDataService.updateMyAppointment(accessToken, appt.id, { cancel: true });
      updateLocalAppointment(updated);
      showSuccess('Cancelled', 'Your appointment request has been cancelled.');
    } catch (err) {
      showError('Cancel failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // ─── Reschedule submit ────────────────────────────────────────────────
  const handleReschedule = async () => {
    if (!accessToken || !editingAppointment) return;
    const e2 = validateStep2(rescDate, rescSlot, rescSlots, today);
    if (e2) { setRescError(e2); return; }
    if (rescNotes.trim().length > MAX_NOTES_LENGTH) { setRescError(`Notes cannot exceed ${MAX_NOTES_LENGTH} characters.`); return; }

    setIsUpdating(true);
    setRescError('');
    try {
      const updated = await counselorDataService.updateMyAppointment(accessToken, editingAppointment.id, {
        scheduledAt: toIsoFromDateAndSlot(rescDate, rescSlot),
        notes: rescNotes.trim(),
      });
      updateLocalAppointment(updated);
      closeReschedule();
      showSuccess('Reschedule requested', 'Your updated time preference has been sent to the counselor.');
    } catch (err) {
      showError('Reschedule failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // ─── Mock payment ─────────────────────────────────────────────────────
  const handleStartMockPayment = async (appt: CounselorAppointmentItem) => {
    if (!accessToken) return;
    setPayingAppointmentId(appt.id);
    try {
      const session = await counselorDataService.createMyAppointmentPaymentSession(accessToken, appt.id);
      setPaymentSession(session);
      setPaymentAppointment(appt);
      setIsPaymentDialogOpen(true);
    } catch (err) {
      showError('Payment failed to start', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setPayingAppointmentId(null);
    }
  };

  const handleCompleteMockPayment = async () => {
    if (!accessToken || !paymentSession || !paymentAppointment) return;
    setIsConfirmingPayment(true);
    try {
      const updated = await counselorDataService.confirmMyAppointmentPayment(accessToken, paymentAppointment.id, {
        paymentSessionId: paymentSession.sessionId,
      });
      updateLocalAppointment(updated);
      setIsPaymentDialogOpen(false);
      setPaymentSession(null);
      setPaymentAppointment(null);
      showSuccess('Payment completed', 'Appointment is now marked paid.');
    } catch (err) {
      showError('Payment confirmation failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  const handleSupportFiles = (files: FileList | null) => {
    if (!files) { setSupportingFiles([]); return; }
    const arr = Array.from(files);
    if (arr.length > MAX_SUPPORTING_FILES) { setStepError(`You can upload up to ${MAX_SUPPORTING_FILES} files.`); return; }
    const fe = arr.map(supportFileValidationError).find(Boolean);
    if (fe) { setStepError(fe!); return; }
    setStepError('');
    setSupportingFiles(arr);
  };

  // ─── render ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-4 md:p-6 pb-16">
      {/* Page header */}
      <section className="rounded-[24px] border bg-card p-6 md:p-8 shadow-sm space-y-2">
        <h2 className="text-2xl md:text-3xl font-black">Find a Counselor</h2>
        <p className="text-sm text-muted-foreground">Browse counselors and book a session directly with them.</p>
      </section>

      {/* Reminder banner — shows when appointments are within 48 h */}
      <ReminderBanner appointments={myAppointments} />

      {/* Search + filter */}
      <div className="rounded-2xl border border-border bg-card/70 p-3 md:p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 pl-9 rounded-xl" placeholder="Search service or counselor" />
          </div>
          <div className="w-full md:w-60">
            <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
              <SelectTrigger className="rounded-xl h-10"><SelectValue placeholder="All departments" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All departments</SelectItem>
                {serviceTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── Book a Counselor ───────────────────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="text-xl font-black">Book a Counselor</h3>
        {isLoading ? (
          <div className="py-10 text-center text-muted-foreground font-medium">Loading counselors…</div>
        ) : counselors.length === 0 ? (
          <Card className="rounded-2xl border border-border">
            <CardContent className="p-10 text-center text-muted-foreground">No counselors available yet.</CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {counselors.map((counselor) => {
              const hasAvailability = true; // all counselors in the list are active
              void hasAvailability; // suppress unused warning
              return (
              <Card key={counselor.id} className="rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <UserCircle className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-black leading-tight">{counselor.displayName}</CardTitle>
                      {counselor.credentials && (
                        <p className="text-xs text-muted-foreground">{counselor.credentials}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 flex-1 flex flex-col">
                  {counselor.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{counselor.bio}</p>
                  )}
                  {counselor.specializations.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {counselor.specializations.slice(0, 3).map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs px-1.5 py-0">{s}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="mt-auto pt-2">
                    <Button
                      onClick={() => openCounselorBooking(counselor)}
                      className="w-full rounded-xl font-bold"
                    >
                      Book {counselor.displayName.split(' ')[0]}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
            })}          
          </div>
        )}
      </section>

      {/* ── Services Catalog (reference only — booking coming soon) ─────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-black">Services</h3>
          <Badge variant="outline" className="text-xs border-amber-400 text-amber-700 bg-amber-50">Coming Soon</Badge>
        </div>
        <p className="text-sm text-muted-foreground">Service-based booking is coming soon. For now, book directly by counselor above.</p>
        {isLoading ? (
          <div className="py-10 text-center text-muted-foreground font-medium">Loading services…</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredCatalog.map((service) => (
              <Card key={service.id} className="rounded-2xl border border-border shadow-sm opacity-75">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg font-black">{service.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{service.serviceType}</p>
                    </div>
                    <Badge className="shrink-0 mt-1" variant={service.priceCents === null ? 'secondary' : 'outline'}>
                      {formatPrice(service.priceCents)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <UserCircle className="w-4 h-4" /> {service.counselor.displayName}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {service.durationMinutes} min</span>
                    {service.counselor.specializations.slice(0, 2).map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs px-1.5 py-0">{s}</Badge>
                    ))}
                  </div>
                  {service.description && <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>}
                  <Button disabled className="w-full rounded-xl font-bold opacity-50 cursor-not-allowed">
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            ))}
            {filteredCatalog.length === 0 && (
              <Card className="rounded-2xl border border-border lg:col-span-2">
                <CardContent className="p-10 text-center text-muted-foreground">No services found.</CardContent>
              </Card>
            )}
          </div>
        )}
      </section>

      {/* ── My Appointments — tabbed ──────────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="text-xl font-black">My Appointments</h3>
        <Tabs defaultValue="upcoming">
          <TabsList className="rounded-xl">
            <TabsTrigger value="upcoming" className="rounded-lg">
              Upcoming <Badge variant="secondary" className="ml-1.5 text-xs">{appointmentGroups.upcoming.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-lg">
              Pending <Badge variant="secondary" className="ml-1.5 text-xs">{appointmentGroups.pending.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="past" className="rounded-lg">
              Past <Badge variant="secondary" className="ml-1.5 text-xs">{appointmentGroups.past.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="rounded-lg">
              Cancelled <Badge variant="secondary" className="ml-1.5 text-xs">{appointmentGroups.cancelled.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {(['upcoming', 'pending', 'past', 'cancelled'] as const).map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-3 space-y-3">
              {appointmentGroups[tab].length === 0 ? (
                <Card className="rounded-2xl border border-border">
                  <CardContent className="p-8 text-center text-muted-foreground text-sm">
                    {tab === 'upcoming' && 'No upcoming confirmed sessions.'}
                    {tab === 'pending' && 'No pending requests.'}
                    {tab === 'past' && 'No past sessions yet.'}
                    {tab === 'cancelled' && 'No cancelled appointments.'}
                  </CardContent>
                </Card>
              ) : (
                appointmentGroups[tab].map((appt) => {
                  const effectivePayment: CounselorPaymentStatus = appt.status === 'CANCELLED' ? 'NOT_REQUIRED' : appt.paymentStatus;
                  return (
                    <Card key={appt.id} className="rounded-2xl border border-border">
                      <CardContent className="p-4 md:p-5 space-y-3">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold">{appt.serviceName}</p>
                              <Badge className={`border text-xs ${STATUS_BADGE[appt.status]}`}>{STATUS_LABEL[appt.status]}</Badge>
                              {appt.paymentStatus !== 'NOT_REQUIRED' && (
                                <Badge className={`border text-xs ${PAYMENT_BADGE[effectivePayment]}`}>{effectivePayment}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">For {appt.childName}</p>
                            {appt.scheduledAt && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatScheduled(appt.scheduledAt)} · {appt.durationMinutes} min
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 items-start flex-wrap">
                            {appt.status === 'ACCEPTED' && appt.meetLink && (
                              <a href={appt.meetLink} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm font-bold text-teal-600 hover:text-teal-800">
                                <Video className="w-4 h-4" /> Join Meet <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {appt.status === 'ACCEPTED' && toGoogleCalendarUrl(appt) && (
                              <a href={toGoogleCalendarUrl(appt)!} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800">
                                <Calendar className="w-4 h-4" /> Add to Calendar <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {appt.status === 'ACCEPTED' && appt.paymentStatus === 'PENDING' && (
                              <Button size="sm" variant="outline" className="rounded-xl h-8 text-xs"
                                onClick={() => handleStartMockPayment(appt)}
                                disabled={payingAppointmentId === appt.id}>
                                <CreditCard className="w-3.5 h-3.5 mr-1" />
                                {payingAppointmentId === appt.id ? 'Starting…' : 'Pay Now'}
                              </Button>
                            )}
                          </div>
                        </div>

                        {appt.counselorMessage && (
                          <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/30 px-3 py-2 text-xs text-blue-800 dark:text-blue-300">
                            <span className="font-semibold">Counselor:</span> {appt.counselorMessage}
                          </div>
                        )}
                        {appt.paymentReference && (
                          <p className="text-xs text-muted-foreground">Payment ref: {appt.paymentReference}</p>
                        )}

                        {canParentEdit(appt.status) && (
                          <div className="flex gap-2 pt-1">
                            <Button size="sm" variant="outline" className="rounded-xl h-8 text-xs"
                              onClick={() => openReschedule(appt)} disabled={isUpdating}>
                              Reschedule
                            </Button>
                            <Button size="sm" variant="ghost"
                              className="rounded-xl h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleCancel(appt)} disabled={isUpdating}>
                              Cancel
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          ))}
        </Tabs>
      </section>

      {/* ── 3-step Booking Wizard ────────────────────────────────────────── */}
      <Dialog open={!!(selectedService || directCounselorId)} onOpenChange={(open) => { if (!open) closeBooking(); }}>
        <DialogContent className="sm:max-w-3xl rounded-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Book a Counselor Session</DialogTitle>
          </DialogHeader>

          {/* Step progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground font-medium px-0.5">
              {BOOKING_STEPS.map((s, i) => (
                <span key={s} className={i === wizardStep ? 'text-primary font-bold' : ''}>{i + 1}. {s}</span>
              ))}
            </div>
            <Progress value={(wizardStep / (BOOKING_STEPS.length - 1)) * 100} className="h-1.5 rounded-full" />
          </div>

          {/* Counselor summary */}
          <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1">
            <div className="flex items-center gap-2">
              <UserCircle className="w-4 h-4 text-primary" />
              <p className="font-bold">{selectedService?.counselor.displayName ?? directCounselorName}</p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {selectedService?.counselor.credentials && (
                <span>{selectedService.counselor.credentials}</span>
              )}
              {selectedService?.counselor.specializations.slice(0, 2).map((s) => (
                <Badge key={s} variant="secondary" className="text-xs px-1.5 py-0">{s}</Badge>
              ))}
            </div>
          </div>

          {/* ── Step 0: Child selection ── */}
          {wizardStep === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-semibold">Select Child <span className="text-destructive">*</span></Label>
                {children.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 flex gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    No child profiles found. Please add a child profile before booking.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {children.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => { setSelectedChildId(child.id); setSelectedIepDocumentId(''); setSelectedIepExtraction(null); }}
                        className={[
                          'rounded-xl border p-3 text-left transition-all',
                          selectedChildId === child.id
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'border-border hover:border-primary/50 hover:bg-muted/30',
                        ].join(' ')}
                      >
                        <p className="font-semibold text-sm">{child.name}</p>
                        {selectedChildId === child.id && (
                          <p className="text-xs text-primary mt-0.5 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedChildId && (
                <>
                  <div className="space-y-2">
                    <Label className="font-semibold">Child IEP Document <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Select value={selectedIepDocumentId} onValueChange={setSelectedIepDocumentId}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder={isLoadingIeps ? 'Loading…' : 'Select an IEP document'} />
                      </SelectTrigger>
                      <SelectContent>
                        {childIeps.map((doc) => (
                          <SelectItem key={doc.id} value={doc.id}>{doc.originalFileName || doc.fileName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!isLoadingIeps && childIeps.length === 0 && (
                      <p className="text-xs text-muted-foreground">No IEP documents for this child yet.</p>
                    )}
                  </div>

                  {selectedIepDocumentId && (
                    <div className="rounded-xl border border-border p-3 bg-muted/20 space-y-2">
                      <div className="flex items-center gap-2">
                        <FileSearch className="w-4 h-4 text-muted-foreground" />
                        <p className="font-semibold text-sm">IEP Analysis Snapshot</p>
                      </div>
                      {isLoadingIepExtraction ? (
                        <p className="text-xs text-muted-foreground">Loading analysis…</p>
                      ) : selectedIepExtraction ? (
                        <>
                          {selectedIepExtraction.summary && <p className="text-sm text-muted-foreground">{selectedIepExtraction.summary}</p>}
                          <div className="flex flex-wrap gap-2 text-xs">
                            <Badge variant="secondary">Goals: {selectedIepExtraction.goals?.length || 0}</Badge>
                            <Badge variant="secondary">Services: {selectedIepExtraction.services?.length || 0}</Badge>
                            {typeof selectedIepExtraction.confidence?.overall === 'number' && (
                              <Badge variant="secondary">Confidence: {Math.round(selectedIepExtraction.confidence.overall * 100)}%</Badge>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">Analysis not yet available.</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Step 1: Calendly-style date + time picker ── */}
          {wizardStep === 1 && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Month calendar */}
                <div className="rounded-xl border border-border p-4 bg-card">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Select Date</p>
                  <CalendarGrid
                    year={calYear}
                    month={calMonth}
                    today={today}
                    selectedDate={selectedDate}
                    onSelectDate={(ymd) => { setSelectedDate(ymd); setSelectedSlot(''); }}
                    onPrevMonth={() => {
                      if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
                      else setCalMonth((m) => m - 1);
                    }}
                    onNextMonth={() => {
                      if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
                      else setCalMonth((m) => m + 1);
                    }}
                  />
                  {selectedDate && slotDay && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">{slotDay}, {selectedDate}</p>
                  )}
                </div>

                {/* Slot grid */}
                <div className="rounded-xl border border-border p-4 bg-card">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Available Times {selectedDate ? `— ${MONTHS[Number(selectedDate.slice(5, 7)) - 1]} ${Number(selectedDate.slice(8))}` : ''}
                  </p>
                  <SlotGrid
                    slots={availableSlots}
                    selected={selectedSlot}
                    onSelect={setSelectedSlot}
                    isLoading={isLoadingSlots}
                    date={selectedDate}
                  />
                </div>
              </div>

              {selectedDate && selectedSlot && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 p-3 flex items-center gap-2 text-sm text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <strong>{formatScheduled(toIsoFromDateAndSlot(selectedDate, selectedSlot))}</strong>
                  <span className="text-muted-foreground">·</span>
                  {selectedService?.durationMinutes ?? directDuration} min
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Notes, files, confirmation ── */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Booking Summary</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <span className="text-muted-foreground">Counselor</span>
                  <span className="font-medium">{selectedService?.counselor.displayName ?? directCounselorName}</span>
                  <span className="text-muted-foreground">Child</span>
                  <span className="font-medium">{selectedChild?.name}</span>
                  <span className="text-muted-foreground">Date & Time</span>
                  <span className="font-medium">
                    {selectedDate && selectedSlot ? formatScheduled(toIsoFromDateAndSlot(selectedDate, selectedSlot)) : '—'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-xl"
                  rows={4}
                  maxLength={MAX_NOTES_LENGTH}
                  placeholder="Describe your child's needs, goals, or anything the counselor should know…"
                />
                <p className={`text-xs text-right ${notes.length > MAX_NOTES_LENGTH * 0.9 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {notes.length}/{MAX_NOTES_LENGTH}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">Supporting Documents <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input type="file" multiple onChange={(e) => handleSupportFiles(e.target.files)} className="rounded-xl" />
                <p className="text-xs text-muted-foreground">Up to {MAX_SUPPORTING_FILES} files, max 10 MB each.</p>
                {supportingFiles.length > 0 && (
                  <div className="rounded-xl border border-border p-2 space-y-1">
                    {supportingFiles.map((f) => (
                      <p key={f.name} className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 shrink-0" /> {f.name}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs text-amber-800 dark:text-amber-300 flex gap-2">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                Your selected time is a preference and is subject to counselor confirmation. You'll receive email and calendar notifications once confirmed.
              </div>
            </div>
          )}

          {/* Step validation error */}
          {stepError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {stepError}
            </div>
          )}

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            {wizardStep > 0 && (
              <Button variant="outline" className="rounded-xl" disabled={isSubmitting}
                onClick={() => { setWizardStep((s) => (s - 1) as 0 | 1 | 2); setStepError(''); }}>
                Back
              </Button>
            )}
            <Button variant="outline" className="rounded-xl" disabled={isSubmitting} onClick={closeBooking}>
              Cancel
            </Button>
            {wizardStep < 2 ? (
              <Button className="rounded-xl font-bold" onClick={goToNextStep} disabled={children.length === 0}>
                Continue
              </Button>
            ) : (
              <Button className="rounded-xl font-bold" onClick={submitRequest} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting…' : 'Confirm Booking'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reschedule dialog — Calendly layout ─────────────────────────── */}
      <Dialog open={!!editingAppointment} onOpenChange={(open) => { if (!open) closeReschedule(); }}>
        <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Reschedule Appointment</DialogTitle>
          </DialogHeader>

          <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-0.5">
            <p className="font-bold text-sm">{editingAppointment?.serviceName}</p>
            <p className="text-xs text-muted-foreground">For {editingAppointment?.childName} · {editingAppointment?.durationMinutes} min</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border p-4 bg-card">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Pick New Date</p>
              <CalendarGrid
                year={rCalYear}
                month={rCalMonth}
                today={today}
                selectedDate={rescDate}
                onSelectDate={(ymd) => { setRescDate(ymd); setRescSlot(''); }}
                onPrevMonth={() => {
                  if (rCalMonth === 0) { setRCalYear((y) => y - 1); setRCalMonth(11); }
                  else setRCalMonth((m) => m - 1);
                }}
                onNextMonth={() => {
                  if (rCalMonth === 11) { setRCalYear((y) => y + 1); setRCalMonth(0); }
                  else setRCalMonth((m) => m + 1);
                }}
              />
              {rescDate && rescDay && (
                <p className="text-xs text-muted-foreground mt-2 text-center">{rescDay}, {rescDate}</p>
              )}
            </div>

            <div className="rounded-xl border border-border p-4 bg-card">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Available Times {rescDate ? `— ${MONTHS[Number(rescDate.slice(5, 7)) - 1]} ${Number(rescDate.slice(8))}` : ''}
              </p>
              <SlotGrid slots={rescSlots} selected={rescSlot} onSelect={setRescSlot} isLoading={isLoadingRescSlots} date={rescDate} />
            </div>
          </div>

          {rescDate && rescSlot && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 p-3 flex items-center gap-2 text-sm text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              New time: <strong className="ml-1">{formatScheduled(toIsoFromDateAndSlot(rescDate, rescSlot))}</strong>
            </div>
          )}

          <div className="space-y-2">
            <Label className="font-semibold">Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea value={rescNotes} onChange={(e) => setRescNotes(e.target.value)} className="rounded-xl" rows={3} maxLength={MAX_NOTES_LENGTH} />
            <p className={`text-xs text-right ${rescNotes.length > MAX_NOTES_LENGTH * 0.9 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {rescNotes.length}/{MAX_NOTES_LENGTH}
            </p>
          </div>

          {rescError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {rescError}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" disabled={isUpdating} onClick={closeReschedule}>Cancel</Button>
            <Button className="rounded-xl font-bold" disabled={isUpdating} onClick={handleReschedule}>
              {isUpdating ? 'Saving…' : 'Send Reschedule Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Mock payment dialog ──────────────────────────────────────────── */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={(open) => {
        if (!isConfirmingPayment) {
          setIsPaymentDialogOpen(open);
          if (!open) { setPaymentSession(null); setPaymentAppointment(null); }
        }
      }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              Mock Payment Gateway <Badge variant="outline">Mock Mode</Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-0.5">
              <p className="font-bold">{paymentAppointment?.serviceName}</p>
              <p className="text-sm text-muted-foreground">For {paymentAppointment?.childName}</p>
              {paymentAppointment?.scheduledAt && (
                <p className="text-sm text-muted-foreground">{formatScheduled(paymentAppointment.scheduledAt)}</p>
              )}
            </div>
            <div className="rounded-xl border border-border p-3 space-y-1">
              <p className="text-sm text-muted-foreground">Gateway: {paymentSession?.gateway?.toUpperCase()}</p>
              <p className="text-2xl font-black">
                {typeof paymentSession?.amountCents === 'number' ? `$${(paymentSession.amountCents / 100).toFixed(2)}` : '—'} {paymentSession?.currency || 'USD'}
              </p>
              <p className="text-xs text-muted-foreground">Session: {paymentSession?.sessionId}</p>
              <p className="text-xs text-muted-foreground">Expires: {paymentSession?.expiresAt ? new Date(paymentSession.expiresAt).toLocaleString() : '—'}</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" disabled={isConfirmingPayment} onClick={() => setIsPaymentDialogOpen(false)}>Cancel</Button>
            <Button className="rounded-xl font-bold" disabled={isConfirmingPayment} onClick={handleCompleteMockPayment}>
              {isConfirmingPayment ? 'Completing…' : 'Complete Mock Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
