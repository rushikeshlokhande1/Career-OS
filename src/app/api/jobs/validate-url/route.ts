import { NextResponse } from "next/server";
import { validateSingleUrl } from "@/lib/intelligence/smart-job-search";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url).searchParams.get("url");
    if (!url) {
      return NextResponse.json({ error: "Missing url parameter." }, { status: 400 });
    }

    const result = await validateSingleUrl(url);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "URL validation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
