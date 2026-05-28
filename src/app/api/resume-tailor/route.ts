import { NextResponse } from "next/server";
import { z } from "zod";
import { tailorResumeToJob } from "@/lib/intelligence/resume-tailor";
import type { ResumeFormatTemplate } from "@/lib/intelligence/resume-tailor";

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
    let formatTemplate: ResumeFormatTemplate | undefined;

    if (file instanceof File && file.size > 0) {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        return NextResponse.json({ error: "Resume Optimization Engine currently supports PDF resumes." }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      const parsed = await parser.getText();
      await parser.destroy();
      resumeText = parsed.text;
      formatTemplate = await extractPdfFormatTemplate(buffer);
    }

    if (resumeText.length < 80) {
      return NextResponse.json({ error: "Upload a PDF resume or paste enough resume text to optimize." }, { status: 400 });
    }

    const result = await tailorResumeToJob({
      resumeText,
      jobDescription: fields.jobDescription,
    });

    return NextResponse.json({ result: { ...result, formatTemplate } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Resume Match Engine failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

async function extractPdfFormatTemplate(buffer: Buffer): Promise<ResumeFormatTemplate | undefined> {
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
    const pdf = await loadingTask.promise;
    const pages: ResumeFormatTemplate["pages"] = [];

    for (let pageNumber = 1; pageNumber <= Math.min(pdf.numPages, 3); pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      const textContent = await page.getTextContent();
      const textItems = textContent.items
        .filter((item): item is typeof item & { str: string; transform: number[]; width: number; fontName?: string } => "str" in item && Boolean(item.str?.trim()))
        .map((item) => {
          const fontSize = Math.max(7, Math.round(Math.hypot(item.transform[0], item.transform[1]) * 10) / 10);
          return {
            text: item.str.trim(),
            x: Math.round(item.transform[4] * 10) / 10,
            y: Math.round((viewport.height - item.transform[5]) * 10) / 10,
            width: Math.round((item.width || item.str.length * fontSize * 0.5) * 10) / 10,
            fontSize,
            isBold: /bold|black|heavy/i.test(item.fontName ?? ""),
          };
        });

      const grouped = groupPdfTextLines(textItems);
      pages.push({
        width: Math.round(viewport.width * 10) / 10,
        height: Math.round(viewport.height * 10) / 10,
        lines: grouped,
      });
    }

    await pdf.destroy();
    return { source: "pdf", pages };
  } catch {
    return undefined;
  }
}

function groupPdfTextLines(
  items: Array<{ text: string; x: number; y: number; width: number; fontSize: number; isBold: boolean }>,
): ResumeFormatTemplate["pages"][number]["lines"] {
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const rows: Array<typeof items> = [];

  for (const item of sorted) {
    const row = rows.find((candidate) => Math.abs(candidate[0].y - item.y) <= Math.max(2.5, item.fontSize * 0.35));
    if (row) {
      row.push(item);
    } else {
      rows.push([item]);
    }
  }

  return rows
    .map((row) => {
      const ordered = row.sort((a, b) => a.x - b.x);
      const first = ordered[0];
      const last = ordered[ordered.length - 1];
      return {
        text: ordered.map((item) => item.text).join(" ").replace(/\s+/g, " ").trim(),
        x: first.x,
        y: Math.max(0, first.y - first.fontSize),
        width: Math.max(last.x + last.width - first.x, first.width),
        fontSize: Math.max(...ordered.map((item) => item.fontSize)),
        isBold: ordered.some((item) => item.isBold),
      };
    })
    .filter((line) => line.text.length > 0);
}
