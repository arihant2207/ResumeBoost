export const ACCEPTED_RESUME_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
} as const;

export const MAX_RESUME_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MIN_JD_LENGTH = 50;
export const MAX_JD_LENGTH = 15000;

export const PLACEHOLDER_ATS_SCORE = {
  overall: 78,
  keywordMatch: 82,
  formatting: 90,
  structure: 75,
  matchedKeywords: [
    "React",
    "TypeScript",
    "Node.js",
    "API design",
    "Agile",
  ],
  missingKeywords: ["Kubernetes", "GraphQL", "CI/CD"],
} as const;
