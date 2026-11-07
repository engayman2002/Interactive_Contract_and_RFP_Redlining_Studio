"use client";

import React from "react";
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-slate-850 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Upload Contract or RFP
            </h2>
            <p className="text-xs text-slate-400">
              Upload a .docx or .pdf agreement to begin clause-level redlining.
            </p>
          </div>
          <button
            type="button"
            data-testid="close-upload-modal-btn"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white"
          >
            ✕
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

