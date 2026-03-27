import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getIEPService } from "@/domain/iep/iep.service.ts";
import { getChildService } from "@/domain/child/child.service.ts";
import { PageHeader } from "@/app/ui/PageHeader.tsx";
import { AiInformationalDisclaimer } from "@/app/ui/AiInformationalDisclaimer.tsx";
import { useNotification } from "@/hooks/useNotification.tsx";
import { useAuth } from "@/app/providers/AuthProvider.tsx";
import { logger } from "@/lib/logger.ts";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { AlertTriangle, Sparkles, FileUp, UserPlus, BarChart4 } from "lucide-react";

import type { Child } from "@/domain/child/types.ts";

import { IEPAnalyzerProvider, useIEPAnalyzer } from "@/domain/iep/components/context/IEPAnalyzerContext.tsx";
import { FileUploadStep } from "@/domain/iep/components/FileUploadStep.tsx";

export function IEPAnalyzerPage() {
  return (
    <IEPAnalyzerProvider>
      <IEPAnalyzerWorkflow />
    </IEPAnalyzerProvider>
  );
}

interface DuplicatePending {
  formData: FormData;
  existingDocId: string;
  fileName: string;
  uploadedDate: string;
}

function IEPAnalyzerWorkflow() {
  const { childId, setChildId } = useIEPAnalyzer();

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duplicatePending, setDuplicatePending] = useState<DuplicatePending | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const isWelcome = searchParams.get("welcome") === "1";

  const { accessToken, user } = useAuth();
  const { showError } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    const loadChildren = async () => {
      try {
        const data = await getChildService().getAll(accessToken);
        setChildren(data);
        if (data.length === 1 && !childId) setChildId(data[0].id);
      } catch (err) {
        logger.error("Failed to load children", { err });
        showError("Failed to load children");
      }
    };
    loadChildren();
  }, []);


  /** Upload file to cloud and navigate to the dedicated analysis route */
  const handleStartAnalysis = async (file: File, cid: string) => {
    setIsProcessing(true);
    try {
      const service = getIEPService();
      const formData = new FormData();
      formData.append('childId', cid);
      formData.append('file', file);

      let docId: string;
      try {
        const { documentId } = await service.uploadDocument(formData);
        docId = documentId;
      } catch (uploadError: any) {
        if (uploadError?.message?.includes("DUPLICATE_DOCUMENT")) {
          // Try to extract existing doc info and confirm replacement
          const errordata = JSON.parse(uploadError.message);
          const existingDoc = errordata.details?.existingDocument;
          if (!existingDoc) throw uploadError;

          const uploadedDate = existingDoc.uploadDate
            ? new Date(existingDoc.uploadDate).toLocaleDateString()
            : 'unknown date';
          setDuplicatePending({
            formData,
            existingDocId: existingDoc.documentId,
            fileName: existingDoc.fileName,
            uploadedDate,
          });
          setIsProcessing(false);
          return;
        } else {
          throw uploadError;
        }
      }

      // Navigate to the dedicated analysis page — analysis runs there
      navigate(`/iep/analyse/${docId}`);
    } catch (error: unknown) {
      logger.error("Upload failed", { error });
      const msg = error instanceof Error ? error.message : "Upload failed. Please try again.";
      showError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  /** Confirmed: delete duplicate and re-upload */
  const handleDuplicateConfirmed = async () => {
    if (!duplicatePending) return;
    const { formData, existingDocId } = duplicatePending;
    setDuplicatePending(null);
    setIsProcessing(true);
    try {
      const service = getIEPService();
      await service.delete(existingDocId);
      const { documentId } = await service.uploadDocument(formData);
      navigate(`/iep/analyse/${documentId}`);
    } catch (error: unknown) {
      logger.error("Replace upload failed", { error });
      const msg = error instanceof Error ? error.message : "Upload failed. Please try again.";
      showError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  /** Create a placeholder child profile that will be populated from IEP extraction */
  const handleCreateNewChild = async (): Promise<string | null> => {
    try {
      const childService = getChildService();
      const newChild = await childService.create(accessToken, {
        name: "New Child (pending IEP analysis)",
        age: 0,
        grade: "",
      });
      // Refresh child list so it shows in selector
      setChildren(prev => [...prev, newChild]);
      setChildId(newChild.id);
      logger.info("Created placeholder child profile", { childId: newChild.id });
      return newChild.id;
    } catch (err) {
      logger.error("Failed to create child profile", { err });
      showError("Failed to create child profile");
      return null;
    }
  };

  /** Navigate to the analysis page for an already-uploaded document, forcing a fresh AI run */
  const handleAnalyzeExisting = (docId: string, _cid: string) => {
    navigate(`/iep/analyse/${docId}?reanalyze=1`);
  };

  const dismissWelcome = () => {
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader title="IEP Analysis" description="AI-powered IEP document extraction" />

      {/* ── Welcome banner for new users ── */}
      {isWelcome && (
        <Card className="max-w-5xl mx-auto bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-0 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-white/10 blur-[80px] rounded-full" />
          <CardContent className="relative z-10 p-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold uppercase tracking-widest text-indigo-100">
              <Sparkles className="w-3.5 h-3.5" /> Welcome to AskIEP
            </div>
            <h2 className="text-2xl md:text-3xl font-black leading-tight">
              Hi {user?.displayName || "there"}! Let's get started.
            </h2>
            <p className="text-indigo-100/90 text-base leading-relaxed max-w-2xl">
              Upload your child's IEP document below and we'll automatically extract all the important details — goals, services, accommodations, and student information — to set up your child's profile.
            </p>
            <div className="flex flex-wrap gap-6 pt-2 text-sm">
              <div className="flex items-center gap-2 text-indigo-200">
                <FileUp className="w-4 h-4" /> Upload IEP document
              </div>
              <div className="flex items-center gap-2 text-indigo-200">
                <UserPlus className="w-4 h-4" /> Child profile created automatically
              </div>
              <div className="flex items-center gap-2 text-indigo-200">
                <BarChart4 className="w-4 h-4" /> AI extracts goals, services & more
              </div>
            </div>
            <button onClick={dismissWelcome} className="absolute top-4 right-4 text-white/50 hover:text-white text-sm">
              Dismiss
            </button>
          </CardContent>
        </Card>
      )}

      <AiInformationalDisclaimer scope="AI-generated IEP extraction, summary, and rights awareness content" />

      <div className="max-w-5xl mx-auto">
        <FileUploadStep
          children={children}
          selectedFile={selectedFile}
          onFileChange={setSelectedFile}
          onNext={handleStartAnalysis}
          onAnalyzeExisting={handleAnalyzeExisting}
          onCreateNewChild={handleCreateNewChild}
          isProcessing={isProcessing}
        />

        {/* ── Duplicate document confirmation dialog ── */}
        <Dialog open={!!duplicatePending} onOpenChange={(open) => { if (!open) setDuplicatePending(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Duplicate Document
              </DialogTitle>
              <DialogDescription className="space-y-1">
                <span>
                  A document <strong>&ldquo;{duplicatePending?.fileName}&rdquo;</strong> already exists for this child
                  {duplicatePending?.uploadedDate ? ` (uploaded ${duplicatePending.uploadedDate})` : ''}.
                </span>
                <br />
                <span>Delete the old version and upload this new document?</span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setDuplicatePending(null)} disabled={isProcessing}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDuplicateConfirmed} disabled={isProcessing}>
                {isProcessing ? 'Uploading…' : 'Replace & Upload'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
