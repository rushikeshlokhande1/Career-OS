import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeGitHubUsername } from "@/lib/intelligence/github";

export const runtime = "nodejs";

const requestSchema = z.object({
  username: z.string().min(1, "Enter a GitHub username."),
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const github = await analyzeGitHubUsername(body.username);

    if (!github) {
      return NextResponse.json({ error: "Could not find or analyze this GitHub profile." }, { status: 404 });
    }

    return NextResponse.json({ github });
  } catch (error) {
    const message = error instanceof Error ? error.message : "GitHub intelligence failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
