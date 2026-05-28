import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureCareerTwin } from "@/lib/intelligence/analysis-normalizer";
import { difficulties, runInterviewTurn, technologies, technicalCategories } from "@/lib/intelligence/interview";
import type { AskedQuestionMemory, InterviewDifficulty, InterviewMode, InterviewTechnology, InterviewTurn } from "@/lib/intelligence/interview";

export const runtime = "nodejs";

const schema = z.object({
  analysis: z.unknown().optional(),
  technology: z.enum(technologies),
  difficulty: z.enum(difficulties),
  mode: z.enum(["Training", "Real Interview"]).default("Training"),
  turns: z.array(
    z.object({
      question: z.string(),
      answer: z.string().optional(),
      concept: z.string().optional(),
      category: z.enum(technicalCategories).optional(),
      difficulty: z.enum(difficulties).optional(),
      feedback: z.unknown().optional(),
    }),
  ),
  askedQuestions: z.array(
    z.object({
      question: z.string(),
      concept: z.string(),
      category: z.enum(technicalCategories),
      difficulty: z.enum(difficulties),
    }),
  ).default([]),
  weakTopics: z.array(z.string()).default([]),
  latestAnswer: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const result = await runInterviewTurn({
      analysis: body.analysis ? ensureCareerTwin(body.analysis as never) : undefined,
      technology: body.technology as InterviewTechnology,
      difficulty: body.difficulty as InterviewDifficulty,
      mode: body.mode as InterviewMode,
      turns: body.turns as InterviewTurn[],
      askedQuestions: body.askedQuestions as AskedQuestionMemory[],
      weakTopics: body.weakTopics,
      latestAnswer: body.latestAnswer,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Interview Arena could not continue.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
