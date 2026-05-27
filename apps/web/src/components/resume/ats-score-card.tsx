"use client";

import { Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { AtsScorePlaceholder } from "@/types";
import { cn } from "@/lib/utils";

interface AtsScoreCardProps {
  score: AtsScorePlaceholder | null;
  isPlaceholder?: boolean;
  className?: string;
}

export function AtsScoreCard({
  score,
  isPlaceholder = true,
  className,
}: AtsScoreCardProps) {
  if (!score) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardHeader>
          <CardTitle className="text-lg">ATS compatibility</CardTitle>
          <CardDescription>
            Your score will appear here after you generate an optimized resume.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 py-12 text-center">
            <div className="relative flex size-24 items-center justify-center rounded-full border-4 border-muted">
              <span className="text-3xl font-bold text-muted-foreground/40">
                —
              </span>
            </div>
            <p className="mt-4 max-w-[200px] text-sm text-muted-foreground">
              Upload a resume and paste a job description to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const dimensions = [
    { label: "Keyword match", value: score.keywordMatch },
    { label: "Formatting", value: score.formatting },
    { label: "Structure", value: score.structure },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">ATS compatibility</CardTitle>
            <CardDescription>
              {isPlaceholder
                ? "Preview score — real analysis connects in Phase 2."
                : "Based on keyword and formatting analysis."}
            </CardDescription>
          </div>
          {isPlaceholder && (
            <Badge variant="secondary" className="shrink-0 gap-1">
              <Info className="size-3" aria-hidden />
              Preview
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-center gap-6">
          <ScoreRing value={score.overall} />
          <div className="flex-1 space-y-3">
            {dimensions.map((dim) => (
              <div key={dim.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{dim.label}</span>
                  <span className="font-medium">{dim.value}%</span>
                </div>
                <Progress value={dim.value} className="h-1.5" />
              </div>
            ))}
          </div>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="matched" className="border-none">
            <AccordionTrigger className="py-2 text-sm hover:no-underline">
              Matched keywords ({score.matchedKeywords.length})
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-1.5">
                {score.matchedKeywords.map((kw) => (
                  <Badge key={kw} variant="success">
                    {kw}
                  </Badge>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="missing" className="border-none">
            <AccordionTrigger className="py-2 text-sm hover:no-underline">
              Missing keywords ({score.missingKeywords.length})
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-1.5">
                {score.missingKeywords.map((kw) => (
                  <Badge key={kw} variant="warning">
                    {kw}
                  </Badge>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

function ScoreRing({ value }: { value: number }) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex size-28 shrink-0 items-center justify-center">
      <svg className="size-28 -rotate-90" viewBox="0 0 100 100" aria-hidden>
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-primary transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{value}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
      <span className="sr-only">ATS score {value} out of 100</span>
    </div>
  );
}
