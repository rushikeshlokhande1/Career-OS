import type {
  CareerAnalysis,
  ExtractedResume,
  GitHubIntelligence,
  RecruiterPersona,
  ScoreBreakdown,
} from "@/lib/intelligence/types";
import { calculateConfidenceIndex, calculateHiringProbability, calculateReadinessScore, clamp } from "@/lib/intelligence/scoring";
import { generateCareerTwin } from "@/lib/intelligence/career-twin";
import { generateHireReadySprint } from "@/lib/intelligence/hire-ready-sprint";

type RoleProfile = {
  requiredSkills: string[];
  keywords: string[];
};

export function createFallbackAnalysis({
  resume,
  github,
  breakdown,
  persona,
  targetRole = "Software Engineer",
  jobDescription = "",
}: {
  resume: ExtractedResume;
  github?: GitHubIntelligence;
  breakdown: ScoreBreakdown;
  persona: RecruiterPersona;
  targetRole?: string;
  jobDescription?: string;
}): CareerAnalysis {
  const readinessScore = calculateReadinessScore(breakdown);
  const confidenceIndex = calculateConfidenceIndex(resume, github);
  const hiringProbability = calculateHiringProbability(readinessScore, confidenceIndex);
  const weakAreas = weakestBreakdown(breakdown);
  const careerTwin = generateCareerTwin({ resume, github, breakdown, readinessScore, hiringProbability });
  const roleProfile = buildRoleProfile(targetRole, jobDescription);
  const matchedSkills = resume.skills.filter((skill) => roleProfile.requiredSkills.some((required) => sameSkill(skill, required)));
  const missingRoleSkills = roleProfile.requiredSkills.filter((skill) => !resume.skills.some((resumeSkill) => sameSkill(resumeSkill, skill)));
  const strongestProject = bestEvidenceLine(resume.projects, roleProfile.keywords) ?? resume.projects[0];
  const strongestExperience = bestEvidenceLine(resume.experience, roleProfile.keywords) ?? resume.experience[0];
  const deploymentVisible = breakdown.deploymentExperience >= 55;
  const missingSkills = buildMissingSkills({ missingRoleSkills, breakdown, targetRole });
  const recruiterAlerts = buildRecruiterAlerts({ resume, github, breakdown, strongestProject, targetRole });
  const recommendedProjects = buildRecommendedProjects(targetRole, roleProfile.requiredSkills, missingSkills);

  const analysis: CareerAnalysis = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    persona,
    targetRole,
    jobDescription,
    extractedResume: resume,
    scoreBreakdown: breakdown,
    readinessScore,
    confidenceIndex,
    hiringProbability,
    careerSummary: buildCareerSummary({
      readinessScore,
      targetRole,
      matchedSkills,
      strongestProject,
      strongestExperience,
      deploymentVisible,
      github,
    }),
    recruiterSimulation: {
      verdict:
        readinessScore >= 72
          ? "Move to a recruiter screen if the role matches the stack."
          : "Hold unless the candidate shows stronger project evidence, role-specific skills, or referrals.",
      noticedFirst: [
        matchedSkills.length
          ? `Role-matched skills for ${targetRole}: ${matchedSkills.slice(0, 6).join(", ")}.`
          : resume.skills.length
            ? `Skills are visible (${resume.skills.slice(0, 6).join(", ")}), but they are not tightly mapped to ${targetRole}.`
            : "Skills are not easy to scan from the resume text.",
        strongestProject ? `Strongest project signal: ${shorten(strongestProject, 150)}` : "Project proof is too thin or hidden.",
        strongestExperience ? `Experience signal: ${shorten(strongestExperience, 150)}` : "Experience or internship evidence is not obvious.",
        github ? `GitHub portfolio strength is ${github.portfolioStrength}/100 across ${github.publicRepos} public repos.` : "GitHub evidence is missing from the analysis.",
      ],
      rejectionRisks: buildRejectionRisks({ breakdown, missingRoleSkills, deploymentVisible, hasGithubSignal: Boolean(github), targetRole }),
      profileWeaknesses: weakAreas.map((area) => `${labelForArea(area)} needs stronger evidence.`),
      hiringBoosters: [
        strongestProject
          ? `Turn "${shorten(strongestProject, 70)}" into the flagship proof with metrics, architecture notes, and a demo link.`
          : "Add one flagship project with problem, stack, architecture, result, and demo link.",
        missingRoleSkills.length
          ? `Close the top role gap first: ${missingRoleSkills.slice(0, 3).join(", ")}.`
          : "Rewrite top bullets with action, technical decision, and result.",
        deploymentVisible ? "Make live links and GitHub repositories visible above the fold." : "Show one deployed project with a clean README and reproducible setup.",
      ],
      personaFeedback: {
        startup:
          `A startup recruiter for ${targetRole} will look for speed, ownership, and shipped proof. Your resume should make the strongest project and deployment status obvious in the first scan.`,
        faang:
          `A FAANG recruiter for ${targetRole} will look for fundamentals, clean impact, and high-signal evidence. Add stronger technical depth, quantified outcomes, and interview-ready project explanations.`,
        hr:
          `An HR manager screening ${targetRole} candidates will scan role fit and clarity first. Group skills, links, experience, and project outcomes so the fit is visible in 20 seconds.`,
      },
    },
    missingSkills,
    recommendedProjects,
    roadmap: [
      {
        phase: "Week 1",
        title: `${targetRole} evidence rebuild`,
        goal: missingRoleSkills.length ? `Make ${missingRoleSkills[0]} and existing project proof visible.` : "Make the profile readable in 20 seconds.",
        proof: "Role summary, quantified bullets, clear links, and one flagship project.",
        progress: breakdown.resumeQuality,
      },
      {
        phase: "Week 2",
        title: "Production proof sprint",
        goal: `Ship or polish one ${targetRole}-aligned project.`,
        proof: "Live URL, README, architecture, tests.",
        progress: Math.round((breakdown.projectQuality + breakdown.deploymentExperience) / 2),
      },
      {
        phase: "Week 3",
        title: "Recruiter simulation loop",
        goal: "Practice explaining decisions and tradeoffs.",
        proof: "Five polished recruiter answers.",
        progress: breakdown.communicationQuality,
      },
      {
        phase: "Week 4",
        title: "Targeted application packet",
        goal: "Apply with a specific role narrative.",
        proof: "Resume, project case study, outreach message.",
        progress: hiringProbability,
      },
    ],
    interviewPreparation: [
      strongestProject
        ? `Prepare a 90-second walkthrough of this project: ${shorten(strongestProject, 110)}`
        : "Prepare a 90-second walkthrough of your strongest project.",
      missingRoleSkills[0] ? `Practice ${missingRoleSkills[0]} fundamentals with examples from your own work.` : "Practice core role fundamentals with examples from your own work.",
      "Write answers for debugging, ownership, conflict, and learning velocity.",
      "Explain one technical tradeoff you made and what you would change now.",
    ],
    dailyMissions: [
      { title: `Rewrite one ${targetRole} resume bullet with a metric`, impact: "Improves communication signal", difficulty: "Low", estimatedMinutes: 20 },
      { title: "Add setup steps and screenshots to your strongest GitHub README", impact: "Improves portfolio trust", difficulty: "Medium", estimatedMinutes: 35 },
      { title: deploymentVisible ? "Move live demo and GitHub links higher on the resume" : "Deploy your strongest project publicly", impact: "Increases recruiter confidence", difficulty: deploymentVisible ? "Low" : "High", estimatedMinutes: deploymentVisible ? 20 : 90 },
      { title: missingRoleSkills[0] ? `Practice 5 ${missingRoleSkills[0]} interview questions` : "Practice 5 technical interview questions", impact: "Reduces screening risk", difficulty: "Medium", estimatedMinutes: 45 },
    ],
    recruiterAlerts,
    trendingIndustrySkills: roleProfile.requiredSkills.slice(0, 5),
    personalizedInsights: [
      matchedSkills.length
        ? `Your strongest current alignment for ${targetRole} is ${matchedSkills.slice(0, 4).join(", ")}. Build the resume story around that proof.`
        : `Your fastest path to ${targetRole} is mapping existing work to the role requirements, not adding random skills.`,
      missingRoleSkills.length
        ? `The most visible gap is ${missingRoleSkills.slice(0, 3).join(", ")}. Close one gap with project evidence before applying heavily.`
        : `Recruiters need evidence that you can finish, deploy, explain, and maintain ${targetRole}-level work.`,
      strongestProject
        ? "A single polished flagship project could raise your callback odds more than five small, under-explained projects."
        : "Add one real project with deployment, data, and a clear user problem before relying on volume applications.",
    ],
    careerTwin,
    hireReadySprint: {} as CareerAnalysis["hireReadySprint"],
    github,
  };

  return {
    ...analysis,
    hireReadySprint: generateHireReadySprint(analysis),
  };
}

function buildCareerSummary({
  readinessScore,
  targetRole,
  matchedSkills,
  strongestProject,
  strongestExperience,
  deploymentVisible,
  github,
}: {
  readinessScore: number;
  targetRole: string;
  matchedSkills: string[];
  strongestProject?: string;
  strongestExperience?: string;
  deploymentVisible: boolean;
  github?: GitHubIntelligence;
}) {
  const fit = matchedSkills.length
    ? `The strongest role fit comes from ${matchedSkills.slice(0, 4).join(", ")}`
    : "The resume has usable raw material, but the role fit is not explicit yet";
  const proof = strongestProject ?? strongestExperience ?? "the current resume evidence";
  const readiness = readinessScore >= 75 ? "credible shortlist potential" : readinessScore >= 58 ? "partial readiness" : "early proof-building readiness";
  const githubSignal = github ? ` GitHub adds a ${github.portfolioStrength}/100 portfolio signal.` : "";
  const deploymentSignal = deploymentVisible ? " Deployment proof is visible." : " Deployment or production proof is still a major missing signal.";

  return `${fit} for ${targetRole}. Current profile reads as ${readiness}; the main proof to sharpen is "${shorten(proof, 130)}".${deploymentSignal}${githubSignal}`;
}

function buildRoleProfile(targetRole: string, jobDescription: string): RoleProfile {
  const roleText = `${targetRole} ${jobDescription}`.toLowerCase();
  const profiles: Array<{ match: RegExp; skills: string[]; keywords: string[] }> = [
    {
      match: /data|machine learning|ml|ai|analyst|scientist/,
      skills: ["Python", "SQL", "Pandas", "NumPy", "Machine Learning", "Data Analysis", "Statistics", "Visualization"],
      keywords: ["model", "data", "analysis", "sql", "python", "dashboard", "prediction", "dataset"],
    },
    {
      match: /frontend|front-end|react|ui|web/,
      skills: ["React", "TypeScript", "JavaScript", "HTML", "CSS", "Next.js", "Testing", "API"],
      keywords: ["react", "ui", "frontend", "responsive", "component", "accessibility", "api"],
    },
    {
      match: /backend|back-end|server|api|node|java/,
      skills: ["Node.js", "SQL", "API", "PostgreSQL", "Docker", "Testing", "System Design", "Authentication"],
      keywords: ["api", "server", "database", "auth", "postgres", "scalable", "backend"],
    },
    {
      match: /full.?stack|software engineer|sde|developer/,
      skills: ["JavaScript", "TypeScript", "React", "Node.js", "SQL", "API", "Git", "Testing"],
      keywords: ["built", "developed", "api", "database", "react", "node", "deployed"],
    },
    {
      match: /devops|cloud|platform/,
      skills: ["AWS", "Docker", "Kubernetes", "CI/CD", "Linux", "Monitoring", "Security", "Scripting"],
      keywords: ["cloud", "docker", "pipeline", "deployment", "linux", "automation"],
    },
  ];
  const base = profiles.find((profile) => profile.match.test(roleText)) ?? profiles[3];
  const jdSkills = extractJobDescriptionSkills(jobDescription);

  return {
    requiredSkills: unique([...jdSkills, ...base.skills]).slice(0, 8),
    keywords: unique([...base.keywords, ...jdSkills.map((skill) => skill.toLowerCase())]),
  };
}

function extractJobDescriptionSkills(jobDescription: string) {
  if (!jobDescription.trim()) return [];
  const knownSkills = [
    "React",
    "Next.js",
    "TypeScript",
    "JavaScript",
    "Node.js",
    "Python",
    "Java",
    "SQL",
    "PostgreSQL",
    "MongoDB",
    "AWS",
    "Docker",
    "Kubernetes",
    "Machine Learning",
    "Pandas",
    "NumPy",
    "Testing",
    "Git",
    "REST",
    "GraphQL",
    "Power BI",
    "Tableau",
  ];
  const lower = jobDescription.toLowerCase();
  return knownSkills.filter((skill) => lower.includes(skill.toLowerCase()));
}

function buildMissingSkills({
  missingRoleSkills,
  breakdown,
  targetRole,
}: {
  missingRoleSkills: string[];
  breakdown: ScoreBreakdown;
  targetRole: string;
}) {
  const skills = missingRoleSkills.slice(0, 3).map((skill, index) => ({
    skill,
    severity: clamp(82 - index * 8),
    whyItMatters: `${targetRole} screens often expect visible ${skill} proof, either in projects, work experience, or interview examples.`,
  }));

  if (breakdown.deploymentExperience < 55) {
    skills.push({ skill: "Deployment and production ownership", severity: 82, whyItMatters: "Recruiters trust shipped systems more than local demos." });
  }
  if (breakdown.communicationQuality < 60) {
    skills.push({ skill: "Technical storytelling", severity: 68, whyItMatters: "Clear project explanation helps recruiters understand the impact of your work quickly." });
  }
  if (breakdown.technicalDepth < 60) {
    skills.push({ skill: "System design vocabulary", severity: 61, whyItMatters: "Even freshers need to explain architecture, tradeoffs, data flow, and failure cases." });
  }

  return uniqueBySkill(skills).slice(0, 4);
}

function buildRecommendedProjects(
  targetRole: string,
  requiredSkills: string[],
  missingSkills: Array<{ skill: string; severity: number; whyItMatters: string }>,
) {
  const topSkills = unique([...missingSkills.map((item) => item.skill), ...requiredSkills]).slice(0, 4);
  return [
    {
      title: `${targetRole} proof dashboard`,
      outcome: `Shows role-specific execution with ${topSkills.slice(0, 3).join(", ")} and a recruiter-readable live demo.`,
      stack: topSkills.slice(0, 4),
    },
    {
      title: "Production-ready flagship project",
      outcome: "Demonstrates deployment, README quality, testing, data persistence, and clear user value.",
      stack: unique([requiredSkills[0] ?? "TypeScript", requiredSkills[1] ?? "SQL", "Testing", "Deployment"]),
    },
    {
      title: "Portfolio trust monitor",
      outcome: "Turns GitHub, resume, and project evidence into a measurable portfolio-health tool.",
      stack: unique(["GitHub API", requiredSkills[0] ?? "React", "Charts", "Automation"]),
    },
  ];
}

function buildRecruiterAlerts({
  resume,
  github,
  breakdown,
  strongestProject,
  targetRole,
}: {
  resume: ExtractedResume;
  github?: GitHubIntelligence;
  breakdown: ScoreBreakdown;
  strongestProject?: string;
  targetRole: string;
}) {
  const alerts = [];
  if (!strongestProject) alerts.push(`No strong ${targetRole} project evidence was detected in the resume text.`);
  if (breakdown.deploymentExperience < 55) alerts.push("Top project needs clearer production context, live link, or deployment proof.");
  if (!github && !resume.links.some((link) => /github/i.test(link))) alerts.push("Resume should surface GitHub above the fold.");
  if (github && github.readmeQuality < 65) alerts.push("Several GitHub repositories need stronger README files with setup, screenshots, and architecture notes.");
  if (resume.skills.length < 6) alerts.push("Skills list is too thin or not being extracted clearly from the resume.");
  if (breakdown.communicationQuality < 60) alerts.push("Bullets need more measurable outcomes and fewer generic feature descriptions.");
  return alerts.slice(0, 4);
}

function buildRejectionRisks({
  breakdown,
  missingRoleSkills,
  deploymentVisible,
  hasGithubSignal,
  targetRole,
}: {
  breakdown: ScoreBreakdown;
  missingRoleSkills: string[];
  deploymentVisible: boolean;
  hasGithubSignal: boolean;
  targetRole: string;
}) {
  const risks = [];
  if (!deploymentVisible) risks.push("Recruiter may not see production experience quickly enough.");
  if (missingRoleSkills.length) risks.push(`Missing visible ${targetRole} proof for: ${missingRoleSkills.slice(0, 3).join(", ")}.`);
  if (breakdown.projectQuality < 60) risks.push("Project bullets may describe features without proving impact.");
  if (breakdown.technicalDepth < 60) risks.push("Technical depth is not yet backed by architecture, testing, or deployment details.");
  if (!hasGithubSignal) risks.push("GitHub was not analyzed, so portfolio trust is weaker than it could be.");
  return risks.slice(0, 4);
}

function bestEvidenceLine(lines: string[], keywords: string[]) {
  return lines
    .map((line) => ({
      line,
      score: keywords.reduce((total, keyword) => total + (line.toLowerCase().includes(keyword.toLowerCase()) ? 1 : 0), 0) + metricCount(line),
    }))
    .sort((a, b) => b.score - a.score)[0]?.line;
}

function metricCount(line: string) {
  return (line.match(/\b\d+%?|\b\d+x\b/gi) ?? []).length;
}

function sameSkill(left: string, right: string) {
  return normalizeSkill(left) === normalizeSkill(right);
}

function normalizeSkill(skill: string) {
  return skill.toLowerCase().replace(/[^a-z0-9+#]/g, "");
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function uniqueBySkill<T extends { skill: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalizeSkill(item.skill);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function shorten(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3).trim()}...` : value;
}

function weakestBreakdown(breakdown: ScoreBreakdown) {
  return Object.entries(breakdown)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([key]) => key as keyof ScoreBreakdown);
}

function labelForArea(area: keyof ScoreBreakdown) {
  return area.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}
