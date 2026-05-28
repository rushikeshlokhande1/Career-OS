import { generateCareerTwin } from "@/lib/intelligence/career-twin";
import type { CareerAnalysis } from "@/lib/intelligence/types";
import { generateHireReadySprint } from "@/lib/intelligence/hire-ready-sprint";

export function ensureCareerTwin(analysis: CareerAnalysis): CareerAnalysis {
  const normalized = {
    ...analysis,
    targetRole: analysis.targetRole ?? "Software Engineer",
    jobDescription: analysis.jobDescription ?? "",
    careerTwin: analysis.careerTwin ?? generateCareerTwin({
      resume: analysis.extractedResume,
      github: analysis.github,
      breakdown: analysis.scoreBreakdown,
      readinessScore: analysis.readinessScore,
      hiringProbability: analysis.hiringProbability,
    }),
  };

  return {
    ...normalized,
    hireReadySprint: normalized.hireReadySprint ?? generateHireReadySprint(normalized),
  };
}
