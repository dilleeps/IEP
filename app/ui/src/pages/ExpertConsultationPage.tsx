import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/app/providers/AuthProvider';
import { getChildService } from '@/domain/child/child.service';
import type { Child } from '@/domain/child/types';
import { getConsultationService } from '@/domain/consultation/consultation.service';
import type { ConsultationItem, ConsultationSlot, ConsultationStatus } from '@/domain/consultation/types';
import { CONCERN_AREAS } from '@/domain/consultation/types';
import { useNotification } from '@/hooks/useNotification';
import {
  AlertTriangle, Calendar, CheckCircle2,
  ChevronLeft, ChevronRight,
  Clock, DollarSign, Heart, Info, MessageCircle,
  Shield, Star, UserCircle, Users, Video, X,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_NOTES_LENGTH = 2000;

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

const STATUS_BADGE: Record<ConsultationStatus, string> = {
  BOOKED: 'bg-amber-100 text-amber-800 border-amber-200',
  CONFIRMED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  COMPLETED: 'bg-slate-100 text-slate-700 border-slate-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  NO_SHOW: 'bg-gray-100 text-gray-700 border-gray-200',
};

const STATUS_LABEL: Record<ConsultationStatus, string> = {
  BOOKED: 'Booked',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No Show',
};

const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    title: 'Pick a Time',
    description: 'Choose a date and time that works for your schedule.',
  },
  {
    step: 2,
    title: 'Share Your Concerns',
    description: 'Tell us about your child and what you need help with.',
  },
  {
    step: 3,
    title: 'Meet Your Expert',
    description: 'Get personalized guidance in a private 1-on-1 video session.',
  },
  {
    step: 4,
    title: 'Clear Next Steps',
    description: 'Leave with an action plan — and decide if an advocate is needed.',
  },
];

const WHAT_WE_COVER = [
  { icon: Shield, label: 'Your Rights Under IDEA', description: 'Learn about services and supports typically included under IDEA' },
  { icon: MessageCircle, label: 'IEP Review & Feedback', description: 'Expert analysis of your child\'s current IEP' },
  { icon: Star, label: 'Goal Appropriateness', description: 'Are your child\'s IEP goals ambitious enough?' },
  { icon: Users, label: 'Meeting Preparation', description: 'How to approach your next IEP team meeting' },
  { icon: Heart, label: 'Placement & Services', description: 'Is your child getting the right supports?' },
  { icon: DollarSign, label: 'Do You Need an Advocate?', description: 'Honest guidance on when to escalate' },
];

// ─── Utilities ────────────────────────────────────────────────────────────────
function getLocalTodayYMD(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const amPm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${amPm}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ExpertConsultationPage() {
  const { accessToken } = useAuth();
  const { showSuccess, showError } = useNotification();
  const consultationService = getConsultationService();
  const childService = getChildService();

  // Data state
  const [children, setChildren] = useState<Child[]>([]);
  const [slots, setSlots] = useState<ConsultationSlot[]>([]);
  const [myConsultations, setMyConsultations] = useState<ConsultationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(false);

  // Booking wizard state
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<ConsultationSlot | null>(null);
  const [concernArea, setConcernArea] = useState('General IEP Consultation');
  const [notes, setNotes] = useState('');

  // Calendar state
  const today = getLocalTodayYMD();
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState('');

  // Post-booking confirmation state
  const [bookedConsultation, setBookedConsultation] = useState<ConsultationItem | null>(null);

  // Cancel state
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // ─── Load data ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return;
    loadData();
  }, [accessToken]);

  async function loadData() {
    setLoading(true);
    try {
      const [childrenRes, consultationsRes] = await Promise.all([
        childService.getAll(accessToken!),
        consultationService.listMyConsultations(accessToken!),
      ]);
      setChildren(childrenRes);
      setMyConsultations(consultationsRes);
    } catch (err: any) {
      showError('Error', err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  // Load slots when a date is selected
  useEffect(() => {
    if (!selectedDate || !accessToken) return;
    loadSlotsForDate(selectedDate);
  }, [selectedDate, accessToken]);

  async function loadSlotsForDate(date: string) {
    setSlotsLoading(true);
    try {
      const slotsRes = await consultationService.listAvailableSlots(accessToken!, date);
      setSlots(slotsRes);
    } catch (err: any) {
      showError('Error', err.message || 'Failed to load slots');
    } finally {
      setSlotsLoading(false);
    }
  }

  // ─── Calendar helpers ───────────────────────────────────────────────────
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(calYear, calMonth);
    const firstDay = getFirstDayOfMonth(calYear, calMonth);
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);

    return days;
  }, [calYear, calMonth]);

  function prevMonth() {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
  }

  function nextMonth() {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
  }

  function selectDay(day: number) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (dateStr < today) return;
    setSelectedDate(dateStr);
    setSelectedSlot(null);
  }

  // ─── Booking handlers ──────────────────────────────────────────────────
  function openBookingDialog() {
    setShowBookingDialog(true);
    setSelectedChildId('');
    setConcernArea('General IEP Consultation');
    setNotes('');
  }

  async function handleBook() {
    if (!selectedSlot || !selectedChildId) return;

    setBooking(true);
    try {
      const result = await consultationService.bookConsultation(accessToken!, {
        slotId: selectedSlot.id,
        childId: selectedChildId,
        concernArea,
        notes,
      });

      setShowBookingDialog(false);
      setBookedConsultation(result);

      await loadData();
    } catch (err: any) {
      showError('Error', err.message || 'Failed to book consultation');
    } finally {
      setBooking(false);
    }
  }

  async function handleCancel() {
    if (!cancelId) return;

    setCancelling(true);
    try {
      await consultationService.cancelMyConsultation(accessToken!, cancelId);
      showSuccess('Cancelled', 'Consultation cancelled. The slot is now available for others.');
      setCancelId(null);
      await loadData();
    } catch (err: any) {
      showError('Error', err.message || 'Failed to cancel consultation');
    } finally {
      setCancelling(false);
    }
  }

  // ─── Derived data ──────────────────────────────────────────────────────
  const activeConsultations = myConsultations.filter((c) => c.status === 'BOOKED' || c.status === 'CONFIRMED');
  const pastConsultations = myConsultations.filter((c) => c.status === 'COMPLETED' || c.status === 'CANCELLED' || c.status === 'NO_SHOW');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6 max-w-6xl mx-auto">
      {/* ─── Hero Section ────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/10 p-6 md:p-8">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/15">
              <UserCircle className="h-5 w-5 text-primary" />
            </div>
            <Badge variant="outline" className="border-primary/30 text-primary text-xs font-medium">
              1-on-1 Expert Session
            </Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Talk to an IEP Expert Before Hiring an Advocate
          </h1>
          <p className="text-muted-foreground mt-2 text-base md:text-lg leading-relaxed max-w-2xl">
            Advocates can cost $150-$400+ per hour. Many families spend thousands before realizing their
            issue could have been resolved with proper guidance. Start here — get clarity first.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Private video call
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Personalized guidance
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Clear action plan
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              No commitment required
            </span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="book" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="book">Book a Consultation</TabsTrigger>
          <TabsTrigger value="my-bookings">
            My Consultations
            {activeConsultations.length > 0 && (
              <Badge className="ml-2 bg-primary/10 text-primary border-0 text-xs">
                {activeConsultations.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ─── Book Tab ──────────────────────────────────────────────── */}
        <TabsContent value="book" className="space-y-6 mt-6">
          {children.length === 0 ? (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="h-7 w-7 text-amber-600" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">Child Profile Required</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    To book a consultation, we need to know about your child. Please add a child profile first.
                  </p>
                </div>
                <Button onClick={() => window.location.href = '/child-profile'}>
                  Add Child Profile
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* How It Works */}
              <div>
                <h2 className="text-lg font-semibold mb-4">How It Works</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {HOW_IT_WORKS_STEPS.map((item) => (
                    <div
                      key={item.step}
                      className="relative rounded-xl border bg-card p-4 text-center"
                    >
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold mb-2">
                        {item.step}
                      </div>
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calendar + Slots */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Select Your Preferred Time</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Calendar */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        Choose a Date
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <Button variant="ghost" size="icon" onClick={prevMonth}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="font-medium text-sm">
                          {MONTHS[calMonth]} {calYear}
                        </span>
                        <Button variant="ghost" size="icon" onClick={nextMonth}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                        {WEEKDAYS.map((d) => (
                          <div key={d} className="font-medium text-muted-foreground py-1">{d}</div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, i) => {
                          if (day === null) return <div key={`e-${i}`} />;

                          const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const dayOfWeek = new Date(calYear, calMonth, day).getDay();
                          const isSunday = dayOfWeek === 0;
                          const isPast = dateStr < today || isSunday;
                          const isSelected = dateStr === selectedDate;
                          const isToday = dateStr === today;

                          return (
                            <button
                              key={dateStr}
                              disabled={isPast}
                              onClick={() => selectDay(day)}
                              className={`
                                h-9 w-full rounded-md text-sm transition-colors
                                ${isPast ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-accent cursor-pointer'}
                                ${isSelected ? 'bg-primary text-primary-foreground hover:bg-primary/90 font-medium' : ''}
                                ${isToday && !isSelected ? 'ring-1 ring-primary text-primary font-medium' : ''}
                              `}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Available Slots */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        Available Time Slots
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {!selectedDate ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <Calendar className="h-6 w-6 opacity-50" />
                          </div>
                          <p className="text-sm font-medium">Select a date to view openings</p>
                          <p className="text-xs text-center max-w-[200px]">
                            Choose a date from the calendar to see available consultation times.
                          </p>
                        </div>
                      ) : slotsLoading ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary" />
                          <p className="text-sm text-muted-foreground">Loading available times...</p>
                        </div>
                      ) : slots.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <Clock className="h-6 w-6 opacity-50" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium">No openings on {formatDate(selectedDate)}</p>
                            <p className="text-xs mt-1">Try selecting a different date.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">
                              {formatDate(selectedDate)}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {slots.length} available
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                            {slots.map((slot) => (
                              <button
                                key={slot.id}
                                onClick={() => {
                                  setSelectedSlot(slot);
                                  openBookingDialog();
                                }}
                                className="group p-3 rounded-xl border text-sm transition-all text-left hover:border-primary hover:shadow-sm hover:bg-primary/[0.02] active:scale-[0.98]"
                              >
                                <div className="font-medium group-hover:text-primary transition-colors">
                                  {formatTime(slot.startTime)}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  to {formatTime(slot.endTime)} ({slot.durationMinutes} min)
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* What We Cover */}
              <div>
                <h2 className="text-lg font-semibold mb-4">What Our Expert Covers</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {WHAT_WE_COVER.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border bg-card p-4 flex gap-3 items-start"
                    >
                      <div className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <item.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm leading-tight">{item.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expert Credential Disclosure */}
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-muted-foreground leading-relaxed space-y-1">
                    <p className="font-semibold text-sm text-foreground">About Our Consultants</p>
                    <p>Our consultants are experienced special education advocates and educators. They are not attorneys and do not provide legal representation. Consultations are educational and informational in nature and do not create an attorney-client relationship. For specific legal matters, please consult a licensed attorney.</p>
                  </div>
                </div>
              </div>

              {/* Trust / FAQ Section */}
              <Card className="border-blue-200/70 bg-gradient-to-br from-blue-50/80 to-background">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-900 space-y-2">
                      <p className="font-semibold">Why start with an expert consultation?</p>
                      <ul className="space-y-1.5 text-blue-800">
                        <li className="flex items-start gap-2">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-500 flex-shrink-0" />
                          <span><strong>Save money:</strong> Advocates charge $150-$400+/hour. Many parents find they don't need one after our expert reviews their situation.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-500 flex-shrink-0" />
                          <span><strong>Get clarity:</strong> Understand exactly where you stand before committing to a costly process.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-500 flex-shrink-0" />
                          <span><strong>Be prepared:</strong> If you do need an advocate, you'll go in fully informed — saving sessions and reducing cost.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-500 flex-shrink-0" />
                          <span><strong>No obligation:</strong> This is a consultation, not a contract. You decide the next step.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ─── My Bookings Tab ───────────────────────────────────────── */}
        <TabsContent value="my-bookings" className="space-y-6 mt-6">
          {myConsultations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <div className="text-center max-w-sm">
                  <p className="font-medium text-foreground">No consultations yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Book your first expert consultation to get personalized IEP guidance before engaging an advocate.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Active bookings */}
              {activeConsultations.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Upcoming Consultations
                  </h3>
                  {activeConsultations.map((c) => (
                    <ConsultationCard
                      key={c.id}
                      consultation={c}
                      onCancel={() => setCancelId(c.id)}
                    />
                  ))}
                </div>
              )}

              {/* Past bookings */}
              {pastConsultations.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    Past Consultations
                  </h3>
                  {pastConsultations.map((c) => (
                    <ConsultationCard key={c.id} consultation={c} />
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── Booking Dialog ──────────────────────────────────────────── */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-primary" />
              Book Expert Consultation
            </DialogTitle>
          </DialogHeader>

          {selectedSlot && (
            <div className="space-y-4">
              {/* Slot info */}
              <div className="rounded-xl bg-primary/5 border border-primary/15 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4 text-primary" />
                  {formatDate(selectedSlot.date)}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)} ({selectedSlot.durationMinutes} min session)
                </div>
              </div>

              {/* Select Child */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Which child is this about? *</Label>
                <Select value={selectedChildId} onValueChange={setSelectedChildId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your child" />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Concern Area */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">What would you like to discuss?</Label>
                <Select value={concernArea} onValueChange={setConcernArea}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONCERN_AREAS.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Anything specific you'd like to cover? <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, MAX_NOTES_LENGTH))}
                  placeholder="E.g., My child isn't getting the speech therapy hours listed in the IEP..."
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {notes.length}/{MAX_NOTES_LENGTH}
                </p>
              </div>

              {/* Trust note */}
              <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
                <Shield className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your information is kept confidential. The expert will review your details before the session so you can make the most of your time together.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setShowBookingDialog(false)}>
              Back
            </Button>
            <Button
              onClick={handleBook}
              disabled={!selectedChildId || !selectedSlot || booking}
              className="min-w-[140px]"
            >
              {booking ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                  Booking...
                </span>
              ) : (
                'Confirm Booking'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Booking Confirmation Dialog (post-booking) ──────────────── */}
      <Dialog open={!!bookedConsultation} onOpenChange={(open) => { if (!open) setBookedConsultation(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
              Consultation Booked!
            </DialogTitle>
          </DialogHeader>

          {bookedConsultation && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your expert consultation has been booked successfully. Here are your meeting details:
              </p>

              {/* Meeting details card */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
                {bookedConsultation.slot && (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-emerald-600" />
                      <span className="font-medium">{formatDate(bookedConsultation.slot.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-emerald-600" />
                      <span>
                        {formatTime(bookedConsultation.slot.startTime)} - {formatTime(bookedConsultation.slot.endTime)} EST
                      </span>
                    </div>
                  </>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <UserCircle className="h-4 w-4 text-emerald-600" />
                  <span>{bookedConsultation.childName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                  <span>{bookedConsultation.concernArea}</span>
                </div>
              </div>

              {/* Meeting link */}
              {bookedConsultation.meetLink && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Video className="h-4 w-4" />
                    Video Meeting Link
                  </div>
                  <a
                    href={bookedConsultation.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-primary hover:underline break-all font-medium"
                  >
                    {bookedConsultation.meetLink}
                  </a>
                  <p className="text-xs text-muted-foreground">
                    Use this link to join your consultation at the scheduled time. No downloads required.
                  </p>
                </div>
              )}

              <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  A confirmation email with calendar invite has been sent to your email address. You can also find your meeting details under "My Consultations" anytime.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setBookedConsultation(null)} className="w-full">
              Got It
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Cancel Confirmation Dialog ──────────────────────────────── */}
      <Dialog open={!!cancelId} onOpenChange={(open) => !open && setCancelId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel This Consultation?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This will cancel your upcoming session and release the time slot so another parent can book it.
            You can always schedule a new consultation afterward.
          </p>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setCancelId(null)}>
              Keep My Booking
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? 'Cancelling...' : 'Cancel Consultation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Consultation Card ────────────────────────────────────────────────────────
function ConsultationCard({
  consultation,
  onCancel,
}: {
  consultation: ConsultationItem;
  onCancel?: () => void;
}) {
  const canCancel = onCancel && (consultation.status === 'BOOKED' || consultation.status === 'CONFIRMED');
  const isActive = consultation.status === 'BOOKED' || consultation.status === 'CONFIRMED';

  return (
    <Card className={isActive ? 'border-primary/20' : ''}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2.5 flex-1 min-w-0">
            {/* Status + Concern */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`${STATUS_BADGE[consultation.status]} text-xs font-medium`}>
                {STATUS_LABEL[consultation.status]}
              </Badge>
              <span className="text-sm font-medium text-foreground">{consultation.concernArea}</span>
            </div>

            {/* Details */}
            <div className="text-sm text-muted-foreground space-y-1.5">
              <div className="flex items-center gap-2">
                <UserCircle className="h-4 w-4 flex-shrink-0" />
                <span>{consultation.childName}</span>
              </div>
              {consultation.slot && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>
                    {formatDate(consultation.slot.date)} at {formatTime(consultation.slot.startTime)} - {formatTime(consultation.slot.endTime)}
                  </span>
                </div>
              )}
              {consultation.meetLink && (
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-primary flex-shrink-0" />
                  <a
                    href={consultation.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    Join Video Session
                  </a>
                </div>
              )}
            </div>

            {/* Notes */}
            {consultation.notes && (
              <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-2.5 line-clamp-2">
                <span className="font-medium">Your notes:</span> {consultation.notes}
              </p>
            )}

            {/* Expert Notes */}
            {consultation.expertNotes && (
              <div className="text-xs bg-primary/5 border border-primary/10 rounded-lg p-2.5">
                <span className="font-semibold text-primary">Expert feedback:</span>{' '}
                <span className="text-foreground">{consultation.expertNotes}</span>
              </div>
            )}
          </div>

          {/* Cancel */}
          {canCancel && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
              onClick={onCancel}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
