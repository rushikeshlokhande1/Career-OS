import type { AtsReport, ExtractedResume, GitHubIntelligence, ScoreBreakdown } from "@/lib/intelligence/types";

const weights: Record<keyof ScoreBreakdown, number> = {
  resumeQuality: 0.18,
  projectQuality: 0.18,
  skillsRelevance: 0.18,
  deploymentExperience: 0.12,
  githubActivity: 0.12,
  technicalDepth: 0.12,
  communicationQuality: 0.1,
};

export function calculateScoreBreakdown(resume: ExtractedResume, github?: GitHubIntelligence): ScoreBreakdown {
  const scoringText = uniqueResumeText(resume.rawText);
  const wordCount = scoringText.split(/\s+/).filter(Boolean).length;
  const quantifiedBullets = (scoringText.match(/\b\d+%?|\b\d+x\b/gi) ?? []).length;
  const deploymentMentions = (scoringText.match(/\b(deployed|production|live|vercel|netlify|aws|docker|ci\/cd|users?)\b/gi) ?? []).length;
  const actionVerbs = (scoringText.match(/\b(built|created|designed|optimized|implemented|launched|improved|automated|scaled)\b/gi) ?? []).length;
  const depthSignals = (scoringText.match(/\b(authentication|database|api|architecture|cache|queue|testing|security|performance|system design)\b/gi) ?? []).length;
  const contactScore = resume.contactSignals.filter((item) => item.includes("present")).length * 9;
  const structureScore = [resume.education.length, resume.experience.length, resume.projects.length, resume.achievements.length]
    .filter((count) => count > 0).length * 5;

  return {
    resumeQuality: clamp(scoreFrom([wordCount / 9, quantifiedBullets * 7, contactScore, structureScore])),
    projectQuality: clamp(scoreFrom([resume.projects.length * 12, deploymentMentions * 7, depthSignals * 4], 8)),
    skillsRelevance: clamp(scoreFrom([resume.skills.length * 6, depthSignals * 3], 10)),
    deploymentExperience: clamp(scoreFrom([deploymentMentions * 13, resume.links.length * 4], 4)),
    githubActivity: github ? github.portfolioStrength : githubMentionScore(resume),
    technicalDepth: clamp(scoreFrom([depthSignals * 6, resume.experience.length * 6, resume.projects.length * 5], 8)),
    communicationQuality: clamp(scoreFrom([actionVerbs * 4, quantifiedBullets * 8, resume.achievements.length * 5], 8)),
  };
}

export function calculateAtsReport(resume: ExtractedResume, targetRole: string, jobDescription = ""): AtsReport {
  const scoringText = uniqueResumeText(resume.rawText);
  const lower = scoringText.toLowerCase();
  const roleKeywords = extractAtsKeywords(`${targetRole} ${jobDescription}`);
  const resumeKeywords = resume.skills.map(normalizeKeyword);
  const matchedKeywords = roleKeywords.filter((keyword) => keywordAppears(keyword, lower, resumeKeywords));
  const missingKeywords = roleKeywords.filter((keyword) => !matchedKeywords.includes(keyword));
  const keywordMatch = roleKeywords.length ? clamp((matchedKeywords.length / roleKeywords.length) * 100) : clamp(resume.skills.length * 8);

  const contactScore = clamp((resume.contactSignals.filter((item) => item.includes("present")).length / 3) * 100);
  const sectionHits = [
    hasSection(scoringText, "summary") || scoringText.length > 600,
    resume.skills.length >= 5 || hasSection(scoringText, "skills"),
    resume.experience.length > 0 || hasSection(scoringText, "experience"),
    resume.projects.length > 0 || hasSection(scoringText, "projects"),
    resume.education.length > 0 || hasSection(scoringText, "education"),
  ].filter(Boolean).length;
  const formatScore = clamp(sectionHits * 14 + contactScore * 0.25 + Math.min(20, scoringText.split(/\s+/).length / 25));

  const metricCount = (scoringText.match(/\b(\d+%|\d+x|\d+\+|users|revenue|latency|accuracy|saved|reduced|increased)\b/gi) ?? []).length;
  const actionCount = (scoringText.match(/\b(built|created|designed|optimized|implemented|launched|improved|automated|scaled|developed)\b/gi) ?? []).length;
  const proofScore = clamp(resume.projects.length * 14 + resume.experience.length * 10 + metricCount * 8 + actionCount * 3 + resume.links.length * 4);
  const score = clamp(keywordMatch * 0.45 + formatScore * 0.3 + proofScore * 0.25);
  const fixes = [
    ...(missingKeywords.length ? [`Add truthful proof for missing ATS keywords: ${missingKeywords.slice(0, 6).join(", ")}.`] : []),
    ...(formatScore < 75 ? ["Use standard ATS sections: Summary, Skills, Experience, Projects, Education, and keep links in plain text."] : []),
    ...(proofScore < 75 ? ["Rewrite top bullets with action, technical decision, measurable result, and project/deployment evidence."] : []),
  ];

  return {
    score,
    keywordMatch,
    formatScore,
    proofScore,
    matchedKeywords: matchedKeywords.map(titleCase),
    missingKeywords: missingKeywords.map(titleCase),
    fixes: fixes.length ? fixes.slice(0, 3) : ["ATS fit is solid. Paste the exact job description in Resume Match to tune final keyword coverage."],
    verdict:
      score >= 82
        ? "Strong ATS fit for this target role."
        : score >= 68
          ? "Usable ATS fit, but it needs tighter keywords and proof before applying heavily."
          : "Weak ATS fit. Fix keywords, structure, and evidence before applying.",
  };
}

export function calculateReadinessScore(breakdown: ScoreBreakdown) {
  return Math.round(
    Object.entries(weights).reduce((total, [key, weight]) => {
      return total + breakdown[key as keyof ScoreBreakdown] * weight;
    }, 0),
  );
}

export function calculateConfidenceIndex(resume: ExtractedResume, github?: GitHubIntelligence) {
  const evidence = [
    resume.rawText.length > 1500,
    resume.skills.length >= 6,
    resume.projects.length >= 2,
    resume.experience.length >= 1,
    Boolean(github),
    Boolean(github && github.repositories.length >= 3),
  ].filter(Boolean).length;

  return clamp(42 + evidence * 9);
}

export function calculateHiringProbability(readinessScore: number, confidenceIndex: number) {
  return clamp(Math.round(readinessScore * 0.72 + confidenceIndex * 0.18 - 7));
}

function githubMentionScore(resume: ExtractedResume) {
  const hasGithub = resume.links.some((link) => /github/i.test(link)) || resume.rawText.toLowerCase().includes("github");
  return hasGithub ? 48 : 12;
}

function uniqueResumeText(text: string) {
  const seen = new Set<string>();
  return text
    .replace(/\n-- \d+ of \d+ --\n/g, "\n")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      const key = line.toLowerCase().replace(/\s+/g, " ");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join("\n");
}

function extractAtsKeywords(text: string) {
  const known = [
    "react", "next.js", "typescript", "javascript", "html", "css", "node.js", "api", "rest", "graphql",
    "sql", "postgresql", "mongodb", "python", "java", "c++", "aws", "docker", "kubernetes", "testing",
    "accessibility", "responsive", "authentication", "frontend", "backend", "full stack", "machine learning",
    "data analysis", "pandas", "numpy", "tableau", "power bi", "git", "ci/cd",
  ];
  const lower = text.toLowerCase();
  const fromText = known.filter((keyword) => lower.includes(keyword));
  const roleDefaults = /frontend|front-end|ui|react/i.test(text)
    ? ["react", "typescript", "javascript", "html", "css", "responsive", "api", "accessibility"]
    : /backend|api|server/i.test(text)
      ? ["api", "node.js", "sql", "authentication", "testing", "docker", "backend"]
      : /data|machine learning|analyst|scientist/i.test(text)
        ? ["python", "sql", "data analysis", "machine learning", "pandas", "numpy"]
        : ["javascript", "typescript", "api", "git", "testing"];
  return Array.from(new Set([...fromText, ...roleDefaults].map(normalizeKeyword))).slice(0, 12);
}

function normalizeKeyword(value: string) {
  return value.toLowerCase().replace(/\bnextjs\b/g, "next.js").replace(/\bnodejs\b/g, "node.js").trim();
}

function keywordAppears(keyword: string, lowerText: string, resumeKeywords: string[]) {
  return lowerText.includes(keyword) || resumeKeywords.some((skill) => skill === keyword || skill.includes(keyword) || keyword.includes(skill));
}

function hasSection(text: string, section: string) {
  return new RegExp(`(^|\\n)\\s*${section}\\s*(:|\\n)`, "i").test(text);
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase()).replace("Api", "API").replace("Sql", "SQL");
}

function scoreFrom(parts: number[], base = 12) {
  return parts.reduce((total, part) => total + part, base);
}

export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(value)));
}
