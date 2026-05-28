import type { CareerTwin, ExtractedResume, GitHubIntelligence, ScoreBreakdown } from "@/lib/intelligence/types";
import { clamp } from "@/lib/intelligence/scoring";

export function generateCareerTwin({
  resume,
  github,
  breakdown,
  readinessScore,
  hiringProbability,
}: {
  resume: ExtractedResume;
  github?: GitHubIntelligence;
  breakdown: ScoreBreakdown;
  readinessScore: number;
  hiringProbability: number;
}): CareerTwin {
  const strongest = strongestAreas(breakdown);
  const weakest = weakestAreas(breakdown);
  const hasManyProjects = resume.projects.length >= 2;
  const hasDeployment = breakdown.deploymentExperience >= 55;
  const hasGithub = Boolean(github);
  const growthPotential = clamp(58 + (100 - readinessScore) * 0.28 + breakdown.skillsRelevance * 0.18 + (hasGithub ? 8 : 0));
  const careerMomentum = clamp(readinessScore * 0.45 + growthPotential * 0.28 + (github?.commitConsistency ?? 35) * 0.18 + breakdown.communicationQuality * 0.09);
  const archetype = chooseArchetype(breakdown, hasManyProjects, hasDeployment);

  return {
    careerArchetype: archetype,
    learningStyle: breakdown.technicalDepth >= 60 ? "Deep conceptual learner" : "Fast pattern learner who improves through building",
    executionPattern: hasDeployment
      ? "Ships visible work and learns from real product constraints"
      : "Builds quickly, but needs stronger finishing and deployment rituals",
    technicalPersonality:
      breakdown.skillsRelevance >= 70
        ? "Stack-aware engineer with strong implementation instincts"
        : "Emerging engineer with useful fundamentals and uneven role alignment",
    communicationStyle:
      breakdown.communicationQuality >= 65
        ? "Clear technical storyteller with credible proof language"
        : "Under-explains impact; the work is stronger than the story recruiters see",
    growthPotential,
    readinessTier: tierFor(readinessScore),
    industryAlignment:
      readinessScore >= 75
        ? "Aligned for selective fresher roles with sharper positioning"
        : "Aligned for early startup and internship roles after proof upgrades",
    topStrengths: [
      strengthLabel(strongest[0]),
      strengthLabel(strongest[1]),
      hasGithub ? "Portfolio signal is visible outside the resume" : "Resume has enough raw material to become a strong narrative",
    ],
    topWeaknesses: [
      weaknessLabel(weakest[0]),
      weaknessLabel(weakest[1]),
      hasDeployment ? "Needs more recruiter-ready storytelling" : "Deployment proof is the highest-leverage missing signal",
    ],
    riskAreas: [
      "Recruiters may underestimate you if project outcomes are not quantified.",
      "Your profile can look academic unless live product proof is visible.",
      "Interview confidence may lag behind actual building ability without rehearsed stories.",
    ],
    recruiterPerceptionSummary:
      readinessScore >= 70
        ? "Recruiters will see a serious builder, but will still test whether your projects are production-grade or just polished demos."
        : "Recruiters will see potential, but may not yet see enough evidence to justify a callback without a referral or stronger project proof.",
    emotionalSummary:
      "Your profile suggests you are not starting from zero. The gap is less about talent and more about making your ability legible to the market.",
    futureSimulations: [
      {
        title: "Startup readiness window",
        prediction: `You could become startup-ready within ${readinessScore >= 70 ? 30 : 45} days if you ship one deployed project with a strong README.`,
        days: readinessScore >= 70 ? 30 : 45,
        probabilityDelta: hasDeployment ? 10 : 20,
      },
      {
        title: "Recruiter confidence lift",
        prediction: `Improving technical storytelling could raise recruiter confidence by ${breakdown.communicationQuality >= 60 ? 9 : 16}%.`,
        days: 14,
        probabilityDelta: breakdown.communicationQuality >= 60 ? 9 : 16,
      },
      {
        title: "Portfolio proof upgrade",
        prediction: hasGithub
          ? "A focused repository cleanup sprint can turn GitHub into a stronger proof surface."
          : "Adding GitHub evidence could materially improve trust before interviews begin.",
        days: 21,
        probabilityDelta: hasGithub ? 8 : 14,
      },
    ],
    growthForecast: [
      { stage: "Current signal", level: readinessScore, focus: "Make existing proof easier to trust", timeline: "Now" },
      { stage: "Proof upgrade", level: clamp(readinessScore + 12), focus: "Deployment, README, metrics", timeline: "14 days" },
      { stage: "Recruiter-ready", level: clamp(readinessScore + 22), focus: "Role narrative and interview stories", timeline: "30-45 days" },
      { stage: "Market momentum", level: clamp(hiringProbability + 28), focus: "Targeted applications and referrals", timeline: "60 days" },
    ],
    skillExpansionTimeline: [
      { skill: "Deployment", current: breakdown.deploymentExperience, predicted: clamp(breakdown.deploymentExperience + 28), timeline: "2 weeks" },
      { skill: "Technical storytelling", current: breakdown.communicationQuality, predicted: clamp(breakdown.communicationQuality + 22), timeline: "10 days" },
      { skill: "System depth", current: breakdown.technicalDepth, predicted: clamp(breakdown.technicalDepth + 18), timeline: "4 weeks" },
      { skill: "Portfolio trust", current: breakdown.githubActivity, predicted: clamp(breakdown.githubActivity + 16), timeline: "3 weeks" },
    ],
    careerMomentum,
  };
}

function chooseArchetype(breakdown: ScoreBreakdown, hasManyProjects: boolean, hasDeployment: boolean) {
  if (hasManyProjects && hasDeployment) return "Builder-Type Engineer";
  if (breakdown.technicalDepth >= 65) return "Analytical Problem Solver";
  if (breakdown.skillsRelevance >= 70 && breakdown.deploymentExperience < 50) return "Fast Learner With Weak Deployment Experience";
  if (breakdown.communicationQuality < 55) return "Strong Builder With Weak Technical Storytelling";
  return "Emerging Product-Minded Engineer";
}

function tierFor(score: number) {
  if (score >= 85) return "Interview-ready";
  if (score >= 72) return "Callback-ready";
  if (score >= 58) return "Proof-building";
  return "Foundation-building";
}

function strongestAreas(breakdown: ScoreBreakdown) {
  return Object.entries(breakdown)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key as keyof ScoreBreakdown);
}

function weakestAreas(breakdown: ScoreBreakdown) {
  return Object.entries(breakdown)
    .sort((a, b) => a[1] - b[1])
    .map(([key]) => key as keyof ScoreBreakdown);
}

function strengthLabel(area: keyof ScoreBreakdown) {
  const labels: Record<keyof ScoreBreakdown, string> = {
    resumeQuality: "Resume has usable raw evidence",
    projectQuality: "Project work can become strong hiring proof",
    skillsRelevance: "Skills align with modern engineering roles",
    deploymentExperience: "Deployment signal is visible",
    githubActivity: "GitHub activity supports credibility",
    technicalDepth: "Technical depth is emerging",
    communicationQuality: "Communication signal is recruiter-friendly",
  };
  return labels[area];
}

function weaknessLabel(area: keyof ScoreBreakdown) {
  const labels: Record<keyof ScoreBreakdown, string> = {
    resumeQuality: "Resume clarity weakens first impression",
    projectQuality: "Projects need stronger outcome proof",
    skillsRelevance: "Skills need tighter role alignment",
    deploymentExperience: "Deployment experience is not convincing yet",
    githubActivity: "GitHub does not yet carry enough trust",
    technicalDepth: "Technical depth is not obvious to recruiters",
    communicationQuality: "Technical storytelling undersells ability",
  };
  return labels[area];
}
