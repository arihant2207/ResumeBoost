"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DownloadButtonProps {
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export function DownloadButton({
  disabled = true,
  onClick,
  className,
}: DownloadButtonProps) {
  const handleClick = () => {
    if (disabled) return;
    onClick?.();
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className={cn("w-full gap-2 sm:w-auto", className)}
      disabled={disabled}
      onClick={handleClick}
      title={
        disabled
          ? "Generate your resume first to enable download"
          : "Download optimized PDF"
      }
    >
      <Download className="size-4" aria-hidden />
      Download PDF
      {disabled && (
        <span className="sr-only"> — available after generation</span>
      )}
    </Button>
  );
}
