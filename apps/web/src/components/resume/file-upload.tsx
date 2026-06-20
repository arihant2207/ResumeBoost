"use client";

import { useCallback, useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn, formatFileSize } from "@/lib/utils";
import {
  ACCEPTED_RESUME_TYPES,
  MAX_RESUME_SIZE_BYTES,
} from "@/lib/constants";
import type { AcceptedMimeType, UploadedResume } from "@/types";

interface FileUploadProps {
  value: UploadedResume | null;
  onChange: (file: UploadedResume | null) => void;
  error?: string | null;
}

function validateFile(file: File): string | null {
  const acceptedMimes = Object.keys(ACCEPTED_RESUME_TYPES);
  if (!acceptedMimes.includes(file.type)) {
    return "Please upload a PDF or DOCX file.";
  }
  if (file.size > MAX_RESUME_SIZE_BYTES) {
    return `File must be under ${formatFileSize(MAX_RESUME_SIZE_BYTES)}.`;
  }
  return null;
}

export function FileUpload({ value, onChange, error }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const processFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setLocalError(validationError);
        return;
      }
      setLocalError(null);
      onChange({
        file,
        name: file.name,
        size: file.size,
        mimeType: file.type as AcceptedMimeType,
      });
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const displayError = error ?? localError;

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-[16px] border border-white/[0.10] bg-white/[0.02] p-4 text-left">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white">
          <FileText className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-sm text-white">{value.name}</p>
          <p className="text-xs text-white/40">
            {formatFileSize(value.size)} ·{" "}
            {value.mimeType === "application/pdf" ? "PDF" : "DOCX"}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange(null)}
          className="rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-colors duration-200"
          aria-label="Remove file"
        >
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center rounded-[20px] border border-dashed px-6 py-12 text-center transition-all duration-300 overflow-hidden",
          isDragging
            ? "border-blue-500/50 bg-blue-500/[0.02] shadow-[0_0_20px_rgba(59,130,246,0.06)]"
            : "border-white/[0.12] bg-white/[0.01] hover:border-white/20 hover:bg-white/[0.03] hover:shadow-[0_0_30px_rgba(59,130,246,0.04)]",
          displayError && "border-red-500/30 bg-red-500/[0.01]"
        )}
      >
        <span className="mb-4 flex size-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/90 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
          <Upload className="size-5" aria-hidden />
        </span>
        <p className="font-medium text-sm text-white">
          Drag & drop your resume, or{" "}
          <span className="text-blue-400 hover:text-blue-300 transition-colors">browse files</span>
        </p>
        <p className="mt-1 text-xs text-white/40">
          PDF or DOCX · Max {formatFileSize(MAX_RESUME_SIZE_BYTES)}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleChange}
        aria-label="Upload resume file"
      />

      {displayError && (
        <p className="text-sm text-red-400" role="alert">
          {displayError}
        </p>
      )}
    </div>
  );
}
