import { NextResponse } from "next/server";
import { z } from "zod";
import { generateAiPortfolio } from "@/lib/intelligence/portfolio-generator";

export const runtime = "nodejs";

const schema = z.object({
  fullName: z.string().optional().default(""),
  email: z.string().optional().default(""),
  linkedInUrl: z.string().min(1, "Enter a LinkedIn URL."),
  githubUrl: z.string().min(1, "Enter a GitHub URL."),
  targetRole: z.string().optional().default(""),
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fields = schema.parse({
      fullName: formData.get("fullName")?.toString(),
      email: formData.get("email")?.toString(),
      linkedInUrl: formData.get("linkedInUrl")?.toString(),
      githubUrl: formData.get("githubUrl")?.toString(),
      targetRole: formData.get("targetRole")?.toString(),
    });
    const resume = formData.get("resume");
    let resumeText = formData.get("resumeText")?.toString() ?? "";

    if (resume instanceof File && resume.size > 0) {
      if (resume.type !== "application/pdf" && !resume.name.toLowerCase().endsWith(".pdf")) {
        return NextResponse.json({ error: "AI Portfolio Generator supports PDF resumes." }, { status: 400 });
      }
      const buffer = Buffer.from(await resume.arrayBuffer());
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      const parsed = await parser.getText();
      await parser.destroy();
      resumeText = parsed.text;
    }

    if (resumeText.trim().length < 80) {
      return NextResponse.json({ error: "Upload a resume PDF or paste enough resume text to generate a realistic portfolio." }, { status: 400 });
    }

    const result = await generateAiPortfolio({ ...fields, resumeText });
    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI Portfolio Generator failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
