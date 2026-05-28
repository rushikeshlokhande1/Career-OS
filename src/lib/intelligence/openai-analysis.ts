import OpenAI from "openai";
import type { CareerAnalysis, ExtractedResume, GitHubIntelligence, RecruiterPersona, ScoreBreakdown } from "@/lib/intelligence/types";
import { createFallbackAnalysis } from "@/lib/intelligence/fallback";
import { ensureCareerTwin } from "@/lib/intelligence/analysis-normalizer";

export async function generateCareerAnalysis({
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
}): Promise<CareerAnalysis> {
  if (!process.env.OPENAI_API_KEY) {
    return createFallbackAnalysis({ resume, github, breakdown, persona, targetRole, jobDescription });
  }

  try {
    const fallback = createFallbackAnalysis({ resume, github, breakdown, persona, targetRole, jobDescription });
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.45,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are CareerOS AI, a brutally honest but constructive career intelligence engine for students and freshers. Return only valid JSON matching the provided shape. Be specific, realistic, emotionally impactful, and recruiter-grade. Do not invent internships, degrees, companies, or achievements not supported by evidence.",
        },
        {
          role: "user",
          content: JSON.stringify({
            instruction:
              "Improve the fallback analysis while preserving the numeric scores. Generate professional AI career intelligence and recruiter simulation. Use concise, high-signal language.",
            persona,
            resume,
            github,
            scoreBreakdown: breakdown,
            targetRole,
            jobDescription,
            requiredShape: fallback,
          }),
        },
      ],
    });

    const content = completion.choices[0]?.message.content;
    if (!content) return fallback;

    return ensureCareerTwin({
      ...fallback,
      ...JSON.parse(content),
      id: fallback.id,
      createdAt: fallback.createdAt,
      persona,
      targetRole,
      jobDescription,
      extractedResume: resume,
      scoreBreakdown: breakdown,
      readinessScore: fallback.readinessScore,
      confidenceIndex: fallback.confidenceIndex,
      hiringProbability: fallback.hiringProbability,
      github,
    });
  } catch {
    return createFallbackAnalysis({ resume, github, breakdown, persona, targetRole, jobDescription });
  }
}
