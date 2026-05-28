import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeGitHubUsername } from "@/lib/intelligence/github";
import { generateCareerAnalysis } from "@/lib/intelligence/openai-analysis";
import { parseResumeText } from "@/lib/intelligence/resume-parser";
import { calculateAtsReport, calculateScoreBreakdown } from "@/lib/intelligence/scoring";
import type { RecruiterPersona } from "@/lib/intelligence/types";
import { extractPdfText } from "@/lib/pdf/server";

export const runtime = "nodejs";

const requestSchema = z.object({
  githubUsername: z.string().optional().default(""),
  targetRole: z.string().optional().default("Software Engineer"),
  jobDescription: z.string().optional().default(""),
  persona: z.enum(["startup", "faang", "hr"]).optional().default("startup"),
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("resume");
    const fields = requestSchema.parse({
      githubUsername: formData.get("githubUsername")?.toString(),
      targetRole: formData.get("targetRole")?.toString(),
      jobDescription: formData.get("jobDescription")?.toString(),
      persona: formData.get("persona")?.toString(),
    });

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Upload a PDF resume to run CareerOS intelligence." }, { status: 400 });
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "CareerOS currently supports PDF resumes only." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extractedText = await extractPdfText(buffer);
    const wordCount = extractedText.split(/\s+/).filter(Boolean).length;
    if (wordCount < 80) {
      return NextResponse.json(
        {
          error:
            "CareerOS could not read enough real resume text from this PDF. Upload a text-based PDF, or export the resume again without scanned images.",
        },
        { status: 422 },
      );
    }

    const extractedResume = parseResumeText(extractedText);
    const github = await analyzeGitHubUsername(fields.githubUsername);
    const scoreBreakdown = calculateScoreBreakdown(extractedResume, github);
    const atsReport = calculateAtsReport(extractedResume, fields.targetRole.trim() || "Software Engineer", fields.jobDescription);
    const analysis = await generateCareerAnalysis({
      resume: extractedResume,
      github,
      breakdown: scoreBreakdown,
      persona: fields.persona as RecruiterPersona,
      targetRole: fields.targetRole.trim() || "Software Engineer",
      jobDescription: fields.jobDescription,
    });

    return NextResponse.json({ analysis: { ...analysis, atsReport } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "CareerOS intelligence failed to complete.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
