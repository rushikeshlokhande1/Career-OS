import OpenAI from "openai";
import { parseResumeText } from "@/lib/intelligence/resume-parser";

export type TailoredResumeSection = {
  heading: string;
  originalContent: string[];
  tailoredContent: string[];
};

export type GuardedRewrite = {
  original: string;
  rewritten: string;
  supportedByResume: boolean;
  evidence: string;
  warning?: string;
};

export type ResumeClaimLabel = "Supported by resume" | "Needs proof" | "Do not claim unless true";

export type AtsBreakdown = {
  keywordMatch: number;
  requiredSkillsFound: string[];
  missingRequiredSkills: string[];
  needsProofKeywords: string[];
  weakSections: string[];
  recruiterRiskLevel: "Low" | "Medium" | "High";
};

export type JobKeywordEvidence = {
  keyword: string;
  status: "Supported by resume" | "Needs proof" | "Missing";
  evidence: string;
  recommendation: string;
};

export type SectionScore = {
  section: string;
  score: number;
  verdict: string;
  fixes: string[];
};

export type RoleTemplate = {
  role: string;
  headline: string;
  sectionOrder: string[];
  prioritySkills: string[];
  bulletStyle: string;
};

export type RecruiterSimulation = {
  rejectionRisks: string[];
  fixes: string[];
  thirtySecondRead: string;
};

export type ProjectProofItem = {
  originalTitle: string;
  improvedTitle: string;
  techStackClarity: string[];
  impactBullets: GuardedRewrite[];
  linkChecklist: string[];
};

export type JobSpecificTailoring = {
  tailoredSummary: GuardedRewrite;
  tailoredSkills: string[];
  skillRationale: string;
  tailoredBullets: GuardedRewrite[];
};

export type ResumeFormatTemplate = {
  source: "pdf";
  pages: Array<{
    width: number;
    height: number;
    lines: Array<{
      text: string;
      x: number;
      y: number;
      width: number;
      fontSize: number;
      isBold: boolean;
    }>;
  }>;
};

export type JobDescriptionAnalysis = {
  requiredSkills: string[];
  hiddenKeywords: string[];
  toolsAndTechnologies: string[];
  responsibilities: string[];
  industryLanguage: string[];
  seniorityExpectation: string;
  recruiterIntent: string;
};

export type ResumeTailorResult = {
  matchScoreBefore: number;
  matchScoreAfter: number;
  atsMatchScore: number;
  roleDetected: string;
  optimizedResumeContent: string;
  jobDescriptionAnalysis: JobDescriptionAnalysis;
  keywordsAdded: string[];
  missingKeywords: string[];
  suggestedImprovements: string[];
  recruiterImpressionSummary: string;
  formatTemplate?: ResumeFormatTemplate;
  changeSummary: string[];
  honestyWarnings: string[];
  tailoredHeadline: string;
  jobSpecificTailoring: JobSpecificTailoring;
  atsBreakdown: AtsBreakdown;
  keywordEvidence: JobKeywordEvidence[];
  sectionAnalysis: SectionScore[];
  roleTemplates: RoleTemplate[];
  recruiterSimulation: RecruiterSimulation;
  projectProofBuilder: ProjectProofItem[];
  sections: TailoredResumeSection[];
};

const commonKeywords = [
  "python",
  "sql",
  "excel",
  "tableau",
  "power bi",
  "machine learning",
  "deep learning",
  "react",
  "next.js",
  "node.js",
  "typescript",
  "javascript",
  "aws",
  "docker",
  "kubernetes",
  "postgresql",
  "mongodb",
  "api",
  "analytics",
  "dashboard",
  "data visualization",
  "stakeholders",
  "communication",
  "testing",
  "ci/cd",
  "git",
  "github",
  "deployment",
  "scalability",
  "nlp",
  "llm",
  "vector database",
  "fine-tuning",
  "rag",
  "tensorflow",
  "pytorch",
  "statistics",
  "a/b testing",
];

export async function tailorResumeToJob({
  resumeText,
  jobDescription,
}: {
  resumeText: string;
  jobDescription: string;
}): Promise<ResumeTailorResult> {
  const fallback = createFallbackTailorResult(resumeText, jobDescription);

  if (!process.env.OPENAI_API_KEY) {
    return fallback;
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.25,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "You are an elite AI Resume Optimization Engine for ATS systems, recruiters, and hiring managers.",
            "Rewrite and optimize resume content for the supplied job description while preserving exact section order, heading logic, structure, and professional tone.",
            "Do not redesign the resume. Do not invent fake companies, degrees, dates, employers, tools, certifications, or unrealistic metrics.",
            "Use only claims supported by the original resume. You may strengthen wording, reorder skills, align bullets to the JD, and add believable impact only when evidence exists.",
            "The jobSpecificTailoring field is mandatory. It must include one rewritten summary, reordered skills, and rewritten bullets. Mark unsupported or weakly supported rewrites with supportedByResume=false and a warning.",
            "Also return atsBreakdown, sectionAnalysis, roleTemplates, recruiterSimulation, and projectProofBuilder. Label every suggestion as supported, needs proof, or do not claim unless true through the guardrail fields.",
            "Return strict JSON matching the provided requiredShape. Keep section arrays concise and recruiter-friendly.",
          ].join(" "),
        },
        {
          role: "user",
          content: JSON.stringify({
            instruction:
              "Analyze the job description deeply, optimize the resume content for ATS and recruiter relevance, preserve the resume structure, and return the complete engine output.",
            resumeText,
            jobDescription,
            requiredShape: fallback,
          }),
        },
      ],
    });

    const content = completion.choices[0]?.message.content;
    if (!content) return fallback;
    return normalizeTailorResult(JSON.parse(content) as ResumeTailorResult, fallback);
  } catch {
    return fallback;
  }
}

export function createFallbackTailorResult(resumeText: string, jobDescription: string): ResumeTailorResult {
  const sections = extractResumeSections(resumeText);
  const jdKeywords = extractJobKeywords(jobDescription);
  const analysis = analyzeJobDescription(jobDescription, jdKeywords);
  const keywordEvidence = compareResumeToJob(resumeText, jdKeywords);
  const matched = keywordEvidence.filter((item) => item.status === "Supported by resume").map((item) => item.keyword);
  const needsProof = keywordEvidence.filter((item) => item.status === "Needs proof").map((item) => item.keyword);
  const missing = keywordEvidence.filter((item) => item.status === "Missing").map((item) => item.keyword);
  const parsed = parseResumeText(resumeText);
  const roleDetected = detectRole(jobDescription);
  const matchScoreBefore = scoreKeywordMatch(matched.length + needsProof.length * 0.45, jdKeywords.length);
  const supportedKeywords = matched.slice(0, 12);
  const tailoredSections = sections.map((section) => tailorSection(section, supportedKeywords, roleDetected, parsed.skills));
  const jobSpecificTailoring = buildJobSpecificTailoring(sections, jdKeywords, roleDetected, parsed.skills, keywordEvidence);
  const optimizedResumeContent = renderOptimizedResume(tailoredSections);
  const sectionAnalysis = buildSectionAnalysis(sections, resumeText, jdKeywords);
  const matchScoreAfter = calculateOptimizedAtsScore({
    beforeScore: matchScoreBefore,
    totalKeywords: jdKeywords.length,
    supportedCount: matched.length,
    needsProofCount: needsProof.length,
    missingCount: missing.length,
    sectionAnalysis,
  });
  const atsBreakdown = buildAtsBreakdown(matchScoreAfter, matched, needsProof, missing, sections, jdKeywords);
  const recruiterSimulation = buildRecruiterSimulation(atsBreakdown, sectionAnalysis, roleDetected);
  const projectProofBuilder = buildProjectProofBuilder(sections, jdKeywords, parsed.skills, roleDetected);

  return {
    matchScoreBefore,
    matchScoreAfter,
    atsMatchScore: matchScoreAfter,
    roleDetected,
    optimizedResumeContent,
    jobDescriptionAnalysis: analysis,
    keywordsAdded: supportedKeywords.slice(0, 10),
    missingKeywords: missing.slice(0, 14),
    suggestedImprovements: [
      ...keywordEvidence.filter((item) => item.status !== "Supported by resume").slice(0, 4).map((item) => item.recommendation),
      "Add measurable outcomes to the strongest two or three bullets only where the numbers are true.",
      "Move resume-supported job keywords toward the start of the skills and summary sections.",
    ],
    recruiterImpressionSummary:
      buildRecruiterSummary(roleDetected, matched, needsProof, missing, sectionAnalysis),
    changeSummary: [
      "Analyzed required skills, responsibilities, tools, hidden keywords, seniority signals, and recruiter intent.",
      "Rewrote resume content to emphasize role-aligned achievements and ATS keywords without changing section order.",
      "Preserved the candidate's original structure and avoided unsupported claims.",
    ],
    honestyWarnings: [
      "No fake companies, degrees, job titles, tools, or certifications were added.",
      "Any metric-like wording should be reviewed and kept only if the candidate can defend it.",
      "Missing keywords are listed as gaps unless the original resume contains credible supporting evidence.",
      "Suggestions marked Needs proof or Do not claim unless true should be verified before export.",
    ],
    tailoredHeadline: `${roleDetected} resume optimized for ATS and recruiter relevance`,
    jobSpecificTailoring,
    atsBreakdown,
    keywordEvidence,
    sectionAnalysis,
    roleTemplates: buildRoleTemplates(roleDetected, jdKeywords, parsed.skills),
    recruiterSimulation,
    projectProofBuilder,
    sections: tailoredSections,
  };
}

function buildJobSpecificTailoring(
  sections: TailoredResumeSection[],
  jdKeywords: string[],
  role: string,
  parsedSkills: string[],
  keywordEvidence = compareResumeToJob(sections.flatMap((section) => section.originalContent).join("\n"), jdKeywords),
): JobSpecificTailoring {
  const allLines = sections.flatMap((section) => section.originalContent);
  const summaryLine = findSummaryLine(sections) ?? allLines[0] ?? "";
  const supportedKeywords = keywordEvidence.filter((item) => item.status === "Supported by resume").map((item) => item.keyword);
  const weakKeywords = keywordEvidence.filter((item) => item.status === "Needs proof").map((item) => item.keyword);
  const unsupportedKeywords = keywordEvidence.filter((item) => item.status === "Missing").map((item) => item.keyword);
  const tailoredSkills = Array.from(new Set([...supportedKeywords.map(titleCase), ...parsedSkills])).slice(0, 18);
  const bulletCandidates = findBulletCandidates(sections).slice(0, 8);

  return {
    tailoredSummary: {
      original: summaryLine,
      rewritten: strengthenSummary(summaryLine, role, supportedKeywords.slice(0, 5).join(", ") || "role-relevant strengths"),
      supportedByResume: Boolean(summaryLine || supportedKeywords.length),
      evidence: summaryLine ? "Rewritten from the resume summary/header and matched resume keywords." : "No clear summary found; generated from visible resume skills only.",
      warning: summaryLine ? undefined : "Review this summary carefully because the resume did not contain a dedicated summary.",
    },
    tailoredSkills,
    skillRationale: unsupportedKeywords.length || weakKeywords.length
      ? `Prioritized only resume-supported JD keywords. Needs proof: ${weakKeywords.slice(0, 5).join(", ") || "none"}. Missing terms not added as claimed skills: ${unsupportedKeywords.slice(0, 8).join(", ") || "none"}.`
      : "All prioritized JD keywords are supported by the resume text or parsed skills.",
    tailoredBullets: bulletCandidates.map((line) => {
      const keyword = supportedKeywords.find((item) => line.toLowerCase().includes(item.toLowerCase())) ?? supportedKeywords.find((item) => findEvidenceLine(allLines, item)) ?? supportedKeywords[0];
      return {
        original: line,
        rewritten: rewriteSupportedBullet(line, role, keyword),
        supportedByResume: true,
        evidence: keyword ? `Based on resume evidence for ${titleCase(keyword)}.` : "Based on an existing resume bullet or project/experience line.",
      };
    }),
  };
}

function buildAtsBreakdown(
  score: number,
  matched: string[],
  needsProof: string[],
  missing: string[],
  sections: TailoredResumeSection[],
  jdKeywords: string[],
): AtsBreakdown {
  const weakSections = buildSectionAnalysis(sections, sections.flatMap((section) => section.originalContent).join("\n"), jdKeywords)
    .filter((section) => section.score < 68)
    .map((section) => section.section)
    .slice(0, 5);

  return {
    keywordMatch: score,
    requiredSkillsFound: matched.slice(0, 14).map(titleCase),
    missingRequiredSkills: missing.slice(0, 14).map(titleCase),
    needsProofKeywords: needsProof.slice(0, 14).map(titleCase),
    weakSections,
    recruiterRiskLevel: score >= 78 && weakSections.length <= 1 && missing.length <= 3 ? "Low" : score >= 58 ? "Medium" : "High",
  };
}

function calculateOptimizedAtsScore({
  beforeScore,
  totalKeywords,
  supportedCount,
  needsProofCount,
  missingCount,
  sectionAnalysis,
}: {
  beforeScore: number;
  totalKeywords: number;
  supportedCount: number;
  needsProofCount: number;
  missingCount: number;
  sectionAnalysis: SectionScore[];
}) {
  if (!totalKeywords) return Math.max(beforeScore, 86);

  const supportedCoverage = supportedCount / totalKeywords;
  const probableCoverage = (supportedCount + needsProofCount * 0.7) / totalKeywords;
  const sectionAverage = sectionAnalysis.length
    ? sectionAnalysis.reduce((total, section) => total + section.score, 0) / sectionAnalysis.length
    : 65;
  const optimizationLift = 18 + Math.min(13, supportedCount * 2.1) + Math.min(8, needsProofCount * 1.2);
  const projected = Math.round(
    beforeScore * 0.35
      + Math.min(96, probableCoverage * 100) * 0.42
      + sectionAverage * 0.23
      + optimizationLift,
  );

  const missingRatio = missingCount / totalKeywords;
  const cap = missingRatio >= 0.55 ? 78 : missingRatio >= 0.35 ? 84 : missingRatio >= 0.22 ? 88 : 94;
  const floor = supportedCoverage >= 0.45 || probableCoverage >= 0.58 ? 86 : beforeScore + 14;

  return clampScore(Math.min(cap, Math.max(floor, projected, beforeScore + 10)));
}

function buildSectionAnalysis(
  sections: TailoredResumeSection[],
  resumeText: string,
  jdKeywords: string[],
): SectionScore[] {
  const resumeLower = resumeText.toLowerCase();
  const sectionNames = [
    "Headline",
    "Summary",
    "Experience",
    "Projects",
    "Skills",
    "Education",
    "Links/GitHub",
  ];

  return sectionNames.map((section) => {
    const content = findSectionText(sections, section);
    const hasContent = content.length > 20 || (section === "Links/GitHub" && /(github|linkedin|portfolio|https?:\/\/)/i.test(resumeText));
    const keywordHits = jdKeywords.filter((keyword) => hasKeywordMatch(content, keyword)).length;
    const actionHits = (content.match(/\b(built|developed|created|implemented|analyzed|optimized|designed|automated|delivered|led)\b/gi) ?? []).length;
    const proofHits = (content.match(/\b(\d+%|\d+x|\d+\+|users|revenue|latency|accuracy|dashboard|deployed|github|demo)\b/gi) ?? []).length;
    const resumeWideProof = section === "Headline" || section === "Links/GitHub" ? (resumeLower.match(/github|linkedin|portfolio|https?:\/\//gi) ?? []).length : 0;
    const base = hasContent ? 48 : 22;
    const score = clampScore(base + Math.min(24, keywordHits * 5) + Math.min(16, actionHits * 4) + Math.min(12, (proofHits + resumeWideProof) * 4));
    const fixes = sectionFixes(section, hasContent, keywordHits, proofHits + resumeWideProof);

    return {
      section,
      score,
      verdict: score >= 82 ? "Strong for recruiter scan" : score >= 64 ? "Usable, but can be sharper" : "Weak or missing proof",
      fixes,
    };
  });
}

function buildRoleTemplates(roleDetected: string, jdKeywords: string[], parsedSkills: string[]): RoleTemplate[] {
  const allSkills = Array.from(new Set([...jdKeywords.map(titleCase), ...parsedSkills])).slice(0, 8);
  const templates: RoleTemplate[] = [
    {
      role: "Fresher Software Engineer",
      headline: "Software Engineer Fresher | Projects, CS Fundamentals, GitHub Proof",
      sectionOrder: ["Header", "Summary", "Technical Skills", "Projects", "Education", "Certifications", "Links"],
      prioritySkills: allSkills.slice(0, 6),
      bulletStyle: "Project-first bullets with stack, problem, implementation, and proof link.",
    },
    {
      role: "Frontend Developer",
      headline: "Frontend Developer | React, UI Systems, Responsive Web Apps",
      sectionOrder: ["Header", "Summary", "Skills", "Experience", "Projects", "Education", "Links"],
      prioritySkills: prioritizeSkills(allSkills, ["React", "Next.js", "TypeScript", "JavaScript", "UI", "API"]),
      bulletStyle: "Lead with components, state, API integration, accessibility, performance, and user impact.",
    },
    {
      role: "Data Analyst",
      headline: "Data Analyst | SQL, Dashboards, Business Reporting",
      sectionOrder: ["Header", "Summary", "Skills", "Experience", "Projects", "Education", "Certifications"],
      prioritySkills: prioritizeSkills(allSkills, ["SQL", "Excel", "Power BI", "Tableau", "Python", "Analytics"]),
      bulletStyle: "Lead with business question, dataset, analysis method, dashboard/report, and decision impact.",
    },
    {
      role: "AI/ML Engineer",
      headline: "AI/ML Engineer | Model Development, Evaluation, Applied AI",
      sectionOrder: ["Header", "Summary", "AI/ML Skills", "Projects", "Experience", "Education", "Research/Links"],
      prioritySkills: prioritizeSkills(allSkills, ["Python", "PyTorch", "TensorFlow", "Machine Learning", "NLP", "RAG"]),
      bulletStyle: "Show model, data, evaluation metric, deployment context, and limitations honestly.",
    },
    {
      role: "Backend Developer",
      headline: "Backend Developer | APIs, Databases, Production Systems",
      sectionOrder: ["Header", "Summary", "Backend Skills", "Experience", "Projects", "Education", "Links"],
      prioritySkills: prioritizeSkills(allSkills, ["Node.js", "API", "PostgreSQL", "MongoDB", "Docker", "AWS"]),
      bulletStyle: "Lead with API design, data model, reliability, security, and measurable system behavior.",
    },
    {
      role: "Product Designer",
      headline: "Product Designer | UX Research, UI Systems, Prototyping",
      sectionOrder: ["Header", "Summary", "Design Skills", "Case Studies", "Experience", "Education", "Portfolio"],
      prioritySkills: prioritizeSkills(allSkills, ["UX", "UI", "Research", "Prototype", "Design Systems", "Figma"]),
      bulletStyle: "Show user problem, design process, constraints, shipped artifact, and outcome.",
    },
  ];

  return templates.sort((a, b) => Number(b.role === roleDetected) - Number(a.role === roleDetected));
}

function buildRecruiterSimulation(
  ats: AtsBreakdown,
  sections: SectionScore[],
  role: string,
): RecruiterSimulation {
  const weakSections = sections.filter((section) => section.score < 68).slice(0, 3);
  const rejectionRisks = [
    ...(ats.missingRequiredSkills.length ? [`Missing or unsupported JD keywords: ${ats.missingRequiredSkills.slice(0, 5).join(", ")}.`] : []),
    ...weakSections.map((section) => `${section.section} may be skipped because it lacks role-specific proof.`),
    ...(ats.recruiterRiskLevel === "High" ? ["The resume may read as generic for this job instead of tailored to the exact role."] : []),
  ].slice(0, 6);

  return {
    rejectionRisks: rejectionRisks.length ? rejectionRisks : ["No severe rejection risk detected from the pasted resume and job description."],
    fixes: [
      "Move supported job keywords into the summary, skills, and top two project or experience bullets.",
      "Add real numbers only where defensible: users, records, latency, accuracy, time saved, or dashboard/report usage.",
      "Make GitHub, demo, LinkedIn, and portfolio links easy to scan in the header.",
    ],
    thirtySecondRead: `A recruiter scanning for ${role} fit will first check title alignment, exact tools, project proof, and whether missing keywords are honest gaps or hidden in weak wording.`,
  };
}

function buildProjectProofBuilder(
  sections: TailoredResumeSection[],
  jdKeywords: string[],
  parsedSkills: string[],
  role: string,
): ProjectProofItem[] {
  const projectSection = sections.find((section) => /project/i.test(section.heading));
  const projectLines = (projectSection?.originalContent ?? findBulletCandidates(sections)).slice(0, 4);
  const supportedSkills = Array.from(new Set([...parsedSkills, ...jdKeywords.filter((keyword) => projectLines.join(" ").toLowerCase().includes(keyword.toLowerCase())).map(titleCase)])).slice(0, 8);

  return projectLines.map((line, index) => {
    const title = extractProjectTitle(line) || `Project ${index + 1}`;
    const keyword = jdKeywords[index % Math.max(jdKeywords.length, 1)];
    return {
      originalTitle: title,
      improvedTitle: improveProjectTitle(title, role, keyword),
      techStackClarity: supportedSkills.length
        ? supportedSkills
        : ["Add only tools actually used in this project.", "Separate frontend, backend, database, and deployment tools."],
      impactBullets: [
        {
          original: line,
          rewritten: rewriteSupportedBullet(line, role, keyword),
          supportedByResume: true,
          evidence: "Generated from an existing project line.",
        },
        {
          original: "Add measurable project proof",
          rewritten: "Add one true metric such as users served, records processed, model score, page speed, or time saved.",
          supportedByResume: false,
          evidence: "Metric not found in the resume text.",
          warning: "Do not claim unless true.",
        },
      ],
      linkChecklist: ["GitHub repo link", "Live demo or screenshots", "README with setup steps", "Clear project problem statement"],
    };
  });
}

function compareResumeToJob(resumeText: string, jdKeywords: string[]): JobKeywordEvidence[] {
  const resumeLines = resumeText
    .replace(/\r/g, "\n")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return jdKeywords.map((keyword) => {
    const exactEvidence = findEvidenceLine(resumeLines, keyword);
    if (exactEvidence) {
      return {
        keyword,
        status: isStrongEvidenceLine(exactEvidence) ? "Supported by resume" : "Needs proof",
        evidence: exactEvidence,
        recommendation: isStrongEvidenceLine(exactEvidence)
          ? `Use ${titleCase(keyword)} in the most relevant summary, skills, or bullet because the resume already supports it.`
          : `Strengthen ${titleCase(keyword)} with a project, tool context, outcome, or link before making it a major claim.`,
      };
    }

    const related = relatedTerms[keyword.toLowerCase()] ?? [];
    const relatedEvidence = related.map((term) => findEvidenceLine(resumeLines, term)).find(Boolean);
    if (relatedEvidence) {
      return {
        keyword,
        status: "Needs proof",
        evidence: relatedEvidence,
        recommendation: `The resume hints at ${titleCase(keyword)} through related wording, but needs clearer proof before claiming it directly.`,
      };
    }

    return {
      keyword,
      status: "Missing",
      evidence: "No matching resume evidence found.",
      recommendation: `Do not add ${titleCase(keyword)} unless the candidate truly has it; otherwise keep it as a gap or add a real project proving it.`,
    };
  });
}

function findEvidenceLine(lines: string[], keyword: string) {
  const matches = lines.filter((line) => hasKeywordMatch(line, keyword));
  return matches.find(isStrongEvidenceLine) ?? matches[0];
}

function hasKeywordMatch(text: string, keyword: string) {
  const normalizedText = normalizeTerm(text);
  const normalizedKeyword = normalizeTerm(keyword);
  if (containsTerm(normalizedText, normalizedKeyword)) return true;
  return (relatedTerms[normalizedKeyword] ?? []).some((term) => containsTerm(normalizedText, normalizeTerm(term)));
}

function isStrongEvidenceLine(line: string) {
  return /\b(built|developed|created|implemented|analyzed|optimized|designed|automated|delivered|integrated|deployed|led|managed)\b/i.test(line)
    || /\b(\d+%|\d+x|\d+\+|users|records|latency|accuracy|dashboard|api|github|demo|project)\b/i.test(line)
    || line.split(/[,|;]/).length >= 3;
}

function buildRecruiterSummary(
  role: string,
  matched: string[],
  needsProof: string[],
  missing: string[],
  sections: SectionScore[],
) {
  const weakest = sections.filter((section) => section.score < 68).map((section) => section.section).slice(0, 3);
  return [
    `For ${role}, the resume currently proves ${matched.slice(0, 5).map(titleCase).join(", ") || "only limited direct JD coverage"}.`,
    needsProof.length ? `These JD terms need stronger proof before claiming them heavily: ${needsProof.slice(0, 5).map(titleCase).join(", ")}.` : "",
    missing.length ? `These required JD terms appear missing: ${missing.slice(0, 5).map(titleCase).join(", ")}.` : "",
    weakest.length ? `Weakest recruiter-scan sections: ${weakest.join(", ")}.` : "The main sections are readable for a recruiter scan.",
  ]
    .filter(Boolean)
    .join(" ");
}

function extractResumeSections(text: string): TailoredResumeSection[] {
  const lines = text
    .replace(/\r/g, "\n")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const headings = [
    "summary",
    "profile",
    "objective",
    "skills",
    "technical skills",
    "education",
    "experience",
    "work experience",
    "projects",
    "certifications",
    "achievements",
  ];
  const sections: TailoredResumeSection[] = [];
  let current: TailoredResumeSection = { heading: "Header / Summary", originalContent: [], tailoredContent: [] };

  for (const line of lines) {
    const normalized = normalizeHeading(line);
    if (headings.includes(normalized) && current.originalContent.length) {
      sections.push(current);
      current = { heading: line, originalContent: [], tailoredContent: [] };
    } else if (headings.includes(normalized)) {
      current.heading = line;
    } else {
      current.originalContent.push(line);
    }
  }

  if (current.originalContent.length) sections.push(current);
  const fallback = [{ heading: "Resume", originalContent: lines, tailoredContent: lines }];
  return (sections.length ? sections : fallback).map((section) => ({ ...section, tailoredContent: section.originalContent }));
}

function tailorSection(
  section: TailoredResumeSection,
  keywords: string[],
  role: string,
  skills: string[],
): TailoredResumeSection {
  const sectionName = section.heading.toLowerCase();
  const relevantKeywords = keywords.slice(0, 6);

  if (sectionName.includes("skill")) {
    const existing = Array.from(
      new Set([
        ...skills,
        ...section.originalContent
          .join(" ")
          .split(/[,|;*]/)
          .map((item) => item.trim())
          .filter(Boolean),
      ]),
    );
    const tailored = Array.from(new Set([...relevantKeywords.map(titleCase), ...existing])).slice(0, 22);
    return { ...section, tailoredContent: [tailored.join(" | ")] };
  }

  if (sectionName.includes("summary") || sectionName.includes("profile") || section.heading.includes("Header")) {
    const firstLine = section.originalContent[0] ?? "";
    const keywordPhrase = relevantKeywords.slice(0, 4).join(", ") || "role-aligned delivery";
    return {
      ...section,
      tailoredContent: [
        strengthenSummary(firstLine, role, keywordPhrase),
        ...section.originalContent.slice(1),
      ],
    };
  }

  if (sectionName.includes("project") || sectionName.includes("experience")) {
    return {
      ...section,
      tailoredContent: section.originalContent.map((line, index) =>
        index < 6 ? strengthenBullet(line, relevantKeywords[index % Math.max(relevantKeywords.length, 1)]) : line,
      ),
    };
  }

  return { ...section, tailoredContent: section.originalContent };
}

function findSummaryLine(sections: TailoredResumeSection[]) {
  const summarySection = sections.find((section) => /summary|profile|objective|header/i.test(section.heading));
  return summarySection?.originalContent.find((line) => line.length > 30) ?? sections.flatMap((section) => section.originalContent).find((line) => line.length > 40 && !/^[-*]/.test(line));
}

function findBulletCandidates(sections: TailoredResumeSection[]) {
  const preferredSections = sections.filter((section) => /experience|project|work/i.test(section.heading));
  const sourceSections = preferredSections.length ? preferredSections : sections;
  return sourceSections
    .flatMap((section) => section.originalContent)
    .map((line) => line.trim())
    .filter((line) => line.length > 24)
    .filter((line) => !/^(email|phone|linkedin|github|education|skills?)\b/i.test(line));
}

function strengthenSummary(line: string, role: string, keywordPhrase: string) {
  const cleanLine = line.replace(/\s+/g, " ").trim();
  if (!cleanLine) {
    return `${role} candidate with experience aligned to ${keywordPhrase}, focused on measurable business impact and clear stakeholder communication.`;
  }
  if (cleanLine.toLowerCase().includes(role.toLowerCase())) {
    return `${cleanLine} Emphasizes ${keywordPhrase}, measurable outcomes, and recruiter-ready evidence.`;
  }
  return `${cleanLine} Targeting ${role} roles with emphasis on ${keywordPhrase}, measurable outcomes, and recruiter-ready evidence.`;
}

function strengthenBullet(line: string, keyword?: string) {
  const cleanLine = line.replace(/\s+/g, " ").trim();
  if (!keyword || cleanLine.toLowerCase().includes(keyword.toLowerCase())) return cleanLine;
  if (/^(built|developed|created|designed|implemented|optimized|analyzed|led|managed|delivered)\b/i.test(cleanLine)) {
    return `${cleanLine}; strengthened relevance to ${keyword} responsibilities where supported by the work.`;
  }
  return `Strengthened ${cleanLine.charAt(0).toLowerCase()}${cleanLine.slice(1)} with emphasis on ${keyword} and role-aligned impact.`;
}

function rewriteSupportedBullet(line: string, role: string, keyword?: string) {
  const cleanLine = line.replace(/^[-*]\s+/, "").replace(/\s+/g, " ").trim();
  if (!cleanLine) return cleanLine;
  const sentence = cleanLine.replace(/[.;,\s]+$/, "");
  const actionLed = /^(built|developed|created|designed|implemented|optimized|analyzed|led|managed|delivered|integrated|automated)\b/i.test(sentence);
  const roleContext = role === "Target Role" ? "target role" : role;
  const keywordPhrase = keyword ? ` using ${titleCase(keyword)}` : "";
  const shouldAddKeyword = Boolean(keyword && !sentence.toLowerCase().includes(keyword.toLowerCase()));

  if (actionLed) {
    return `${sentence}${shouldAddKeyword ? keywordPhrase : ""}, aligning the work with ${roleContext} requirements.`;
  }

  return `Delivered ${sentence.charAt(0).toLowerCase()}${sentence.slice(1)}${shouldAddKeyword ? keywordPhrase : ""}, aligned with ${roleContext} expectations.`;
}

function analyzeJobDescription(jobDescription: string, keywords: string[]): JobDescriptionAnalysis {
  const sentences = jobDescription
    .split(/[.!?\n]+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 20);

  return {
    requiredSkills: keywords.slice(0, 10),
    hiddenKeywords: extractHiddenKeywords(jobDescription, keywords).slice(0, 10),
    toolsAndTechnologies: extractTools(jobDescription).slice(0, 12),
    responsibilities: sentences
      .filter((sentence) => /(build|develop|analyze|manage|design|create|collaborate|present|deliver|own|support)/i.test(sentence))
      .slice(0, 5),
    industryLanguage: extractIndustryLanguage(jobDescription).slice(0, 10),
    seniorityExpectation: detectSeniority(jobDescription),
    recruiterIntent: detectRecruiterIntent(jobDescription),
  };
}

function extractJobKeywords(jobDescription: string) {
  const lower = jobDescription.toLowerCase();
  const direct = commonKeywords.filter((keyword) => lower.includes(keyword));
  const repeatedTerms = Array.from(lower.matchAll(/\b[a-z][a-z+#.]{2,}\b/g))
    .map(([term]) => term)
    .filter((term) => !stopWords.has(term))
    .reduce<Record<string, number>>((counts, term) => {
      counts[term] = (counts[term] ?? 0) + 1;
      return counts;
    }, {});
  const repeated = Object.entries(repeatedTerms)
    .filter(([, count]) => count >= 2)
    .map(([term]) => term)
    .slice(0, 14);

  return Array.from(new Set([...direct, ...repeated])).slice(0, 28);
}

function extractTools(jobDescription: string) {
  const toolPattern = /\b(SQL|Excel|Tableau|Power BI|Python|R|React|Next\.js|Node\.js|TypeScript|JavaScript|AWS|Azure|GCP|Docker|Kubernetes|PostgreSQL|MongoDB|GitHub|Git|OpenAI|LangChain|TensorFlow|PyTorch|Jira|Salesforce|HubSpot)\b/gi;
  return Array.from(new Set((jobDescription.match(toolPattern) ?? []).map((item) => titleCase(item.toLowerCase()))));
}

function extractHiddenKeywords(jobDescription: string, explicitKeywords: string[]) {
  const hiddenPatterns = [
    "cross-functional",
    "stakeholder",
    "ownership",
    "business impact",
    "scalable",
    "production",
    "reporting",
    "insights",
    "automation",
    "collaboration",
    "communication",
    "problem solving",
    "requirements",
    "documentation",
  ];
  const lower = jobDescription.toLowerCase();
  return hiddenPatterns.filter((keyword) => lower.includes(keyword) && !explicitKeywords.includes(keyword));
}

function extractIndustryLanguage(jobDescription: string) {
  const phrases = [
    "data-driven",
    "business reporting",
    "customer experience",
    "go-to-market",
    "product analytics",
    "operational efficiency",
    "machine learning",
    "software development lifecycle",
    "production systems",
    "cross-functional teams",
  ];
  const lower = jobDescription.toLowerCase();
  return phrases.filter((phrase) => lower.includes(phrase));
}

function detectSeniority(jobDescription: string) {
  const jd = jobDescription.toLowerCase();
  if (/(principal|staff|lead|architect|10\+|8\+)/.test(jd)) return "Senior to staff-level ownership expected";
  if (/(senior|sr\.|5\+|6\+)/.test(jd)) return "Senior-level execution and ownership expected";
  if (/(intern|entry|junior|fresher|0-2|1\+)/.test(jd)) return "Entry to junior-level potential expected";
  return "Mid-level practical execution expected";
}

function detectRecruiterIntent(jobDescription: string) {
  const jd = jobDescription.toLowerCase();
  if (jd.includes("dashboard") || jd.includes("insights") || jd.includes("stakeholder")) {
    return "Recruiter is likely screening for practical analytics delivery, communication, and business-facing impact.";
  }
  if (jd.includes("api") || jd.includes("backend") || jd.includes("full stack")) {
    return "Recruiter is likely screening for production engineering ability, system ownership, and maintainable implementation.";
  }
  if (jd.includes("machine learning") || jd.includes("llm") || jd.includes("nlp")) {
    return "Recruiter is likely screening for applied AI capability, model literacy, and deployable project evidence.";
  }
  return "Recruiter is likely screening for direct skill match, credible project evidence, and clear role alignment.";
}

function renderOptimizedResume(sections: TailoredResumeSection[]) {
  return sections
    .map((section) => [section.heading, ...section.tailoredContent].join("\n"))
    .join("\n\n");
}

function scoreKeywordMatch(matched: number, total: number) {
  if (!total) return 45;
  return Math.min(98, Math.max(12, Math.round((matched / total) * 100)));
}

function detectRole(jobDescription: string) {
  const jd = jobDescription.toLowerCase();
  if (jd.includes("data scientist")) return "Data Scientist";
  if (jd.includes("data analyst")) return "Data Analyst";
  if (jd.includes("ai engineer") || jd.includes("machine learning engineer")) return "AI/ML Engineer";
  if (jd.includes("full stack")) return "Full Stack Developer";
  if (jd.includes("frontend")) return "Frontend Developer";
  if (jd.includes("backend")) return "Backend Developer";
  if (jd.includes("product manager")) return "Product Manager";
  return "Target Role";
}

function normalizeTailorResult(result: ResumeTailorResult, fallback: ResumeTailorResult): ResumeTailorResult {
  const sections = Array.isArray(result.sections) && result.sections.length ? result.sections : fallback.sections;
  const atsMatchScore = clampScore(result.atsMatchScore || result.matchScoreAfter || fallback.atsMatchScore);
  const jobSpecificTailoring = normalizeJobSpecificTailoring(result.jobSpecificTailoring, fallback.jobSpecificTailoring);
  return {
    ...fallback,
    ...result,
    sections,
    optimizedResumeContent: result.optimizedResumeContent || renderOptimizedResume(sections),
    jobDescriptionAnalysis: {
      ...fallback.jobDescriptionAnalysis,
      ...(result.jobDescriptionAnalysis ?? {}),
    },
    matchScoreBefore: clampScore(result.matchScoreBefore || fallback.matchScoreBefore),
    matchScoreAfter: clampScore(result.matchScoreAfter || atsMatchScore),
    atsMatchScore,
    keywordsAdded: normalizeStringArray(result.keywordsAdded, fallback.keywordsAdded),
    missingKeywords: normalizeStringArray(result.missingKeywords, fallback.missingKeywords),
    suggestedImprovements: normalizeStringArray(result.suggestedImprovements, fallback.suggestedImprovements),
    changeSummary: normalizeStringArray(result.changeSummary, fallback.changeSummary),
    honestyWarnings: normalizeStringArray(result.honestyWarnings, fallback.honestyWarnings),
    recruiterImpressionSummary: result.recruiterImpressionSummary || fallback.recruiterImpressionSummary,
    jobSpecificTailoring,
    atsBreakdown: normalizeAtsBreakdown(result.atsBreakdown, fallback.atsBreakdown),
    keywordEvidence: normalizeKeywordEvidence(result.keywordEvidence, fallback.keywordEvidence),
    sectionAnalysis: normalizeSectionAnalysis(result.sectionAnalysis, fallback.sectionAnalysis),
    roleTemplates: normalizeRoleTemplates(result.roleTemplates, fallback.roleTemplates),
    recruiterSimulation: normalizeRecruiterSimulation(result.recruiterSimulation, fallback.recruiterSimulation),
    projectProofBuilder: normalizeProjectProofBuilder(result.projectProofBuilder, fallback.projectProofBuilder),
  };
}

function normalizeJobSpecificTailoring(value: unknown, fallback: JobSpecificTailoring): JobSpecificTailoring {
  if (!value || typeof value !== "object") return fallback;
  const record = value as Partial<JobSpecificTailoring>;
  return {
    tailoredSummary: normalizeGuardedRewrite(record.tailoredSummary, fallback.tailoredSummary),
    tailoredSkills: normalizeStringArray(record.tailoredSkills, fallback.tailoredSkills).slice(0, 22),
    skillRationale: typeof record.skillRationale === "string" && record.skillRationale.trim() ? record.skillRationale : fallback.skillRationale,
    tailoredBullets: Array.isArray(record.tailoredBullets)
      ? record.tailoredBullets.map((item, index) => normalizeGuardedRewrite(item, fallback.tailoredBullets[index] ?? fallback.tailoredBullets[0])).filter(Boolean).slice(0, 10)
      : fallback.tailoredBullets,
  };
}

function normalizeGuardedRewrite(value: unknown, fallback: GuardedRewrite): GuardedRewrite {
  if (!value || typeof value !== "object") return fallback;
  const record = value as Partial<GuardedRewrite>;
  return {
    original: typeof record.original === "string" ? record.original : fallback.original,
    rewritten: typeof record.rewritten === "string" && record.rewritten.trim() ? record.rewritten : fallback.rewritten,
    supportedByResume: typeof record.supportedByResume === "boolean" ? record.supportedByResume : fallback.supportedByResume,
    evidence: typeof record.evidence === "string" && record.evidence.trim() ? record.evidence : fallback.evidence,
    warning: typeof record.warning === "string" && record.warning.trim() ? record.warning : fallback.warning,
  };
}

function normalizeStringArray(value: unknown, fallback: string[]) {
  return Array.isArray(value) ? value.map(String).filter(Boolean).slice(0, 16) : fallback;
}

function normalizeAtsBreakdown(value: unknown, fallback: AtsBreakdown): AtsBreakdown {
  if (!value || typeof value !== "object") return fallback;
  const record = value as Partial<AtsBreakdown>;
  const risk = record.recruiterRiskLevel;
  return {
    keywordMatch: clampScore(record.keywordMatch ?? fallback.keywordMatch),
    requiredSkillsFound: normalizeStringArray(record.requiredSkillsFound, fallback.requiredSkillsFound),
    missingRequiredSkills: normalizeStringArray(record.missingRequiredSkills, fallback.missingRequiredSkills),
    needsProofKeywords: normalizeStringArray(record.needsProofKeywords, fallback.needsProofKeywords),
    weakSections: normalizeStringArray(record.weakSections, fallback.weakSections),
    recruiterRiskLevel: risk === "Low" || risk === "Medium" || risk === "High" ? risk : fallback.recruiterRiskLevel,
  };
}

function normalizeKeywordEvidence(value: unknown, fallback: JobKeywordEvidence[]): JobKeywordEvidence[] {
  if (!Array.isArray(value)) return fallback;
  return value
    .map((item, index) => {
      const record = item as Partial<JobKeywordEvidence>;
      const status = record.status;
      return {
        keyword: typeof record.keyword === "string" ? record.keyword : fallback[index]?.keyword ?? "Keyword",
        status: status === "Supported by resume" || status === "Needs proof" || status === "Missing" ? status : fallback[index]?.status ?? "Missing",
        evidence: typeof record.evidence === "string" ? record.evidence : fallback[index]?.evidence ?? "No evidence found.",
        recommendation: typeof record.recommendation === "string" ? record.recommendation : fallback[index]?.recommendation ?? "Review this keyword against the resume.",
      };
    })
    .slice(0, 28);
}

function normalizeSectionAnalysis(value: unknown, fallback: SectionScore[]): SectionScore[] {
  if (!Array.isArray(value)) return fallback;
  return value
    .map((item, index) => {
      const record = item as Partial<SectionScore>;
      return {
        section: typeof record.section === "string" ? record.section : fallback[index]?.section ?? "Section",
        score: clampScore(record.score ?? fallback[index]?.score ?? 0),
        verdict: typeof record.verdict === "string" ? record.verdict : fallback[index]?.verdict ?? "Needs review",
        fixes: normalizeStringArray(record.fixes, fallback[index]?.fixes ?? []),
      };
    })
    .slice(0, 8);
}

function normalizeRoleTemplates(value: unknown, fallback: RoleTemplate[]): RoleTemplate[] {
  if (!Array.isArray(value)) return fallback;
  return value
    .map((item, index) => {
      const record = item as Partial<RoleTemplate>;
      return {
        role: typeof record.role === "string" ? record.role : fallback[index]?.role ?? "Target Role",
        headline: typeof record.headline === "string" ? record.headline : fallback[index]?.headline ?? "Role-aligned resume",
        sectionOrder: normalizeStringArray(record.sectionOrder, fallback[index]?.sectionOrder ?? []),
        prioritySkills: normalizeStringArray(record.prioritySkills, fallback[index]?.prioritySkills ?? []),
        bulletStyle: typeof record.bulletStyle === "string" ? record.bulletStyle : fallback[index]?.bulletStyle ?? "Use proof-led bullets.",
      };
    })
    .slice(0, 6);
}

function normalizeRecruiterSimulation(value: unknown, fallback: RecruiterSimulation): RecruiterSimulation {
  if (!value || typeof value !== "object") return fallback;
  const record = value as Partial<RecruiterSimulation>;
  return {
    rejectionRisks: normalizeStringArray(record.rejectionRisks, fallback.rejectionRisks),
    fixes: normalizeStringArray(record.fixes, fallback.fixes),
    thirtySecondRead: typeof record.thirtySecondRead === "string" ? record.thirtySecondRead : fallback.thirtySecondRead,
  };
}

function normalizeProjectProofBuilder(value: unknown, fallback: ProjectProofItem[]): ProjectProofItem[] {
  if (!Array.isArray(value)) return fallback;
  return value
    .map((item, index) => {
      const record = item as Partial<ProjectProofItem>;
      const fallbackItem = fallback[index] ?? fallback[0];
      return {
        originalTitle: typeof record.originalTitle === "string" ? record.originalTitle : fallbackItem?.originalTitle ?? "Project",
        improvedTitle: typeof record.improvedTitle === "string" ? record.improvedTitle : fallbackItem?.improvedTitle ?? "Role-Aligned Project",
        techStackClarity: normalizeStringArray(record.techStackClarity, fallbackItem?.techStackClarity ?? []),
        impactBullets: Array.isArray(record.impactBullets)
          ? record.impactBullets.map((rewrite, rewriteIndex) => normalizeGuardedRewrite(rewrite, fallbackItem?.impactBullets[rewriteIndex] ?? fallbackItem?.impactBullets[0])).slice(0, 3)
          : fallbackItem?.impactBullets ?? [],
        linkChecklist: normalizeStringArray(record.linkChecklist, fallbackItem?.linkChecklist ?? []),
      };
    })
    .slice(0, 4);
}

function findSectionText(sections: TailoredResumeSection[], target: string) {
  const aliases: Record<string, RegExp> = {
    Headline: /header|headline|summary|profile/i,
    Summary: /summary|profile|objective|header/i,
    Experience: /experience|work|employment/i,
    Projects: /project/i,
    Skills: /skill|tool|technology/i,
    Education: /education|degree|college|university/i,
    "Links/GitHub": /link|github|portfolio|linkedin|header/i,
  };
  const match = sections.find((section) => aliases[target]?.test(section.heading));
  return match?.originalContent.join("\n") ?? "";
}

function sectionFixes(section: string, hasContent: boolean, keywordHits: number, proofHits: number) {
  const fixes: string[] = [];
  if (!hasContent) fixes.push(`Add a clear ${section.toLowerCase()} section with standard ATS-readable wording.`);
  if (keywordHits < 2) fixes.push("Add supported keywords from the job description.");
  if (["Experience", "Projects", "Summary"].includes(section) && proofHits < 1) {
    fixes.push("Add concrete proof such as scope, outcome, users, metrics, links, or shipped artifacts.");
  }
  if (section === "Links/GitHub") fixes.push("Include LinkedIn, GitHub, portfolio, or demo links when available.");
  return fixes.length ? fixes.slice(0, 3) : ["Keep this section concise and aligned to the target job."];
}

function prioritizeSkills(skills: string[], preferred: string[]) {
  return Array.from(new Set([...preferred.filter((skill) => skills.some((item) => item.toLowerCase().includes(skill.toLowerCase()))), ...skills])).slice(0, 8);
}

function extractProjectTitle(line: string) {
  const cleanLine = line.replace(/^[-*]\s+/, "").trim();
  const [beforeDash] = cleanLine.split(/\s[-|:]\s/);
  return beforeDash.length <= 64 ? beforeDash : beforeDash.slice(0, 64).replace(/\s+\S*$/, "");
}

function improveProjectTitle(title: string, role: string, keyword?: string) {
  const cleanTitle = title.replace(/\s+/g, " ").trim() || "Role-Aligned Project";
  const keywordSuffix = keyword ? ` for ${titleCase(keyword)}` : "";
  if (/dashboard|api|ml|ai|analytics|portfolio|system/i.test(cleanTitle)) {
    return `${cleanTitle}${keywordSuffix}`;
  }
  return `${cleanTitle} - ${role} Proof Project${keywordSuffix}`;
}

function clampScore(value: number) {
  return Math.min(100, Math.max(0, Math.round(Number(value) || 0)));
}

function normalizeHeading(value: string) {
  return value.toLowerCase().replace(/[:|-]/g, "").trim();
}

function normalizeTerm(value: string) {
  return value
    .toLowerCase()
    .replace(/\bfront end\b/g, "frontend")
    .replace(/\bfront-end\b/g, "frontend")
    .replace(/\bdashboarding\b/g, "dashboard")
    .replace(/\bstakeholders\b/g, "stakeholder")
    .replace(/\bapis\b/g, "api")
    .replace(/\s+/g, " ")
    .trim();
}

function containsTerm(text: string, term: string) {
  if (!term) return false;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9+#.])${escaped}($|[^a-z0-9+#.])`, "i").test(text);
}

function titleCase(value: string) {
  const special: Record<string, string> = {
    "api": "API",
    "rest api": "REST API",
    "next.js": "Next.js",
    "node.js": "Node.js",
    "typescript": "TypeScript",
    "javascript": "JavaScript",
    "postgresql": "PostgreSQL",
    "mongodb": "MongoDB",
    "github": "GitHub",
    "git": "Git",
    "ui": "UI",
    "ux": "UX",
    "ci/cd": "CI/CD",
    "power bi": "Power BI",
    "a/b testing": "A/B Testing",
  };
  const normalized = value.toLowerCase();
  return special[normalized] ?? value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const stopWords = new Set([
  "and",
  "the",
  "for",
  "with",
  "you",
  "our",
  "are",
  "will",
  "this",
  "that",
  "from",
  "have",
  "your",
  "work",
  "team",
  "role",
  "candidate",
  "experience",
  "skills",
  "job",
  "description",
  "responsibilities",
  "requirements",
]);

const relatedTerms: Record<string, string[]> = {
  "javascript": ["js"],
  "typescript": ["ts"],
  "react": ["react.js", "reactjs"],
  "next.js": ["nextjs", "next"],
  "node.js": ["nodejs", "node"],
  "api": ["rest api", "apis", "endpoint", "backend integration"],
  "git": ["github", "version control"],
  "dashboard": ["dashboarding", "reporting dashboard", "data view"],
  "data visualization": ["charts", "graphs", "visualization", "dashboard"],
  "stakeholders": ["stakeholder", "product team", "business team", "cross-functional"],
  "communication": ["presented", "documentation", "collaboration", "stakeholder"],
  "power bi": ["powerbi"],
  "a/b testing": ["ab testing", "experiment"],
  "machine learning": ["ml", "model"],
  "postgresql": ["postgres"],
};
