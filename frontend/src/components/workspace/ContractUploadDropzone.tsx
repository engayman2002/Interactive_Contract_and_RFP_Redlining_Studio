"use client";

import React, { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, FileText, UploadCloud } from "lucide-react";
import { uploadDocument } from "@/services/apiClient";
import { useAuthSession } from "@/services/authSession";

export interface ContractUploadDropzoneProps {
  onUploadComplete?: (documentId: string) => void;
  className?: string;
  compact?: boolean;
}

type UploadStage =
  | "idle"
  | "uploading"
  | "parsing"
  | "opening"
  | "error";

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export const ContractUploadDropzone: React.FC<ContractUploadDropzoneProps> = ({
  onUploadComplete,
  className = "",
  compact = false,
}) => {
  const router = useRouter();
  const { token } = useAuthSession();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [stage, setStage] = useState<UploadStage>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const validateAndSetFile = useCallback(
    (file: File) => {
      const validExtensions = [".docx", ".pdf"];
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      const isValidExt = validExtensions.includes(ext);

      if (!isValidExt) {
        setErrorMessage(
          `Unsupported file type: "${file.name}". Please upload a .docx or .pdf contract.`
        );
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setErrorMessage(
          `File too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed is 25MB.`
        );
        return;
      }

      setErrorMessage(null);
      setSelectedFile(file);
      if (!customTitle) {
        const derived = file.name.replace(/\.[^/.]+$/, "");
        setCustomTitle(derived);
      }
    },
    [customTitle]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleStartUpload = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (!selectedFile || stage !== "idle") {
      return;
    }

    try {
      setErrorMessage(null);
      setStage("uploading");

      // Stage 1: Uploading
      await new Promise((r) => setTimeout(r, 120));
      setStage("parsing");

      // Stage 2: Parsing & segmenting
      const result = await uploadDocument(selectedFile, customTitle, token);

      await new Promise((r) => setTimeout(r, 100));
      setStage("opening");

      // Stage 3: Opening Studio
      await new Promise((r) => setTimeout(r, 80));

      if (onUploadComplete) {
        onUploadComplete(result.document_id);
      }
      router.push(`/documents/${result.document_id}`);
    } catch (err) {
      setStage("error");
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Failed to process contract upload."
      );
    }
  };

  const progressPercentage =
    stage === "uploading"
      ? 33
      : stage === "parsing"
      ? 72
      : stage === "opening"
      ? 100
      : 0;

  return (
    <div
      data-testid="contract-upload-dropzone"
      className={`surface-card group relative overflow-hidden rounded-2xl border-2 border-dashed transition-all ${
        isDragOver
          ? "border-indigo-500 bg-indigo-50/80 ring-4 ring-indigo-500/15 dark:border-indigo-400 dark:bg-indigo-950/35"
          : "border-slate-300/80 bg-gradient-to-b from-white via-white to-slate-50/70 hover:border-indigo-400/80 dark:border-slate-700/80 dark:from-[#0C111E] dark:via-[#0B0F1A] dark:to-slate-900/60 dark:hover:border-indigo-500/60"
      } ${compact ? "p-6" : "p-8"} ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        data-testid="upload-file-input"
        accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileChange}
        className="hidden"
      />

      {stage === "idle" || stage === "error" ? (
        <div className="flex flex-col items-center text-center">
          {/* Layered Floating Document Visual */}
          <div className="relative flex h-20 w-40 items-center justify-center">
            <div
              aria-hidden="true"
              className="absolute left-3 top-3 flex h-12 w-10 -rotate-12 flex-col items-center justify-center rounded-lg border border-indigo-200/80 bg-white/95 shadow-sm transition-transform duration-300 group-hover:-rotate-6 dark:border-indigo-500/30 dark:bg-slate-800/95"
            >
              <span className="font-mono text-[9px] font-bold tracking-wider text-indigo-600 dark:text-indigo-300">
                DOCX
              </span>
              <span className="mt-1 h-0.5 w-5 rounded-full bg-indigo-200 dark:bg-indigo-500/40" />
              <span className="mt-0.5 h-0.5 w-4 rounded-full bg-slate-200 dark:bg-slate-600" />
            </div>
            <div
              aria-hidden="true"
              className="absolute right-3 top-3 flex h-12 w-10 rotate-12 flex-col items-center justify-center rounded-lg border border-slate-200/90 bg-white/95 shadow-sm transition-transform duration-300 group-hover:rotate-6 dark:border-slate-700 dark:bg-slate-800/95"
            >
              <span className="font-mono text-[9px] font-bold tracking-wider text-rose-600 dark:text-rose-400">
                PDF
              </span>
              <span className="mt-1 h-0.5 w-5 rounded-full bg-rose-200 dark:bg-rose-500/40" />
              <span className="mt-0.5 h-0.5 w-4 rounded-full bg-slate-200 dark:bg-slate-600" />
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Select contract file"
              className="relative z-10 flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl border border-indigo-200/90 bg-gradient-to-b from-white to-indigo-50/70 text-indigo-600 shadow-md ring-1 ring-inset ring-white/80 transition-all hover:scale-105 hover:border-indigo-400 dark:border-indigo-500/40 dark:from-slate-800 dark:to-indigo-950/60 dark:text-indigo-300 dark:ring-white/10"
            >
              {selectedFile ? (
                <FileText className="h-6 w-6" aria-hidden="true" />
              ) : (
                <UploadCloud className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Crisp Format Badges */}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <span className="micro-badge border-indigo-200/80 bg-indigo-50/90 text-indigo-700 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-300">
              DOCX
            </span>
            <span className="micro-badge border-slate-200/90 bg-slate-100/90 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              PDF
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Up to 25 MB · Encrypted Ingestion
            </span>
          </div>

          <h3 className="mt-3 text-base font-semibold tracking-tight text-slate-900 dark:text-white">
            {selectedFile
              ? selectedFile.name
              : "Drop a third-party contract or RFP to begin review"}
          </h3>
          <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Automatically segments hierarchical clauses, preserves legal section
            numbering, and prepares provisions for Playbook benchmarking.
          </p>

          <button
            type="button"
            data-testid="browse-files-btn"
            onClick={() => fileInputRef.current?.click()}
            className="mt-5 inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            Browse Local Files
          </button>

          {/* Optional Document Title & Submit Button */}
          {selectedFile ? (
            <div className="surface-card mt-6 w-full max-w-lg space-y-3.5 rounded-xl p-4 text-left">
              <div>
                <label
                  htmlFor="doc-title-input"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >
                  Agreement Title
                </label>
                <input
                  id="doc-title-input"
                  type="text"
                  data-testid="upload-document-title-input"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Master Cloud Services Agreement 2026"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800/80">
                <span className="font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                  {(selectedFile.size / 1024).toFixed(1)} KB · Ready to parse
                </span>
                <button
                  type="button"
                  data-testid="upload-submit-btn"
                  onClick={handleStartUpload}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 px-3.5 text-xs font-semibold text-white shadow-sm ring-1 ring-inset ring-white/20 transition-all hover:from-indigo-400 hover:to-indigo-600"
                >
                  <span>Upload & Open Studio</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : null}

          {errorMessage ? (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300"
            >
              {errorMessage}
            </div>
          ) : null}
        </div>
      ) : (
        /* Multi-Stage Upload Progress Indicator */
        <div
          data-testid="upload-progress-indicator"
          className="mx-auto flex max-w-md flex-col items-center justify-center py-6 text-center"
        >
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-indigo-200/70 bg-indigo-50 text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent dark:border-indigo-400 dark:border-t-transparent" />
          </div>

          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {stage === "uploading" && "1. Uploading contract to secure workspace..."}
            {stage === "parsing" &&
              "2. Parsing & segmenting hierarchical clauses..."}
            {stage === "opening" && "3. Opening Split-Screen Redlining Studio..."}
          </h4>

          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            {stage === "uploading" &&
              "Validating OpenXML / PDF integrity and streaming bytes"}
            {stage === "parsing" &&
              "Preserving legal numbering (1.1, Article IV) and sub-clauses"}
            {stage === "opening" &&
              "Binding clauses to Playbook vector index"}
          </p>

          {/* Smooth Progress Bar */}
          <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-200"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <div className="mt-3 flex items-center gap-4 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" /> Upload
            </span>
            <span
              className={
                stage === "parsing" || stage === "opening"
                  ? "text-indigo-700 dark:text-indigo-300"
                  : ""
              }
            >
              Clause Segmentation
            </span>
            <span
              className={
                stage === "opening"
                  ? "text-indigo-700 dark:text-indigo-300"
                  : ""
              }
            >
              Studio Launch
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
