import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/app/providers/AuthProvider";
import { getComplianceService } from "@/domain/compliance/compliance.service";
import type { ComplianceItem } from "@/domain/compliance/types";
import { PageHeader } from "@/app/ui/PageHeader";
import { LoadingState } from "@/app/ui/LoadingState";
import { EmptyState } from "@/app/ui/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { ClipboardCheck, Plus, Edit, Trash2, AlertTriangle, Clock, CheckCircle, XCircle, Calendar } from "lucide-react";
import { logger } from "@/lib/logger";
import { config } from "@/lib/config";
import { useNotification } from "@/hooks/useNotification";
import { useLanguage } from "@/app/providers/LanguageProvider";

export function CompliancePage() {
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { t } = useLanguage();
  const [items, setItems] = useState<ComplianceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !accessToken) return;

    const loadCompliance = async () => {
      try {
        const service = getComplianceService();
        const data = await service.getAll(accessToken);
        setItems(data);
        logger.debug("Service logs loaded", { count: data.length });
      } catch (error) {
        logger.error("Error loading service logs", { error });
        showError(t.common.error, t.compliance.loadFailed);
      } finally {
        setIsLoading(false);
      }
    };

    loadCompliance();
  }, [user, accessToken, showError]);

  const handleDelete = async () => {
    if (!deleteId || !accessToken) return;
    
    try {
      const service = getComplianceService();
      await service.delete(accessToken, deleteId);
      setItems(prev => prev.filter(i => i.id !== deleteId));
      showSuccess(t.compliance.deleteSuccess);
      logger.info("Service log deleted", { id: deleteId });
    } catch (error) {
      logger.error("Error deleting service log", { error });
      showError(t.compliance.deleteFailed);
    } finally {
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return <LoadingState message={t.common.loading} />;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "provided":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "scheduled":
        return <Clock className="h-5 w-5 text-blue-600" />;
      case "missed":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "cancelled":
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "provided":
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">{t.compliance.provided}</Badge>;
      case "scheduled":
        return <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">{t.compliance.scheduled}</Badge>;
      case "missed":
        return <Badge variant="destructive">{t.compliance.missed}</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="border-orange-600 text-orange-600">{t.compliance.cancelled}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatMinutes = (minutes?: number) => {
    if (!minutes) return "0 min";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Calculate summary metrics
  const totalProvided = items.filter(i => i.status === "provided").length;
  const totalMissed = items.filter(i => i.status === "missed").length;
  const totalScheduled = items.filter(i => i.status === "scheduled").length;
  const complianceRate = items.length > 0 
    ? Math.round((totalProvided / (totalProvided + totalMissed || 1)) * 100) 
    : 0;

  // Calculate total minutes
  const minutesProvided = items
    .filter(i => i.status === "provided")
    .reduce((sum, i) => sum + (i.minutesProvided || 0), 0);
  const minutesRequired = items.reduce((sum, i) => sum + (i.minutesRequired || 0), 0);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title={t.compliance.title}
        description={t.compliance.subtitle}
        action={
          <Button onClick={() => navigate(config.routes.complianceNew)}>
            <Plus className="mr-2 h-4 w-4" />
            {t.compliance.logService}
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title={t.compliance.noLogs}
          description={t.compliance.noLogsDesc}
        />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t.compliance.servicesProvided}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{totalProvided}</div>
                <p className="text-xs text-muted-foreground mt-1">{formatMinutes(minutesProvided)} {t.compliance.total}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t.compliance.servicesMissed}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{totalMissed}</div>
                <p className="text-xs text-muted-foreground mt-1">{t.compliance.needsMakeup}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t.compliance.upcoming}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{totalScheduled}</div>
                <p className="text-xs text-muted-foreground mt-1">{t.compliance.scheduledSessions}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t.compliance.complianceRate}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{complianceRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {minutesProvided} {t.common.of} {minutesRequired} min
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Service Logs List */}
          <div className="space-y-3">
            {items.map((item) => {
              const minutesMatch = item.minutesProvided === item.minutesRequired;
              const showIssue = item.issueReported;

              return (
                <Card key={item.id} className={showIssue ? "border-l-4 border-l-orange-500" : ""}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        {getStatusIcon(item.status)}
                        <div className="flex-1 space-y-2">
                          {/* Header */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-base">{item.serviceType}</h3>
                            {getStatusBadge(item.status)}
                            {showIssue && (
                              <Badge variant="outline" className="border-orange-600 text-orange-600">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {t.compliance.issueReported}
                              </Badge>
                            )}
                          </div>

                          {/* Details */}
                          <div className="grid gap-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(item.serviceDate).toLocaleDateString()}</span>
                              {item.serviceProvider && (
                                <span className="text-xs">• {t.compliance.provider}: {item.serviceProvider}</span>
                              )}
                            </div>

                            {/* Minutes Tracking */}
                            {item.status === "provided" && (
                              <div className="flex items-center gap-3">
                                <div className={`text-sm font-medium ${minutesMatch ? "text-green-600" : "text-orange-600"}`}>
                                  {formatMinutes(item.minutesProvided)} {t.compliance.minutesProvided}
                                </div>
                                <span className="text-muted-foreground">{t.common.of}</span>
                                <div className="text-sm font-medium text-muted-foreground">
                                  {formatMinutes(item.minutesRequired)} {t.compliance.minutesRequired}
                                </div>
                                {!minutesMatch && (
                                  <Badge variant="outline" className="text-xs">
                                    {(item.minutesProvided || 0) < (item.minutesRequired || 0) ? t.compliance.under : t.compliance.over}
                                  </Badge>
                                )}
                              </div>
                            )}

                            {item.status === "scheduled" && (
                              <div className="text-sm text-muted-foreground">
                                {t.compliance.scheduledFor} {formatMinutes(item.minutesRequired)}
                              </div>
                            )}

                            {item.status === "missed" && item.resolutionStatus && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">{t.compliance.resolution}: </span>
                                <span className="font-medium">{item.resolutionStatus}</span>
                              </div>
                            )}

                            {item.notes && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {item.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(config.routes.complianceEdit(item.id))}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(item.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              {t.compliance.deleteTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.compliance.deleteConfirm}
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
    </div>
  );
}
