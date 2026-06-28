import type {
  ApiErrorBody,
  DashboardSessionResponse,
  JobDescriptionCreate,
  JobDescriptionResponse,
  ResumeResponse,
  SessionCreate,
  SessionResponse,
} from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function parseErrorBody(body: ApiErrorBody, fallback: string): ApiError {
  const nested = body.detail?.error ?? body.error;
  return new ApiError(
    nested?.code ?? "UNKNOWN",
    nested?.message ?? body.detail?.message ?? fallback,
    0
  );
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}/api/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
    const err = parseErrorBody(body, res.statusText);
    err.status = res.status;
    throw err;
  }

  return res.json() as Promise<T>;
}

export async function uploadResume(file: File): Promise<ResumeResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/api/v1/resumes/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
    const err = parseErrorBody(body, res.statusText);
    err.status = res.status;
    throw err;
  }

  return res.json() as Promise<ResumeResponse>;
}

export async function submitJobDescription(
  payload: JobDescriptionCreate
): Promise<JobDescriptionResponse> {
  return apiFetch<JobDescriptionResponse>("/job-descriptions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createSession(
  payload: SessionCreate
): Promise<SessionResponse> {
  return apiFetch<SessionResponse>("/sessions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function analyzeSession(sessionId: string): Promise<AtsAnalysisResponse> {
  return apiFetch<AtsAnalysisResponse>(`/analyze-session/${sessionId}`, {
    method: "POST",
  });
}

export async function optimizeSession(sessionId: string): Promise<OptimizeResponse> {
  return apiFetch<OptimizeResponse>(`/optimize-session/${sessionId}`, {
    method: "POST",
  });
}

export async function downloadPdf(sessionId: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}/api/v1/generate-pdf/${sessionId}`, {
    method: "POST",
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
    const err = parseErrorBody(body, res.statusText);
    err.status = res.status;
    throw err;
  }

  return res.blob();
}

export async function processResumeAndJobDescription(
  file: File,
  jobDescription: string
): Promise<SessionResponse> {
  const resume = await uploadResume(file);
  const jd = await submitJobDescription({
    raw_text: jobDescription,
    resume_id: resume.id,
  });
  return createSession({
    resume_id: resume.id,
    job_description_id: jd.id,
  });
}

export async function getDashboardSessions(): Promise<DashboardSessionResponse[]> {
  try {
    return await apiFetch<DashboardSessionResponse[]>("/dashboard/sessions", {
      method: "GET",
    });
  } catch (err) {
    console.error("Failed to fetch dashboard sessions:", err);
    return [];
  }
}

export interface AtsAnalysisResponse {
  match_percentage: number;
  matched_skills: string[];
  missing_skills: string[];
  ats_keywords: string[];
  strengths: string[];
  improvement_suggestions: string[];
}

export interface OptimizeResponse {
  optimized_summary: string;
  optimized_projects: object[];
  optimized_experience: object[];
  optimized_skills: {
    technical: string[];
    soft: string[];
    categories: { label: string; skills: string[] }[];
  };
  role_titles: string[];
}