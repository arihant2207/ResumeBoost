"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SessionResponse } from "@/types/api";

interface ParsedResultCardProps {
  session: SessionResponse | null;
}

export function ParsedResultCard({ session }: ParsedResultCardProps) {
  if (!session) return null;

  const { resume, job_description: jd } = session;
  const meta = resume.extraction_metadata;
  const contact = resume.structured_content.contact;

  return (
    <Card className="border-emerald-200 dark:border-emerald-900">
      <CardHeader>
        <CardTitle className="text-lg">Parsed results</CardTitle>
        <CardDescription>
          Extracted from{" "}
          <span className="font-medium text-foreground">{resume.filename}</span>{" "}
          · {meta.char_count.toLocaleString()} characters · parser: {meta.parser}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(contact.name || contact.email) && (
          <div className="flex flex-wrap gap-2">
            {contact.name && <Badge variant="secondary">{contact.name}</Badge>}
            {contact.email && <Badge variant="outline">{contact.email}</Badge>}
            {contact.phone && <Badge variant="outline">{contact.phone}</Badge>}
          </div>
        )}

        {meta.warnings.length > 0 && (
          <ul className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
            {meta.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        )}

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="resume-text">
            <AccordionTrigger className="text-sm hover:no-underline">
              Resume text preview
            </AccordionTrigger>
            <AccordionContent>
              <pre className="max-h-48 overflow-auto rounded-lg bg-muted/50 p-3 text-xs whitespace-pre-wrap">
                {resume.raw_text.slice(0, 3000)}
                {resume.raw_text.length > 3000 ? "\n\n… (truncated)" : ""}
              </pre>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="jd-text">
            <AccordionTrigger className="text-sm hover:no-underline">
              Job description ({jd.character_count.toLocaleString()} chars)
            </AccordionTrigger>
            <AccordionContent>
              <pre className="max-h-48 overflow-auto rounded-lg bg-muted/50 p-3 text-xs whitespace-pre-wrap">
                {jd.raw_text}
              </pre>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="structured">
            <AccordionTrigger className="text-sm hover:no-underline">
              Structured JSON
            </AccordionTrigger>
            <AccordionContent>
              <pre className="max-h-64 overflow-auto rounded-lg bg-muted/50 p-3 text-xs">
                {JSON.stringify(resume.structured_content, null, 2)}
              </pre>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
