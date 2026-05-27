import type { StructuredResume } from "@/types";

export interface ExtractionMetadata {
  parser: string;
  page_count?: number | null;
  paragraph_count?: number | null;
  char_count: number;
  warnings: string[];
}

export interface ResumeResponse {
  id: string;
  filename: string;
  mime_type: string;
  file_size_bytes: number;
  raw_text: string;
  structured_content: StructuredResume;
  extraction_metadata: ExtractionMetadata;
  created_at: string;
}

export interface JobDescriptionResponse {
  id: string;
  raw_text: string;
  resume_id: string | null;
  character_count: number;
  created_at: string;
}

export interface SessionResponse {
  id: string;
  resume: ResumeResponse;
  job_description: JobDescriptionResponse;
  created_at: string;
}

export interface JobDescriptionCreate {
  raw_text: string;
  resume_id?: string | null;
}

export interface SessionCreate {
  resume_id: string;
  job_description_id: string;
}

export interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
  };
  detail?: {
    error?: {
      code?: string;
      message?: string;
    };
    message?: string;
  };
}
