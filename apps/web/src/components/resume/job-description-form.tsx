"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MAX_JD_LENGTH, MIN_JD_LENGTH } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface JobDescriptionFormProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
}

export function JobDescriptionForm({
  value,
  onChange,
  error,
}: JobDescriptionFormProps) {
  const charCount = value.length;
  const isNearLimit = charCount > MAX_JD_LENGTH * 0.9;
  const isTooShort = value.length > 0 && value.length < MIN_JD_LENGTH;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="job-description">Job description</Label>
        <span
          className={cn(
            "text-xs text-muted-foreground",
            isNearLimit && "text-amber-600 dark:text-amber-400",
            charCount > MAX_JD_LENGTH && "text-destructive"
          )}
        >
          {charCount.toLocaleString()} / {MAX_JD_LENGTH.toLocaleString()}
        </span>
      </div>

      <Textarea
        id="job-description"
        placeholder="Paste the full job description here — include responsibilities, requirements, and preferred qualifications for best results..."
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_JD_LENGTH))}
        rows={10}
        className={cn(
          "min-h-[200px] resize-y",
          (error || isTooShort) && "border-destructive focus-visible:ring-destructive/20"
        )}
        aria-invalid={!!error || isTooShort}
        aria-describedby="jd-hint"
      />

      <p id="jd-hint" className="text-xs text-muted-foreground">
        Minimum {MIN_JD_LENGTH} characters recommended.
      </p>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {!error && isTooShort && (
        <p className="text-sm text-amber-600 dark:text-amber-400" role="status">
          Add a bit more detail for accurate keyword matching.
        </p>
      )}
    </div>
  );
}
