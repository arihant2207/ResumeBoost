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
    <div className="space-y-2 text-left">
      <div className="flex items-center justify-between">
        <Label htmlFor="job-description" className="text-sm font-medium text-white/80">
          Job description
        </Label>
        <span
          className={cn(
            "text-xs text-white/40",
            isNearLimit && "text-amber-500",
            charCount > MAX_JD_LENGTH && "text-red-400"
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
          "min-h-[200px] resize-y rounded-2xl border border-white/[0.10] bg-white/[0.02] text-white placeholder-white/30 focus:border-blue-500/30 focus:bg-white/[0.03] focus:shadow-[0_0_20px_rgba(59,130,246,0.15)] focus:ring-1 focus:ring-blue-500/20 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none transition-all duration-300 leading-relaxed font-sans shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] backdrop-blur-sm",
          (error || isTooShort) && "border-red-500/30 focus:border-red-500/40 focus:ring-red-500/10"
        )}
        aria-invalid={!!error || isTooShort}
        aria-describedby="jd-hint"
      />

      <p id="jd-hint" className="text-xs text-white/40">
        Minimum {MIN_JD_LENGTH} characters recommended.
      </p>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      {!error && isTooShort && (
        <p className="text-sm text-amber-500" role="status">
          Add a bit more detail for accurate keyword matching.
        </p>
      )}
    </div>
  );
}
