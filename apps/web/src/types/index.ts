export type AcceptedMimeType =
  | "application/pdf"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export interface UploadedResume {
  file: File;
  name: string;
  size: number;
  mimeType: AcceptedMimeType;
}

export interface OptimizationFormState {
  resume: UploadedResume | null;
  jobDescription: string;
}

export type GenerationStatus = "idle" | "generating" | "complete";

export interface AtsScorePlaceholder {
  overall: number;
  keywordMatch: number;
  formatting: number;
  structure: number;
  matchedKeywords: string[];
  missingKeywords: string[];
}

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
}

export interface ExperienceItem {
  company: string;
  title: string;
  location: string;
  start_date: string;
  end_date: string;
  bullets: string[];
}

export interface EducationItem {
  institution: string;
  degree: string;
  graduation_date: string;
  details: string[];
}

export interface SkillsBlock {
  technical: string[];
  soft: string[];
}

export interface StructuredResume {
  contact: ContactInfo;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillsBlock;
  certifications: string[];
  projects: { name: string; description: string; technologies: string[] }[];
}
