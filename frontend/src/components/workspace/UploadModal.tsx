"use client";

import React from "react";
import { X } from "lucide-react";
import { ContractUploadDropzone } from "./ContractUploadDropzone";

export interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Upload New Contract Modal"
      data-testid="upload-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm dark:bg-black/70"
    >
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between border-b border-slate-200/80 pb-3.5 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Upload Contract or RFP
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ingest a .docx or .pdf agreement to begin clause-level AI
              redlining.
            </p>
          </div>
          <button
            type="button"
            data-testid="close-upload-modal-btn"
            onClick={onClose}
            aria-label="Close Upload Modal"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ContractUploadDropzone
          compact
          onUploadComplete={() => {
            onClose();
          }}
        />
      </div>
    </div>
  );
};
