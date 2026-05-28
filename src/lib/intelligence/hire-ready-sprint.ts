import type { CareerAnalysis, HireReadySprint, HireReadySprintDay } from "@/lib/intelligence/types";
import { clamp } from "@/lib/intelligence/scoring";

type SprintInput = Pick<
  CareerAnalysis,
  "targetRole" | "readinessScore" | "hiringProbability" | "missingSkills" | "recruiterSimulation" | "recommendedProjects" | "github"
>;

export function generateHireReadySprint(analysis: SprintInput): HireReadySprint {
  const biggestWeakness = analysis.missingSkills[0]?.skill ?? "proof clarity";
  const hasGithub = Boolean(analysis.github);
  const projectedReadinessGain = analysis.readinessScore >= 75 ? 8 : 18;
  const projectedHiringGain = analysis.hiringProbability >= 65 ? 8 : 20;

  return {
    verdict:
      analysis.readinessScore >= 75
        ? `You are close to being shortlist-ready for ${analysis.targetRole}, but your proof still needs sharper packaging.`
        : `You are not fully shortlist-ready for ${analysis.targetRole} yet. The gap is fixable, but it needs focused proof-building.`,
    brutalTruth:
      analysis.recruiterSimulation.rejectionRisks[0] ??
      `Recruiters may not see enough evidence that you can do real ${analysis.targetRole} work.`,
    fastestPath: `Fix ${biggestWeakness}, ship one visible proof asset, and practice explaining your strongest project clearly.`,
    daysToImprove: 14,
    projectedReadinessGain,
    projectedHiringGain,
    sprintDays: buildSprintDays({ targetRole: analysis.targetRole, biggestWeakness, hasGithub }),
  };
}

function buildSprintDays({
  targetRole,
  biggestWeakness,
  hasGithub,
}: {
  targetRole: string;
  biggestWeakness: string;
  hasGithub: boolean;
}): HireReadySprintDay[] {
  return [
    day(1, "Rewrite your role story", "Make your profile instantly understandable.", `Write a 3-line summary for ${targetRole}: who you are, what you build, and what proof you have.`, "Resume", "Clear positioning", "Low"),
    day(2, "Fix resume proof", "Turn claims into evidence.", "Rewrite your top 3 bullets with action, technical decision, and measurable result.", "Resume", "Stronger first impression", "Medium"),
    day(3, "Choose one flagship project", "Stop spreading attention across weak proof.", `Pick the project most relevant to ${targetRole} and make it your flagship.`, "Project", "One strong hiring narrative", "Low"),
    day(4, "Add architecture proof", "Show technical depth visually.", "Add architecture notes: data flow, APIs, database, tradeoffs, and what could break at scale.", "Project", "Technical depth signal", "Medium"),
    day(5, "Deploy or improve live demo", "Make the project feel real.", "Deploy the flagship project or record a 90-second walkthrough if deployment is not ready.", "Project", "Production signal", "High"),
    day(6, "Repair GitHub trust", "Make repositories recruiter-readable.", hasGithub ? "Update README with setup, screenshots, demo link, tech stack, and decisions." : "Add your GitHub and create one clean repository README.", "GitHub", "Portfolio credibility", "Medium"),
    day(7, "Mock project interview", "Practice defending your work.", "Use Interview Arena: Project Discussion round. Answer with context, decision, tradeoff, result.", "Interview", "Interview baseline", "Medium"),
    day(8, `Attack ${biggestWeakness}`, "Fix the biggest blocker first.", `Spend one focused session improving evidence for: ${biggestWeakness}.`, "Skills", "Weakness reduction", "Medium"),
    day(9, "Build one missing proof feature", "Add real-world complexity.", "Add auth, database persistence, tests, analytics, or error handling to the flagship project.", "Project", "Real-world complexity", "High"),
    day(10, "Prepare recruiter answers", "Stop improvising important answers.", "Write answers for: tell me about yourself, strongest project, biggest challenge, why this role.", "Assistant", "Sharper communication", "Low"),
    day(11, "Technical revision sprint", "Patch fundamentals recruiters will test.", "Revise the top 2 missing technical topics from your analysis with examples from your project.", "Skills", "Screening confidence", "Medium"),
    day(12, "FAANG-style pressure round", "Test depth under pressure.", "Use Interview Arena: FAANG-style or Technical Round. Review weak topics after scoring.", "Interview", "Pressure-tested answers", "High"),
    day(13, "Create application packet", "Package proof for outreach.", "Prepare resume, GitHub link, demo link, project summary, and a short recruiter message.", "Resume", "Ready-to-send packet", "Medium"),
    day(14, "Final readiness review", "Decide if you can apply aggressively.", "Re-run analysis and compare readiness, hiring probability, GitHub signal, and interview score.", "Assistant", "Go/no-go clarity", "Low"),
  ];
}

function day(
  dayNumber: number,
  title: string,
  objective: string,
  task: string,
  tool: HireReadySprintDay["tool"],
  outcome: string,
  difficulty: HireReadySprintDay["difficulty"],
): HireReadySprintDay {
  return { day: dayNumber, title, objective, task, tool, outcome, difficulty };
}

export function projectedScore(score: number, gain: number) {
  return clamp(score + gain);
}
