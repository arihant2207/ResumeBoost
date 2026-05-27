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
      <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileText className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-sm">{value.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(value.size)} ·{" "}
            {value.mimeType === "application/pdf" ? "PDF" : "DOCX"}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange(null)}
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
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
          displayError && "border-destructive/50"
        )}
      >
        <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Upload className="size-6" aria-hidden />
        </span>
        <p className="font-medium text-sm">
          Drag & drop your resume, or{" "}
          <span className="text-primary">browse files</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
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
        <p className="text-sm text-destructive" role="alert">
          {displayError}
        </p>
      )}
    </div>
  );
}
