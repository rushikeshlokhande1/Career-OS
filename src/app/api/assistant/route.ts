import { NextResponse } from "next/server";
import { z } from "zod";
import { answerCareerQuestion } from "@/lib/intelligence/assistant";
import { ensureCareerTwin } from "@/lib/intelligence/analysis-normalizer";

export const runtime = "nodejs";

const requestSchema = z.object({
  analysis: z.unknown(),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1),
    }),
  ),
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const content = await answerCareerQuestion({
      analysis: ensureCareerTwin(body.analysis as never),
      messages: body.messages,
    });

    return NextResponse.json({ message: { role: "assistant", content } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "CareerOS Assistant could not answer right now.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
