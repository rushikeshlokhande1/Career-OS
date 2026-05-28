import OpenAI from "openai";
import type { CareerAnalysis } from "@/lib/intelligence/types";

export type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function answerCareerQuestion({
  analysis,
  messages,
}: {
  analysis: CareerAnalysis;
  messages: AssistantMessage[];
}) {
  const latestQuestion = messages.filter((message) => message.role === "user").at(-1)?.content ?? "";

  if (!process.env.OPENAI_API_KEY) {
    return fallbackAssistantAnswer(analysis, latestQuestion);
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.45,
      messages: [
        {
          role: "system",
          content:
            "You are CareerOS AI Assistant. You are not a generic chatbot. You know the student's resume analysis, GitHub signals, weaknesses, target role, recruiter risks, roadmap, missions, and career profile. Give concise, specific, emotionally intelligent guidance. Be honest but constructive. Never invent facts. Keep answers actionable and under 180 words unless the user asks for depth.",
        },
        {
          role: "user",
          content: JSON.stringify({
            instruction: "Use this career intelligence profile as memory. Answer the user's latest question.",
            profile: compactProfile(analysis),
            conversation: messages.slice(-8),
          }),
        },
      ],
    });

    return completion.choices[0]?.message.content ?? fallbackAssistantAnswer(analysis, latestQuestion);
  } catch {
    return fallbackAssistantAnswer(analysis, latestQuestion);
  }
}

function fallbackAssistantAnswer(analysis: CareerAnalysis, question: string) {
  const q = question.toLowerCase();
  const weakness = analysis.missingSkills[0];
  const mission = analysis.dailyMissions[0];
  const project = analysis.recommendedProjects[0];

  if (q.includes("reject") || q.includes("rejected") || q.includes("concern")) {
    return `For ${analysis.targetRole}, the biggest recruiter concern is: ${analysis.recruiterSimulation.rejectionRisks[0]} Your highest-risk gap is ${weakness.skill}. Fix that first because ${weakness.whyItMatters}`;
  }

  if (q.includes("week") || q.includes("next") || q.includes("today")) {
    return `Your next move is simple: ${mission.title}. Then spend this week on "${analysis.roadmap[0].title}" because the goal is ${analysis.roadmap[0].goal}. Do not add random skills yet; make your existing proof more visible.`;
  }

  if (q.includes("project") || q.includes("build")) {
    return `Build this first: ${project.title}. Why: ${project.outcome}. Use ${project.stack.join(", ")}. This is better than another clone because it creates proof recruiters can understand.`;
  }

  if (q.includes("github")) {
    return analysis.github
      ? `Your GitHub signal is ${analysis.github.portfolioStrength}/100. ${analysis.github.insights[0]} The fastest improvement is README quality: setup steps, screenshots, architecture, and a clear demo link.`
      : "Add your GitHub username and run analysis again. Without GitHub evidence, recruiters have less proof that your projects are real and maintained.";
  }

  return `Here is the honest picture: your readiness for ${analysis.targetRole} is ${analysis.readinessScore}/100 and hiring probability is ${analysis.hiringProbability}%. The biggest blocker is ${weakness.skill}. Start with: ${mission.title}. That is the shortest path from uncertainty to visible hiring proof.`;
}

function compactProfile(analysis: CareerAnalysis) {
  return {
    targetRole: analysis.targetRole,
    readinessScore: analysis.readinessScore,
    hiringProbability: analysis.hiringProbability,
    careerSummary: analysis.careerSummary,
    biggestWeakness: analysis.missingSkills[0],
    missingSkills: analysis.missingSkills,
    recruiterRisks: analysis.recruiterSimulation.rejectionRisks,
    recruiterPerception: analysis.careerTwin.recruiterPerceptionSummary,
    careerArchetype: analysis.careerTwin.careerArchetype,
    dailyMissions: analysis.dailyMissions,
    roadmap: analysis.roadmap,
    recommendedProjects: analysis.recommendedProjects,
    github: analysis.github
      ? {
          portfolioStrength: analysis.github.portfolioStrength,
          insights: analysis.github.insights,
          techStackDiversity: analysis.github.techStackDiversity,
        }
      : null,
  };
}
