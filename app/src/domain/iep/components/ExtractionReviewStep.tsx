import { useState } from "react";
import { useIEPAnalyzer } from "./context/IEPAnalyzerContext.tsx";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";
import { AlertTriangle, Info, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { Textarea } from "@/components/ui/textarea.tsx";
import { AiInformationalDisclaimer } from "@/app/ui/AiInformationalDisclaimer.tsx";

interface ExtractionReviewStepProps {
  isLoading: boolean;
  onNext: () => void;
}

const ConfidenceBadge = ({ score }: { score: number }) => {
  const variant = score >= 0.9 ? 'default' : score >= 0.7 ? 'secondary' : 'destructive';
  const label = score >= 0.9 ? 'High' : score >= 0.7 ? 'Medium' : 'Low';
  return <Badge variant={variant}>{label} ({Math.round(score * 100)}%)</Badge>;
};

export function ExtractionReviewStep({
  isLoading,
  onNext,
}: ExtractionReviewStepProps) {
  const { extractionData, addCorrection } = useIEPAnalyzer();
  const [reviewCompleted, setReviewCompleted] = useState(false);
  const confidence = extractionData?.confidence;

  const handleFieldCorrection = (field: string, originalValue: unknown, newValue: unknown) => {
    addCorrection({
      field,
      originalValue,
      correctedValue: newValue,
      reason: "User correction"
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading extraction data...
        </CardContent>
      </Card>
    );
  }

  if (!extractionData) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No extraction data available
        </CardContent>
      </Card>
    );
  }

  const data = extractionData as any; // Type assertion for extended fields

  return (
    <div className="space-y-6">
      <AiInformationalDisclaimer scope="AI-generated extraction preview and rights awareness content" />

      {/* Summary and Red Flags Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Summary Card */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Plain-Language Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground italic leading-relaxed">
              {data.summary ? `"${data.summary}"` : "Summary will be available after analysis completes. Try re-analyzing the document."}
            </p>
          </CardContent>
        </Card>

        {/* Red Flags Card */}
        <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-lg text-amber-900 dark:text-amber-100">
                Advocacy Red Flags
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {data.redFlags && data.redFlags.length > 0 ? (
              <ul className="space-y-2">
                {data.redFlags.map((flag: string, i: number) => (
                  <li key={i} className="text-sm text-amber-800 dark:text-amber-200 flex gap-2">
                    <span className="text-amber-600">•</span>
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-amber-700 dark:text-amber-300">No red flags identified yet. Try re-analyzing the document for a detailed assessment.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rights & Considerations Card */}
      <Card className="bg-slate-900 dark:bg-slate-800 text-white border-slate-700">
        <CardHeader>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            <CardTitle className="text-lg">Rights & Considerations</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-100 leading-relaxed">
            {data.legalLens || "Legal analysis will be available after re-analyzing the document."}
          </p>
        </CardContent>
      </Card>

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <CardTitle>Review & Edit Extracted Data</CardTitle>
          <CardDescription>
            Review the extracted information and verify accuracy before finalizing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="goals">
                Goals ({data.goals?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="services">
                Services ({data.services?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="accommodations">
                Accommodations ({data.accommodations?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {data.goals?.length || 0}
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Goals Extracted
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                  <div className="flex items-center gap-3">
                    <Info className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {data.services?.length || 0}
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Services Identified
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {data.accommodations?.length || 0}
                      </p>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        Accommodations Found
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {data.studentName && (
                <div className="space-y-3 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold">Student Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Student Name</Label>
                      <p className="font-medium">{data.studentName}</p>
                    </div>
                    {data.studentDob && (
                      <div>
                        <Label className="text-muted-foreground">Date of Birth</Label>
                        <p className="font-medium">{new Date(data.studentDob).toLocaleDateString()}</p>
                      </div>
                    )}
                    {data.grade && (
                      <div>
                        <Label className="text-muted-foreground">Grade</Label>
                        <p className="font-medium">{data.grade}</p>
                      </div>
                    )}
                    {data.schoolName && (
                      <div>
                        <Label className="text-muted-foreground">School</Label>
                        <p className="font-medium">{data.schoolName}</p>
                      </div>
                    )}
                    {data.schoolDistrict && (
                      <div>
                        <Label className="text-muted-foreground">District</Label>
                        <p className="font-medium">{data.schoolDistrict}</p>
                      </div>
                    )}
                    {data.primaryDisability && (
                      <div>
                        <Label className="text-muted-foreground">Primary Disability</Label>
                        <p className="font-medium">{data.primaryDisability}</p>
                      </div>
                    )}
                    {data.secondaryDisability && (
                      <div>
                        <Label className="text-muted-foreground">Secondary Disability</Label>
                        <p className="font-medium">{data.secondaryDisability}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Goals Tab */}
            <TabsContent value="goals" className="space-y-4 mt-4">
              {!data.goals || data.goals.length === 0 ? (
                <Alert>
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>No goals identified</AlertTitle>
                  <AlertDescription>
                    Input text does not contain valid IEP goal data.
                  </AlertDescription>
                </Alert>
              ) : (
                data.goals.map((goal: any, i: number) => (
                  <Card key={i} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Goal {i + 1}</h4>
                        {confidence?.goals && typeof confidence.goals === 'number' ? (
                          <ConfidenceBadge score={confidence.goals} />
                        ) : Array.isArray(confidence?.goals) && confidence.goals[i] ? (
                          <ConfidenceBadge score={confidence.goals[i]} />
                        ) : null}
                      </div>
                      <div className="grid gap-3">
                        <div>
                          <Label>Domain</Label>
                          <Input 
                            value={goal.domain || ''} 
                            disabled 
                            className="bg-muted"
                          />
                        </div>
                        <div>
                          <Label>Goal Name</Label>
                          <Input 
                            value={goal.goalName || ''} 
                            disabled 
                            className="bg-muted"
                          />
                        </div>
                        <div>
                          <Label>Baseline</Label>
                          <Textarea 
                            value={goal.baseline || ''} 
                            disabled 
                            className="bg-muted min-h-[80px]"
                          />
                        </div>
                        <div>
                          <Label>Target</Label>
                          <Input 
                            value={goal.target || ''} 
                            disabled 
                            className="bg-muted"
                          />
                        </div>
                        {goal.measurementMethod && (
                          <div>
                            <Label>Measurement Method</Label>
                            <Input 
                              value={goal.measurementMethod} 
                              disabled 
                              className="bg-muted"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services" className="space-y-4 mt-4">
              {!data.services || data.services.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>No related services found in the document.</AlertDescription>
                </Alert>
              ) : (
                data.services.map((service: any, i: number) => (
                  <Card key={i} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">
                          {service.serviceType
                            ? service.serviceType.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
                            : `Service ${i + 1}`}
                        </h4>
                        {service.provider && (
                          <Badge variant="secondary">{service.provider}</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        {service.minutesPerSession != null && (
                          <div>
                            <Label className="text-muted-foreground">Minutes/Session</Label>
                            <p className="font-medium">{service.minutesPerSession}</p>
                          </div>
                        )}
                        {service.sessionsPerWeek != null && (
                          <div>
                            <Label className="text-muted-foreground">Sessions/Week</Label>
                            <p className="font-medium">{service.sessionsPerWeek}</p>
                          </div>
                        )}
                        {service.startDate && (
                          <div>
                            <Label className="text-muted-foreground">Start Date</Label>
                            <p className="font-medium">{new Date(service.startDate).toLocaleDateString()}</p>
                          </div>
                        )}
                        {service.endDate && (
                          <div>
                            <Label className="text-muted-foreground">End Date</Label>
                            <p className="font-medium">{new Date(service.endDate).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Accommodations & Modifications Tab */}
            <TabsContent value="accommodations" className="space-y-4 mt-4">
              {data.accommodations && data.accommodations.length > 0 ? (
                <Card className="p-4">
                  <h4 className="font-medium mb-3">Accommodations</h4>
                  <ul className="space-y-2">
                    {data.accommodations.map((acc: string, i: number) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{acc}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>No accommodations found in the document.</AlertDescription>
                </Alert>
              )}
              {data.modifications && data.modifications.length > 0 && (
                <Card className="p-4">
                  <h4 className="font-medium mb-3">Modifications</h4>
                  <ul className="space-y-2">
                    {data.modifications.map((mod: string, i: number) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <span>{mod}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </TabsContent>

            {/* Metadata Tab */}
            <TabsContent value="metadata" className="space-y-4 mt-4">
              <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.iepStartDate && (
                    <div>
                      <Label className="text-muted-foreground">IEP Start Date</Label>
                      <p className="font-medium">{new Date(data.iepStartDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {data.iepEndDate && (
                    <div>
                      <Label className="text-muted-foreground">IEP End Date</Label>
                      <p className="font-medium">{new Date(data.iepEndDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {data.iepMeetingDate && (
                    <div>
                      <Label className="text-muted-foreground">IEP Meeting Date</Label>
                      <p className="font-medium">{new Date(data.iepMeetingDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {data.schoolYear && (
                    <div>
                      <Label className="text-muted-foreground">School Year</Label>
                      <p className="font-medium">{data.schoolYear}</p>
                    </div>
                  )}
                  {data.grade && (
                    <div>
                      <Label className="text-muted-foreground">Grade</Label>
                      <p className="font-medium">{data.grade}</p>
                    </div>
                  )}
                  {confidence && (
                    <div className="col-span-full">
                      <Label className="text-muted-foreground">Overall Confidence</Label>
                      <div className="mt-1">
                        <ConfidenceBadge score={confidence.overall || 0} />
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
