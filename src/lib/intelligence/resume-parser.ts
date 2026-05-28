import type { ExtractedResume } from "@/lib/intelligence/types";

const skillVocabulary = [
  "javascript",
  "typescript",
  "react",
  "next.js",
  "nextjs",
  "node.js",
  "nodejs",
  "express",
  "python",
  "java",
  "c++",
  "c#",
  "html",
  "css",
  "sql",
  "mysql",
  "postgresql",
  "mongodb",
  "redis",
  "sqlite",
  "aws",
  "azure",
  "gcp",
  "docker",
  "kubernetes",
  "git",
  "github",
  "linux",
  "rest api",
  "graphql",
  "machine learning",
  "deep learning",
  "data analysis",
  "data science",
  "pandas",
  "numpy",
  "scikit-learn",
  "tensorflow",
  "pytorch",
  "power bi",
  "tableau",
  "excel",
  "fastapi",
  "django",
  "flask",
  "openai",
  "supabase",
  "firebase",
  "tailwind",
  "testing",
  "jest",
  "vitest",
  "playwright",
  "ci/cd",
  "api",
  "rest",
  "figma",
  "redux",
];

const sectionAliases: Record<keyof Omit<ExtractedResume, "rawText" | "contactSignals" | "skills" | "links">, string[]> = {
  education: ["education", "academic background", "qualifications"],
  experience: ["experience", "work experience", "internship", "employment"],
  projects: ["projects", "personal projects", "selected projects"],
  achievements: ["achievements", "awards", "certifications", "accomplishments"],
};

export function parseResumeText(rawText: string): ExtractedResume {
  const text = normalizeText(rawText);
  const lower = text.toLowerCase();
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    rawText: text,
    contactSignals: [
      lower.includes("@") ? "Email present" : "Email missing",
      /linkedin\.com/i.test(text) ? "LinkedIn present" : "LinkedIn missing",
      /github\.com/i.test(text) ? "GitHub present" : "GitHub missing",
    ],
    skills: extractSkills(lower),
    education: extractSection(lines, "education"),
    experience: extractSection(lines, "experience"),
    projects: extractSection(lines, "projects"),
    achievements: extractSection(lines, "achievements"),
    links: Array.from(new Set(text.match(/https?:\/\/[^\s)]+|(?:github|linkedin)\.com\/[^\s)]+/gi) ?? [])),
  };
}

function normalizeText(text: string) {
  return text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractSkills(lowerText: string) {
  return skillVocabulary
    .filter((skill) => new RegExp(`(^|[^a-z0-9+#.])${escapeRegExp(skill)}([^a-z0-9+#.]|$)`, "i").test(lowerText))
    .map(formatSkillName);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatSkillName(skill: string) {
  const canonical: Record<string, string> = {
    "nextjs": "Next.js",
    "nodejs": "Node.js",
    "api": "API",
    "rest": "REST",
    "sql": "SQL",
    "mysql": "MySQL",
    "postgresql": "PostgreSQL",
    "mongodb": "MongoDB",
    "aws": "AWS",
    "azure": "Azure",
    "gcp": "GCP",
    "ci/cd": "CI/CD",
    "html": "HTML",
    "css": "CSS",
    "c++": "C++",
    "c#": "C#",
  };

  return canonical[skill] ?? skill.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function extractSection(lines: string[], section: keyof typeof sectionAliases) {
  const aliases = sectionAliases[section];
  const startIndex = lines.findIndex((line) =>
    aliases.some((alias) => line.toLowerCase().replace(/[:|-]/g, "").trim() === alias),
  );

  if (startIndex === -1) {
    return inferSection(lines, section);
  }

  const nextIndex = lines.findIndex((line, index) => {
    if (index <= startIndex) return false;
    const normalized = line.toLowerCase().replace(/[:|-]/g, "").trim();
    return Object.values(sectionAliases).flat().includes(normalized);
  });

  return lines
    .slice(startIndex + 1, nextIndex === -1 ? startIndex + 7 : nextIndex)
    .filter((line) => line.length > 8)
    .slice(0, 8);
}

function inferSection(lines: string[], section: keyof typeof sectionAliases) {
  const patterns = {
    education: /(university|college|bachelor|b\.tech|degree|cgpa|gpa)/i,
    experience: /(intern|engineer|developer|worked|company|responsible)/i,
    projects: /(built|developed|created|deployed|github|project)/i,
    achievements: /(award|certified|rank|winner|hackathon|achievement)/i,
  };

  return lines.filter((line) => patterns[section].test(line)).slice(0, 6);
}
