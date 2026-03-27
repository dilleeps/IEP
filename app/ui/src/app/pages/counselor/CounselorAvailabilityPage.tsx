import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import { useNotification } from '@/hooks/useNotification';
import { useAuth } from '@/app/providers/AuthProvider';
import { getCounselorDataService } from '@/domain/counselor/counselor.service';
import type { CounselorAvailabilityWindow } from '@/domain/counselor/types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
type Day = (typeof DAYS)[number];

const DEFAULT_START = '09:00';
const DEFAULT_END = '12:00';
const TIME_STEP_MINUTES = 15;
const MIN_DURATION_MINUTES = 15;
const MAX_DURATION_MINUTES = 8 * 60;
const MAX_WINDOWS_PER_DAY = 8;

interface TimeWindow {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
}

type WeeklySchedule = Record<Day, TimeWindow[]>;

const defaultSchedule = (): WeeklySchedule =>
  Object.fromEntries(DAYS.map((d) => [d, []])) as WeeklySchedule;

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function getAutoLabel(startTime: string): string {
  const [h] = startTime.split(':').map(Number);
  if (h >= 5 && h < 12) return 'Morning';
  if (h >= 12 && h < 17) return 'Afternoon';
  if (h >= 17 && h <= 23) return 'Evening';
  return 'Night';
}

function isValidTime(time: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function fromMinutes(totalMinutes: number): string {
  const safe = Math.max(0, Math.min(23 * 60 + 59, totalMinutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function snapToStep(totalMinutes: number, step = TIME_STEP_MINUTES): number {
  return Math.floor(totalMinutes / step) * step;
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);
}

function sortWindows(windows: TimeWindow[]): TimeWindow[] {
  return [...windows].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
}

function getValidationError(
  dayWindows: TimeWindow[],
  startTime: string,
  endTime: string,
): string | null {
  if (!startTime || !endTime) {
    return 'Start and end time are required.';
  }

  if (!isValidTime(startTime) || !isValidTime(endTime)) {
    return 'Please enter valid 24-hour time values.';
  }

  const start = toMinutes(startTime);
  const end = toMinutes(endTime);

  if (start >= end) {
    return 'End time must be after start time.';
  }

  const duration = end - start;
  if (duration < MIN_DURATION_MINUTES) {
    return `Minimum duration is ${MIN_DURATION_MINUTES} minutes.`;
  }

  if (duration > MAX_DURATION_MINUTES) {
    return `Maximum duration is ${MAX_DURATION_MINUTES / 60} hours.`;
  }

  if (dayWindows.length >= MAX_WINDOWS_PER_DAY) {
    return `Maximum ${MAX_WINDOWS_PER_DAY} windows are allowed per day.`;
  }

  const conflict = dayWindows.find((w) => overlaps(startTime, endTime, w.startTime, w.endTime));
  if (conflict) {
    return `This window overlaps with an existing slot (${conflict.startTime} – ${conflict.endTime}).`;
  }

  return null;
}

export function CounselorAvailabilityPage() {
  const { accessToken } = useAuth();
  const { showError } = useNotification();
  const counselorDataService = getCounselorDataService();
  const [schedule, setSchedule] = useState<WeeklySchedule>(defaultSchedule);
  const [addingFor, setAddingFor] = useState<Day | null>(null);
  const [newStart, setNewStart] = useState(DEFAULT_START);
  const [newEnd, setNewEnd] = useState(DEFAULT_END);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const scheduleFromWindows = useMemo(
    () => (windows: CounselorAvailabilityWindow[]): WeeklySchedule => {
      const next = defaultSchedule();
      windows.forEach((window) => {
        const day = window.day as Day;
        if (!next[day]) return;
        next[day].push({
          id: window.id,
          label: window.label,
          startTime: window.startTime,
          endTime: window.endTime,
        });
      });

      for (const day of DAYS) {
        next[day] = sortWindows(next[day]);
      }

      return next;
    },
    [],
  );

  const toAvailabilityPayload = (nextSchedule: WeeklySchedule) => ({
    windows: DAYS.flatMap((day) =>
      sortWindows(nextSchedule[day]).map((window) => ({
        day,
        startTime: window.startTime,
        endTime: window.endTime,
        label: window.label,
      })),
    ),
  });

  useEffect(() => {
    if (!accessToken) return;
    let active = true;

    setIsLoading(true);
    counselorDataService
      .listAvailability(accessToken)
      .then((windows) => {
        if (!active) return;
        setSchedule(scheduleFromWindows(windows));
      })
      .catch((error) => {
        if (!active) return;
        showError('Failed to load availability', error instanceof Error ? error.message : 'Please try again.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken, counselorDataService, scheduleFromWindows, showError]);

  const totalWindows = Object.values(schedule).reduce((sum, windows) => sum + windows.length, 0);
  const autoLabel = getAutoLabel(newStart);

  const validationError =
    addingFor && isValidTime(newStart) && isValidTime(newEnd)
      ? getValidationError(schedule[addingFor], newStart, newEnd)
      : null;

  const durationMinutes =
    isValidTime(newStart) && isValidTime(newEnd)
      ? Math.max(toMinutes(newEnd) - toMinutes(newStart), 0)
      : 0;

  const resetDialogTimes = () => {
    setNewStart(DEFAULT_START);
    setNewEnd(DEFAULT_END);
  };

  const handleStartTimeChange = (value: string) => {
    setNewStart(value);
    if (!isValidTime(value) || !isValidTime(newEnd)) {
      return;
    }

    const start = toMinutes(value);
    const end = toMinutes(newEnd);
    if (end <= start) {
      const autoEnd = fromMinutes(snapToStep(Math.min(start + 60, 23 * 60 + 59)));
      setNewEnd(autoEnd);
    }
  };

  const handleAdd = async () => {
    if (!accessToken) {
      showError('Unable to update availability', 'You are not authenticated.');
      return;
    }
    if (!addingFor) return;

    const error = getValidationError(schedule[addingFor], newStart, newEnd);
    if (error) {
      showError('Invalid time window', error);
      return;
    }

    const nextSchedule = {
      ...schedule,
      [addingFor]: sortWindows([
        ...schedule[addingFor],
        { id: generateId(), label: autoLabel, startTime: newStart, endTime: newEnd },
      ]),
    };

    setIsSaving(true);
    try {
      const savedWindows = await counselorDataService.replaceAvailability(accessToken, toAvailabilityPayload(nextSchedule));
      setSchedule(scheduleFromWindows(savedWindows));
      setAddingFor(null);
      resetDialogTimes();
    } catch (saveError) {
      showError('Failed to save availability', saveError instanceof Error ? saveError.message : 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (day: Day, id: string) => {
    if (!accessToken) {
      showError('Unable to update availability', 'You are not authenticated.');
      return;
    }

    const nextSchedule = {
      ...schedule,
      [day]: schedule[day].filter((w) => w.id !== id),
    };

    setIsSaving(true);
    try {
      const savedWindows = await counselorDataService.replaceAvailability(accessToken, toAvailabilityPayload(nextSchedule));
      setSchedule(scheduleFromWindows(savedWindows));
    } catch (saveError) {
      showError('Failed to save availability', saveError instanceof Error ? saveError.message : 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const labelColor: Record<string, string> = {
    Morning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    Afternoon: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    Evening: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
    Night: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };

  return (
    <div className="space-y-6 p-4 md:p-6 pb-20">
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white p-7 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold uppercase tracking-widest text-blue-200 mb-2">
              <Calendar className="w-3.5 h-3.5" /> Weekly Schedule
            </div>
            <h2 className="text-2xl md:text-3xl font-black">Availability</h2>
            <p className="text-blue-100/70 text-sm">
              Define the time windows each day when you&apos;re available for appointments.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-3xl font-black">{totalWindows}</span>
            <span className="text-xs text-blue-200 font-bold uppercase tracking-widest">Time Windows Set</span>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-[20px] border border-border bg-card p-6 text-sm font-medium text-muted-foreground">
          Loading availability...
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {DAYS.map((day) => {
          const windows = sortWindows(schedule[day]);
          return (
            <Card key={day} className="rounded-[20px] border border-border shadow-sm bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                    {day}
                  </CardTitle>
                  <Dialog
                    open={addingFor === day}
                    onOpenChange={(open) => {
                      if (open) {
                        setAddingFor(day);
                        return;
                      }
                      setAddingFor(null);
                      resetDialogTimes();
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0 rounded-lg" disabled={isSaving}>
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm">
                      <DialogHeader>
                        <DialogTitle>Add Window — {day}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        {/*<div className="flex items-center gap-3 bg-muted rounded-xl px-4 py-3">
                          <span className="text-xs text-muted-foreground font-medium">Auto-label:</span>
                          <Badge className={`text-xs font-bold border-0 ${labelColor[autoLabel] || labelColor.Night}`}>
                            {autoLabel}
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-auto">Based on start time</span>
                        </div>*/}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Start Time</Label>
                            <Input
                              type="time"
                              step={TIME_STEP_MINUTES * 60}
                              value={newStart}
                              onChange={(e) => handleStartTimeChange(e.target.value)}
                              className="rounded-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>End Time</Label>
                            <Input
                              type="time"
                              step={TIME_STEP_MINUTES * 60}
                              min={newStart}
                              value={newEnd}
                              onChange={(e) => setNewEnd(e.target.value)}
                              className="rounded-xl"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-xs">
                          <span className="font-medium text-muted-foreground">Duration</span>
                          <span className="font-bold text-foreground">{durationMinutes} min</span>
                        </div>

                        {validationError && (
                          <div className="flex items-start gap-2 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-xl px-3 py-2">
                            <span className="text-xs text-orange-700 dark:text-orange-400 font-medium">
                              ⚠ {validationError}
                            </span>
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setAddingFor(null);
                            resetDialogTimes();
                          }}
                          className="rounded-xl"
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleAdd} disabled={!!validationError || isSaving} className="rounded-xl">
                          {isSaving ? 'Saving...' : 'Add Window'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {windows.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2">No windows — tap + to add</p>
                ) : (
                  windows.map((w) => (
                    <div key={w.id} className="flex items-center justify-between gap-2 bg-muted rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-medium text-foreground truncate">
                          {w.startTime} – {w.endTime}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 rounded-lg text-muted-foreground hover:text-destructive shrink-0"
                        disabled={isSaving}
                        onClick={() => handleRemove(day, w.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      )}
    </div>
  );
}