"use client";

import React, { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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

  const validateAndSetFile = useCallback((file: File) => {
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
  }, [customTitle]);

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
        err instanceof Error ? err.message : "Failed to process contract upload."
      );
    }
  };

  return (
    <div
      data-testid="contract-upload-dropzone"
      className={`relative rounded-xl border-2 transition-all ${
        isDragOver
          ? "border-indigo-500 bg-indigo-950/30 ring-4 ring-indigo-500/20"
          : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
      } ${compact ? "p-4" : "p-8"} ${className}`}
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
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl bg-indigo-600/10 text-2xl text-indigo-400 transition-transform hover:scale-105"
          >
            📄
          </div>

          <h3 className="mt-3 text-sm font-semibold text-slate-100">
            {selectedFile ? selectedFile.name : "Drag & drop your contract here"}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Supports <span className="font-semibold text-slate-300">.docx</span>{" "}
            and <span className="font-semibold text-slate-300">.pdf</span> up to
            25MB
          </p>

          <button
            type="button"
            data-testid="browse-files-btn"
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
          >
            Browse Local Files
          </button>

          {/* Optional Document Title & Submit Button */}
          {selectedFile ? (
            <div className="mt-5 w-full max-w-md space-y-3 rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-left">
              <div>
                <label
                  htmlFor="doc-title-input"
                  className="block text-[11px] font-medium text-slate-400"
                >
                  Document Title (Optional)
                </label>
                <input
                  id="doc-title-input"
                  type="text"
                  data-testid="upload-document-title-input"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Master Services Agreement 2026"
                  className="mt-1 w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  Size: {(selectedFile.size / 1024).toFixed(1)} KB
                </span>
                <button
                  type="button"
                  data-testid="upload-submit-btn"
                  onClick={handleStartUpload}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition-all hover:bg-indigo-500"
                >
                  Upload & Open Studio →
                </button>
              </div>
            </div>
          ) : null}

          {errorMessage ? (
            <div
              role="alert"
              className="mt-3 rounded border border-rose-500/40 bg-rose-950/40 px-3 py-1.5 text-xs text-rose-300"
            >
              {errorMessage}
            </div>
          ) : null}
        </div>
      ) : (
        /* Multi-Stage Upload Progress Indicator */
        <div
          data-testid="upload-progress-indicator"
          className="flex flex-col items-center justify-center py-6 text-center"
        >
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />

          <h4 className="text-sm font-semibold text-slate-100">
            {stage === "uploading" && "1. Uploading file to workspace..."}
            {stage === "parsing" && "2. Parsing & segmenting legal clauses..."}
            {stage === "opening" && "3. Opening Redlining Studio..."}
          </h4>

          <p className="mt-1.5 text-xs text-slate-400">
            {stage === "uploading" && "Securely streaming document bytes"}
            {stage === "parsing" &&
              "Extracting contract numbering, titles, and operative terms"}
            {stage === "opening" &&
              "Initializing split-screen editor and vector knowledge base"}
          </p>

          <div className="mt-4 flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                stage === "uploading"
                  ? "bg-indigo-500 animate-pulse"
                  : "bg-emerald-500"
              }`}
            />
            <span
              className={`h-2 w-2 rounded-full ${
                stage === "parsing"
                  ? "bg-indigo-500 animate-pulse"
                  : stage === "opening"
                  ? "bg-emerald-500"
                  : "bg-slate-700"
              }`}
            />
            <span
              className={`h-2 w-2 rounded-full ${
                stage === "opening"
                  ? "bg-indigo-500 animate-pulse"
                  : "bg-slate-700"
              }`}
            />
          </div>
        </div>
      )}
    </div>
  );
};
