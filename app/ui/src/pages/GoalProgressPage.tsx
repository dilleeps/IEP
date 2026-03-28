import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/app/providers/AuthProvider";
import { getGoalsService } from "@/domain/goals/goals.service";
import { getChildService } from "@/domain/child/child.service";
import type { Goal } from "@/domain/goals/types";
import type { Child } from "@/domain/child/types";
import { PageHeader } from "@/app/ui/PageHeader";
import { LoadingState } from "@/app/ui/LoadingState";
import { EmptyState } from "@/app/ui/EmptyState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/http";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Target, Plus, Edit, Trash2, AlertTriangle, TrendingUp, FileUp, Info } from "lucide-react";
import { logger } from "@/lib/logger";
import { config } from "@/lib/config";
import { useNotification } from "@/hooks/useNotification";
import { useLanguage } from "@/app/providers/LanguageProvider";

/** Calculate expected progress % based on how far we are between startDate and targetDate */
function calcExpectedProgress(startDate?: string, targetDate?: string): number | null {
  if (!startDate || !targetDate) return null;
  const start = new Date(startDate).getTime();
  const end = new Date(targetDate).getTime();
  if (isNaN(start) || isNaN(end) || end <= start) return null;
  const now = Date.now();
  if (now <= start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

export function GoalProgressPage() {
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { t } = useLanguage();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [progressGoal, setProgressGoal] = useState<Goal | null>(null);
  const [newProgress, setNewProgress] = useState<number>(0);

  useEffect(() => {
    if (!user || !accessToken) return;

    const loadChildren = async () => {
      setIsLoading(true);
      try {
        const childService = getChildService();
        const fetchedChildren = await childService.getAll(accessToken);
        setChildren(fetchedChildren);

        if (fetchedChildren.length > 0) {
          setSelectedChildId((prev) => prev ?? fetchedChildren[0].id);
        }
      } catch (error) {
        logger.error("Error loading children", { error });
        setChildren([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadChildren();
  }, [user, accessToken]);

  useEffect(() => {
    const loadGoals = async () => {
      if (!accessToken || !selectedChildId) return;
      setIsLoading(true);
      try {
        const goalService = getGoalsService();
        const allGoals = await goalService.getAllByChild(accessToken, selectedChildId);
        setGoals(allGoals);
        logger.debug("Goals loaded", { count: allGoals.length, childId: selectedChildId });
      } catch (error) {
        logger.error("Error loading goals", { error, childId: selectedChildId });
        setGoals([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadGoals();
  }, [accessToken, selectedChildId]);

  const handleDelete = async () => {
    if (!deleteId || !accessToken) return;
    
    try {
      const service = getGoalsService();
      await service.delete(accessToken, deleteId);
      setGoals(prev => prev.filter(g => g.id !== deleteId));
      showSuccess(t.goalProgress.deleteSuccess);
      logger.info("Goal deleted", { id: deleteId });
    } catch (error) {
      logger.error("Error deleting goal", { error });
      showError(t.goalProgress.deleteFailed);
    } finally {
      setDeleteId(null);
    }
  };

  const handleUpdateProgress = async () => {
    if (!progressGoal || !accessToken) return;
    
    try {
      const service = getGoalsService();
      const url = `${config.api.endpoints.goals.update.replace(":id", progressGoal.id)}/progress`;
      
      await apiRequest(url, {
        method: "PATCH",
        token: accessToken,
        body: {
          progressPercentage: newProgress,
          status: newProgress >= 100 ? 'achieved' : newProgress > 0 ? 'in_progress' : 'not_started',
        },
      });
      
      // Update local state
      setGoals(prev => prev.map(g => 
        g.id === progressGoal.id 
          ? { ...g, current: newProgress } 
          : g
      ));
      
      showSuccess(t.goalProgress.updateSuccess);
      logger.info("Progress updated", { id: progressGoal.id, progress: newProgress });
    } catch (error) {
      logger.error("Error updating progress", { error });
      showError(t.goalProgress.updateFailed);
    } finally {
      setProgressGoal(null);
      setNewProgress(0);
    }
  };

  if (isLoading) {
    return <LoadingState message={t.common.loading} />;
  }

  const getStatusBadge = (progress: number, expected: number | null) => {
    // If we have expected progress, compare actual to expected
    if (expected !== null) {
      const diff = progress - expected;
      if (diff >= -10) {
        // Within 10% of expected or ahead
        return <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-950 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-200">{t.goalProgress.onTrack}</span>;
      } else if (diff >= -25) {
        // 10-25% behind expected
        return <span className="inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-950 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:text-yellow-200">{t.goalProgress.needsAttention}</span>;
      } else {
        // More than 25% behind expected
        return <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-950 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:text-red-200">{t.goalProgress.atRisk}</span>;
      }
    }
    // Fallback: no dates available, use absolute thresholds
    if (progress >= 70) {
      return <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-950 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-200">{t.goalProgress.onTrack}</span>;
    } else if (progress >= 40) {
      return <span className="inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-950 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:text-yellow-200">{t.goalProgress.needsAttention}</span>;
    } else {
      return <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-950 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:text-red-200">{t.goalProgress.atRisk}</span>;
    }
  };

  const selectedChild = children.find((child) => child.id === selectedChildId) || null;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title={t.goalProgress.title}
        description={t.goalProgress.subtitle}
        action={
          <div className="flex flex-wrap items-center gap-3">
            {children.length > 1 && (
              <Select value={selectedChildId ?? undefined} onValueChange={(value) => setSelectedChildId(value)}>
                <SelectTrigger className="min-w-[180px] bg-card text-card-foreground border-border" size="sm">
                  <SelectValue placeholder={t.goalProgress.selectChild} />
                </SelectTrigger>
                <SelectContent>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button onClick={() => navigate(config.routes.goalProgressNew)} disabled={!selectedChildId}>
              <Plus className="mr-2 h-4 w-4" />
              {t.goalProgress.addGoal}
            </Button>
          </div>
        }
      />

      {/* How progress is calculated + upload prompt */}
      {children.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Info className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">{t.goalProgress.howCalculatedTitle}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t.goalProgress.howCalculatedDesc}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0"
              onClick={() => navigate(config.routes.iepAnalyzer)}
            >
              <FileUp className="mr-2 h-4 w-4" />
              {t.goalProgress.uploadIep}
            </Button>
          </CardContent>
        </Card>
      )}

      {children.length === 0 ? (
        <EmptyState
          icon={Target}
          title={t.goalProgress.addChildFirst}
          description={t.goalProgress.addChildFirstDesc}
          action={
            <Button onClick={() => navigate(config.routes.childProfileNew)}>
              <Plus className="mr-2 h-4 w-4" />
              {t.childProfile.addChild}
            </Button>
          }
        />
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title={t.goalProgress.noGoals}
          description={`Add goals to start tracking progress${selectedChild ? ` for ${selectedChild.name}` : ""}.`}
          action={
            <Button onClick={() => navigate(config.routes.goalProgressNew)} disabled={!selectedChildId}>
              <Plus className="mr-2 h-4 w-4" />
              {t.goalProgress.addGoal}
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const expected = calcExpectedProgress(goal.startDate, goal.targetDate);
            // Calculate progress bar width as % of the baseline-to-target range
            const range = (goal.target || 100) - (goal.baseline || 0);
            const progressWidth = range > 0
              ? Math.min(100, Math.max(0, ((goal.current - (goal.baseline || 0)) / range) * 100))
              : 0;
            return (
            <Card key={goal.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <CardTitle className="text-base">{goal.area || t.goalProgress.goal}</CardTitle>
                    <CardDescription>{goal.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(Math.round(progressWidth), expected)}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setProgressGoal(goal);
                        setNewProgress(goal.current || 0);
                      }}
                      title={t.goalProgress.updateProgress}
                    >
                      <TrendingUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(config.routes.goalProgressEdit(goal.id))}
                      title={t.goalProgress.editGoal}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(goal.id);
                      }}
                      title={t.goalProgress.deleteGoal}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t.goalProgress.progress}</span>
                    <span className="text-muted-foreground">{t.goalProgress.target}: {goal.target || 100}%</span>
                  </div>
                  {/* Progress bar with percentage label and expected progress marker */}
                  <div className="relative">
                    <div className="relative h-5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all rounded-full"
                        style={{ width: `${Math.round(progressWidth)}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-foreground">
                        {Math.round(progressWidth)}%
                      </span>
                    </div>
                    {expected !== null && (
                      <div
                        className="absolute top-0 h-5 flex items-center"
                        style={{ left: `${expected}%` }}
                        title={`${t.goalProgress.expected}: ${expected}%`}
                      >
                        <div className="w-0.5 h-7 -mt-1 bg-foreground/60 rounded-full" />
                      </div>
                    )}
                  </div>
                  {expected !== null && (
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="inline-block w-3 h-0.5 bg-foreground/60 rounded" />
                        {t.goalProgress.expected}: {expected}%
                      </span>
                      {Math.round(progressWidth) < expected ? (
                        <span className="text-amber-600 dark:text-amber-400">
                          {expected - Math.round(progressWidth)}% {t.goalProgress.behindExpected}
                        </span>
                      ) : Math.round(progressWidth) > expected ? (
                        <span className="text-green-600 dark:text-green-400">
                          {Math.round(progressWidth) - expected}% {t.goalProgress.aheadOfExpected}
                        </span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400">
                          {t.goalProgress.onTrackForDate}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">{t.goalProgress.baseline}</p>
                    <p className="text-sm font-medium">{goal.baselineText || `${goal.baseline || 0}%`}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t.goalProgress.current}</p>
                    <p className="text-sm font-medium">{Math.round(progressWidth)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t.goalProgress.target}</p>
                    <p className="text-sm font-medium">{goal.targetText || `${goal.target || 100}%`}</p>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground/70 italic pt-1">
                  {t.goalProgress.percentNote}
                </p>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              {t.goalProgress.deleteGoal}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.goalProgress.deleteGoalConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!progressGoal} onOpenChange={() => setProgressGoal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t.goalProgress.updateProgress}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.goalProgress.updateProgressDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="progress">{t.goalProgress.progressPercentage}</Label>
              <Input
                id="progress"
                type="number"
                min="0"
                max="100"
                value={newProgress}
                onChange={(e) => setNewProgress(Number(e.target.value))}
                placeholder={t.goalProgress.enterProgress}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.goalProgress.preview}</Label>
              <div className="relative h-5 w-full overflow-hidden rounded-full bg-primary/20">
                <div
                  className="h-full bg-primary transition-all rounded-full"
                  style={{ width: `${Math.max(newProgress, 0)}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-foreground">
                  {newProgress}% {t.goalProgress.complete}
                </span>
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdateProgress}>
              {t.goalProgress.updateProgress}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
