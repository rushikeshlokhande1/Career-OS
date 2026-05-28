import { NextResponse } from "next/server";
import { z } from "zod";
import { tailorResumeToJob } from "@/lib/intelligence/resume-tailor";
import { extractPdfText } from "@/lib/pdf/server";

export const runtime = "nodejs";

const schema = z.object({
  jobDescription: z.string().min(40, "Paste a meaningful job description."),
  resumeText: z.string().optional().default(""),
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("resume");
    const fields = schema.parse({
      jobDescription: formData.get("jobDescription")?.toString(),
      resumeText: formData.get("resumeText")?.toString(),
    });

    let resumeText = fields.resumeText.trim();

    if (file instanceof File && file.size > 0) {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        return NextResponse.json({ error: "Resume Optimization Engine currently supports PDF resumes." }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      resumeText = await extractPdfText(buffer);
    }

    if (resumeText.length < 80) {
      return NextResponse.json({ error: "Upload a PDF resume or paste enough resume text to optimize." }, { status: 400 });
    }

    const result = await tailorResumeToJob({
      resumeText,
      jobDescription: fields.jobDescription,
    });

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Resume Match Engine failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
