import { NextResponse } from "next/server";
import { z } from "zod";
import { getProfile, searchJobsForProfile, storeProfile, type ParsedResumeProfile } from "@/lib/intelligence/smart-job-search";

export const runtime = "nodejs";

const requestSchema = z.object({
  profile_id: z.string().optional(),
  profile: z.custom<ParsedResumeProfile>().optional(),
  filters: z
    .object({
      type: z.string().optional(),
      location: z.string().optional(),
      experience_level: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const profile = (body.profile_id ? getProfile(body.profile_id) : undefined) ?? body.profile;

    if (!profile) {
      return NextResponse.json({ error: "Resume profile not found. Analyze a resume first." }, { status: 404 });
    }

    storeProfile(profile);

    const result = await searchJobsForProfile(profile, body.filters);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Job search failed.";
    console.error("Job search failed", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
