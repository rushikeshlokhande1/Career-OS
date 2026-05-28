import { NextResponse } from "next/server";
import { assertUploadAllowed, extractResumeText, parseResumeProfile } from "@/lib/intelligence/smart-job-search";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("resume");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Attach a PDF, DOCX, or DOC resume." }, { status: 400 });
    }

    const identity =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "local";
    assertUploadAllowed(identity);

    const rawText = await extractResumeText(file);
    if (!rawText || rawText.length < 80) {
      return NextResponse.json({ error: "Could not extract enough text from this resume." }, { status: 422 });
    }

    const profile = await parseResumeProfile(rawText);
    return NextResponse.json({ profile, profile_id: profile.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Resume analysis failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
