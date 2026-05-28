import crypto from "crypto";

export type ExperienceLevel = "fresher" | "junior" | "mid" | "senior";

export type ParsedResumeProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  experience_years: number;
  experience_level: ExperienceLevel;
  skills: string[];
  education: Array<{
    degree: string;
    institution: string;
    graduation_year: string;
  }>;
  job_titles: string[];
  summary: string;
  industries: string[];
  country: string;
  country_code: string;
  created_at: string;
};

export type JobResult = {
  id: string;
  job_title: string;
  company: string;
  location: string;
  type: "remote" | "onsite" | "hybrid";
  salary: string;
  experience_required: string;
  apply_url: string;
  source_url: string;
  favicon: string;
  match_score: number;
  matched_skills: string[];
  snippet: string;
  posted_at: string;
  country: string;
};

export type UrlValidation = {
  url: string;
  valid: boolean;
  status_code?: number;
  final_url?: string;
  reason?: string;
};

type SearchCandidate = {
  url: string;
  title?: string;
  snippet?: string;
  postedAt?: string;
  country?: string;
  location?: string;
  isLiveGoogleJob?: boolean;
  trustedCareerPage?: boolean;
};

type SerpApiJobResult = {
  title?: string;
  company_name?: string;
  location?: string;
  description?: string;
  share_link?: string;
  extensions?: string[];
  detected_extensions?: {
    posted_at?: string;
  };
  apply_options?: Array<{
    title?: string;
    link?: string;
  }>;
};

const profiles = new Map<string, ParsedResumeProfile>();
const jobCache = new Map<string, { expiresAt: number; value: unknown }>();
const validationCache = new Map<string, { expiresAt: number; value: UrlValidation }>();
const uploadAttempts = new Map<string, { count: number; resetAt: number }>();

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const PROFILE_CACHE_MS = 6 * 60 * 60 * 1000;
const VALIDATION_CACHE_MS = 24 * 60 * 60 * 1000;
const UPLOAD_LIMIT_MS = 24 * 60 * 60 * 1000;
const FRESH_JOB_WINDOW_HOURS = 24;
const FRESH_JOB_WINDOW_MS = FRESH_JOB_WINDOW_HOURS * 60 * 60 * 1000;

const skillVocabulary = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "Java",
  "C++",
  "SQL",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "AWS",
  "Azure",
  "GCP",
  "Docker",
  "Kubernetes",
  "Git",
  "Machine Learning",
  "Data Analysis",
  "Power BI",
  "Tableau",
  "TensorFlow",
  "PyTorch",
  "FastAPI",
  "Django",
  "Spring Boot",
  "Tailwind",
  "Figma",
  "UI/UX",
  "REST API",
  "GraphQL",
  "Testing",
  "CI/CD",
];

const blockedHosts = [
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "youtube.com",
  "reddit.com",
  "medium.com",
  "glassdoor.",
  "linkedin.com",
  "naukri.com",
  "indeed.com",
  "monster.com",
  "foundit.in",
  "timesjobs.com",
  "shine.com",
  "ambitionbox.com",
  "wellfound.com",
  "angel.co",
  "cutshort.io",
  "instahyre.com",
  "hirist.com",
  "remotive.com",
  "remoteok.com",
  "arbeitnow.com",
  "jooble.org",
  "ziprecruiter.com",
  "simplyhired.com",
  "flexjobs.com",
  "upwork.com",
  "freelancer.com",
  "jobsora.",
  "placementindia.com",
  "jobrapido.",
  "talent.com",
  "adzuna.",
  "freshersworld.com",
  "internshala.com",
  "bebee.com",
  "whatjobs.com",
  "trabajo.org",
  "efinancialcareers.com",
  "onjob.io",
];

const officialAtsHosts = [
  "greenhouse.io",
  "lever.co",
  "ashbyhq.com",
  "workdayjobs.com",
  "myworkdayjobs.com",
  "smartrecruiters.com",
  "icims.com",
  "workable.com",
  "bamboohr.com",
  "successfactors.com",
  "oraclecloud.com",
  "recruitee.com",
  "jobvite.com",
  "applytojob.com",
  "careers-page.com",
  "zohorecruit.in",
  "zohorecruit.com",
];

const boardExclusionQuery =
  "-site:linkedin.com -site:naukri.com -site:indeed.com -site:glassdoor.com -site:monster.com -site:foundit.in -site:timesjobs.com -site:shine.com -site:ambitionbox.com -site:remoteok.com -site:remotive.com -site:arbeitnow.com -site:jooble.org -site:ziprecruiter.com";

const countrySignals = [
  { name: "India", code: "IN", terms: ["india", "bharat", "bengaluru", "bangalore", "hyderabad", "pune", "mumbai", "delhi", "noida", "gurgaon", "chennai", "kolkata"], phonePrefixes: ["+91"] },
  { name: "United States", code: "US", terms: ["united states", "usa", "u.s.", "new york", "san francisco", "california", "texas", "seattle", "boston"], phonePrefixes: ["+1"] },
  { name: "United Kingdom", code: "GB", terms: ["united kingdom", "uk", "london", "manchester", "england", "scotland"], phonePrefixes: ["+44"] },
  { name: "Canada", code: "CA", terms: ["canada", "toronto", "vancouver", "montreal", "ontario"], phonePrefixes: ["+1"] },
  { name: "Germany", code: "DE", terms: ["germany", "berlin", "munich", "hamburg", "frankfurt"], phonePrefixes: ["+49"] },
  { name: "Australia", code: "AU", terms: ["australia", "sydney", "melbourne", "brisbane"], phonePrefixes: ["+61"] },
  { name: "Singapore", code: "SG", terms: ["singapore"], phonePrefixes: ["+65"] },
  { name: "United Arab Emirates", code: "AE", terms: ["united arab emirates", "uae", "dubai", "abu dhabi"], phonePrefixes: ["+971"] },
];

const officialCareerFallbacks: Record<string, Array<{ company: string; url: string; location?: string; keywords?: string[] }>> = {
  IN: [
    { company: "Tata Consultancy Services", url: "https://www.tcs.com/careers", location: "India", keywords: ["software", "developer", "engineer", "data", "cloud"] },
    { company: "Infosys", url: "https://www.infosys.com/careers/", location: "India", keywords: ["software", "developer", "engineer", "data", "cloud"] },
    { company: "Wipro", url: "https://careers.wipro.com/careers-home/", location: "India", keywords: ["software", "developer", "engineer", "cloud"] },
    { company: "HCLTech", url: "https://www.hcltech.com/careers", location: "India", keywords: ["software", "developer", "engineer", "cloud"] },
    { company: "Tech Mahindra", url: "https://www.techmahindra.com/en-in/careers/", location: "India", keywords: ["software", "developer", "engineer"] },
    { company: "Zoho", url: "https://www.zoho.com/careers/", location: "India", keywords: ["software", "developer", "frontend", "backend"] },
    { company: "Freshworks", url: "https://www.freshworks.com/company/careers/", location: "India", keywords: ["software", "developer", "frontend", "backend"] },
    { company: "Razorpay", url: "https://razorpay.com/jobs/", location: "India", keywords: ["software", "developer", "frontend", "backend"] },
    { company: "PhonePe", url: "https://www.phonepe.com/careers/", location: "India", keywords: ["software", "developer", "frontend", "backend"] },
    { company: "Meesho", url: "https://www.meesho.io/jobs", location: "India", keywords: ["software", "developer", "frontend", "backend"] },
    { company: "Swiggy", url: "https://www.swiggy.com/careers", location: "India", keywords: ["software", "developer", "frontend", "backend"] },
    { company: "Flipkart", url: "https://www.flipkartcareers.com/#!/joblist", location: "India", keywords: ["software", "developer", "frontend", "backend"] },
  ],
  US: [
    { company: "Microsoft", url: "https://jobs.careers.microsoft.com/global/en/search", location: "United States", keywords: ["software", "developer", "engineer", "data", "cloud"] },
    { company: "Google", url: "https://www.google.com/about/careers/applications/jobs/results", location: "United States", keywords: ["software", "developer", "engineer", "data", "cloud"] },
    { company: "Amazon", url: "https://www.amazon.jobs/en/search", location: "United States", keywords: ["software", "developer", "engineer", "data", "cloud"] },
    { company: "Meta", url: "https://www.metacareers.com/jobs", location: "United States", keywords: ["software", "developer", "engineer", "frontend", "backend"] },
    { company: "Stripe", url: "https://stripe.com/jobs/search", location: "United States", keywords: ["software", "developer", "engineer", "frontend", "backend"] },
    { company: "Vercel", url: "https://vercel.com/careers", location: "Remote", keywords: ["frontend", "react", "next", "developer"] },
  ],
  GB: [
    { company: "Monzo", url: "https://monzo.com/careers/", location: "United Kingdom", keywords: ["software", "developer", "engineer", "data"] },
    { company: "Wise", url: "https://wise.jobs/", location: "United Kingdom", keywords: ["software", "developer", "engineer", "data"] },
    { company: "Revolut", url: "https://www.revolut.com/careers/", location: "United Kingdom", keywords: ["software", "developer", "engineer", "data"] },
  ],
  CA: [
    { company: "Shopify", url: "https://www.shopify.com/careers", location: "Canada", keywords: ["software", "developer", "engineer", "frontend", "backend"] },
    { company: "Atlassian", url: "https://www.atlassian.com/company/careers/all-jobs", location: "Remote", keywords: ["software", "developer", "engineer", "cloud"] },
  ],
};

const universalCareerFallbacks: Array<{ company: string; url: string; location?: string; keywords?: string[] }> = [
  { company: "GitLab", url: "https://about.gitlab.com/jobs/all-jobs/", location: "Remote", keywords: ["software", "developer", "engineer", "cloud", "devops"] },
  { company: "Canonical", url: "https://canonical.com/careers/all", location: "Remote", keywords: ["software", "developer", "engineer", "linux", "cloud"] },
  { company: "Automattic", url: "https://automattic.com/work-with-us/", location: "Remote", keywords: ["software", "developer", "frontend", "backend"] },
  { company: "Vercel", url: "https://vercel.com/careers", location: "Remote", keywords: ["frontend", "react", "next", "developer"] },
];

export function assertSupportedResumeFile(file: File) {
  const lowerName = file.name.toLowerCase();
  const isSupported =
    lowerName.endsWith(".pdf") ||
    lowerName.endsWith(".docx") ||
    lowerName.endsWith(".doc") ||
    [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ].includes(file.type);

  if (!isSupported) {
    throw new Error("Upload a PDF, DOCX, or DOC resume.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Resume must be 5MB or smaller.");
  }
}

export function assertUploadAllowed(identity: string) {
  const now = Date.now();
  const record = uploadAttempts.get(identity);
  if (!record || record.resetAt <= now) {
    uploadAttempts.set(identity, { count: 1, resetAt: now + UPLOAD_LIMIT_MS });
    return;
  }

  if (record.count >= 3) {
    throw new Error("Resume upload limit reached. Try again tomorrow.");
  }

  record.count += 1;
}

export async function extractResumeText(file: File) {
  assertSupportedResumeFile(file);
  const buffer = Buffer.from(await file.arrayBuffer());
  const lowerName = file.name.toLowerCase();
  assertResumeSignature(buffer, lowerName);

  if (lowerName.endsWith(".pdf") || file.type === "application/pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    await parser.destroy();
    return parsed.text.trim();
  }

  if (lowerName.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const parsed = await mammoth.extractRawText({ buffer });
    return parsed.value.trim();
  }

  const WordExtractor = (await import("word-extractor")).default;
  const extractor = new WordExtractor();
  const document = await extractor.extract(buffer);
  return [document.getBody(), document.getHeaders(), document.getFooters(), document.getFootnotes(), document.getEndnotes()]
    .filter(Boolean)
    .join("\n")
    .trim();
}

function assertResumeSignature(buffer: Buffer, lowerName: string) {
  const startsWith = (...bytes: number[]) => bytes.every((byte, index) => buffer[index] === byte);
  const isPdf = startsWith(0x25, 0x50, 0x44, 0x46);
  const isZipBased = startsWith(0x50, 0x4b);
  const isLegacyDoc = startsWith(0xd0, 0xcf, 0x11, 0xe0);

  if (lowerName.endsWith(".pdf") && isPdf) return;
  if (lowerName.endsWith(".docx") && isZipBased) return;
  if (lowerName.endsWith(".doc") && isLegacyDoc) return;

  throw new Error("Resume file signature does not match its extension.");
}

export async function parseResumeProfile(rawText: string): Promise<ParsedResumeProfile> {
  const aiProfile = await parseWithClaude(rawText);
  const profile = normalizeProfile(aiProfile ?? parseWithHeuristics(rawText));
  storeProfile(profile);
  return profile;
}

export function storeProfile(profile: ParsedResumeProfile) {
  profiles.set(profile.id, profile);
}

export function getProfile(profileId: string) {
  return profiles.get(profileId);
}

export function buildQueries(profile: ParsedResumeProfile) {
  const titles = profile.job_titles.length ? profile.job_titles.slice(0, 5) : inferTitles(profile.skills).slice(0, 4);
  const skills = profile.skills.slice(0, 4).join(" ");
  const levelTerms: Record<ExperienceLevel, string[]> = {
    fresher: ["fresher", "entry level", "graduate trainee"],
    junior: ["junior", "associate", "1 3 years"],
    mid: ["mid level", "experienced", "3 6 years"],
    senior: ["senior", "lead", "5 years"],
  };
  const queries = new Set<string>();

  for (const title of titles) {
    queries.add(`"${title}" ${profile.country} ${levelTerms[profile.experience_level][0]} careers apply official company website ${boardExclusionQuery}`);
    queries.add(`"${title}" ${profile.country} ${skills} inurl:careers apply job opening ${boardExclusionQuery}`);
    queries.add(`"${title}" ${profile.country} ${skills} inurl:jobs apply company careers ${boardExclusionQuery}`);
    queries.add(`"${title}" ${profile.country} site:greenhouse.io OR site:lever.co OR site:ashbyhq.com OR site:myworkdayjobs.com ${boardExclusionQuery}`);
    queries.add(`"${title}" ${profile.country} ${profile.industries.slice(0, 2).join(" ")} "apply now" "careers" ${boardExclusionQuery}`);
  }

  if (!queries.size) {
    queries.add(`${skills || "software"} ${profile.country} company careers apply ${boardExclusionQuery}`);
  }

  return Array.from(queries).filter(Boolean).slice(0, 12);
}

export async function searchJobsForProfile(profile: ParsedResumeProfile, filters?: { type?: string; location?: string; experience_level?: string }) {
  const started = Date.now();
  const cacheKey = JSON.stringify({ id: profile.id, filters });
  const cached = jobCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const queries = buildQueries(profile);
  const rawCandidates = await collectSearchCandidates(queries, profile);
  let usedFallbackCandidates = false;
  let filteredCandidates = dedupe(rawCandidates)
    .filter((candidate) => candidate.isLiveGoogleJob || shouldKeepJobUrl(candidate.url))
    .filter((candidate) => isFreshCandidate(candidate))
    .filter((candidate) => isCandidateForProfileCountry(candidate, profile));

  if (!filteredCandidates.length) {
    filteredCandidates = buildOfficialCareerFallbackCandidates(profile).filter((candidate) => shouldKeepJobUrl(candidate.url));
    usedFallbackCandidates = true;
  }

  let validCandidates = await validateCandidates(filteredCandidates);

  if (!validCandidates.length && !usedFallbackCandidates) {
    filteredCandidates = buildOfficialCareerFallbackCandidates(profile).filter((candidate) => shouldKeepJobUrl(candidate.url));
    validCandidates = await validateCandidates(filteredCandidates);
  }

  validCandidates = validCandidates.slice(0, 60);

  const enriched = await batchMap(validCandidates, 8, async ({ candidate, validation }) =>
    enrichJobResult(validation.final_url ?? candidate.url, candidate.snippet ?? "", profile, candidate),
  );

  let jobs = applyJobFilters(enriched, profile, filters).sort((a, b) => b.match_score - a.match_score).slice(0, 30);
  if (!jobs.length && enriched.length) {
    jobs = applyJobFilters(enriched, profile, { type: filters?.type, experience_level: filters?.experience_level })
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 30);
  }
  if (!jobs.length && enriched.length) {
    jobs = enriched.sort((a, b) => b.match_score - a.match_score).slice(0, 30);
  }
  const payload = {
    jobs,
    total_found: jobs.length,
    total_checked: filteredCandidates.length,
    total_valid: validCandidates.length,
    country: profile.country,
    country_code: profile.country_code,
    fresh_since: new Date(Date.now() - FRESH_JOB_WINDOW_MS).toISOString(),
    queries,
    search_time_seconds: Number(((Date.now() - started) / 1000).toFixed(2)),
  };

  jobCache.set(cacheKey, { expiresAt: Date.now() + PROFILE_CACHE_MS, value: payload });
  return payload;
}

async function validateCandidates(candidates: SearchCandidate[]) {
  const validations = await validateUrls(candidates.map((candidate) => candidate.url));
  const validByOriginal = new Map(validations.filter((item) => item.valid).map((item) => [item.url, item]));
  return candidates
    .map((candidate) => ({
      candidate,
      validation: validByOriginal.get(candidate.url) ?? (
        candidate.trustedCareerPage
          ? { url: candidate.url, valid: true, final_url: candidate.url, reason: "Trusted official careers fallback" }
          : undefined
      ),
    }))
    .filter((item): item is { candidate: SearchCandidate; validation: UrlValidation } => Boolean(item.validation));
}

export async function validateSingleUrl(url: string): Promise<UrlValidation> {
  return validateUrl(url);
}

async function parseWithClaude(rawText: string) {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1600,
      temperature: 0,
      system:
        'You are a resume parser. Extract structured JSON: {"name": "", "email": "", "phone": "", "experience_years": 0, "experience_level": "fresher|junior|mid|senior", "skills": [], "education": [], "job_titles": [], "summary": "", "industries": [], "country": "", "country_code": ""}. Infer country from phone code, address, education, and work locations. Return ONLY valid JSON, no markdown.',
      messages: [{ role: "user", content: rawText.slice(0, 24000) }],
    }),
  });

  if (!response.ok) return null;
  const payload = await response.json();
  const text = payload?.content?.[0]?.text;
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function parseWithHeuristics(rawText: string) {
  const text = rawText.replace(/\r/g, "\n").replace(/[ \t]+/g, " ").trim();
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
  const phone = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim() ?? "";
  const years = inferExperienceYears(text);
  const skills = skillVocabulary.filter((skill) => new RegExp(`\\b${escapeRegExp(skill).replace("\\.", "\\.?")}\\b`, "i").test(text));
  const country = inferCountry(text, phone);

  return {
    name: inferName(lines, email),
    email,
    phone,
    experience_years: years,
    experience_level: levelFromYears(years),
    skills,
    education: inferEducation(lines),
    job_titles: inferTitles(skills),
    summary: lines.slice(0, 5).join(" ").slice(0, 260),
    industries: inferIndustries(text, skills),
    country: country.name,
    country_code: country.code,
  };
}

function normalizeProfile(input: Partial<ParsedResumeProfile>): ParsedResumeProfile {
  const years = Number(input.experience_years ?? 0);
  const skills = uniqueStrings(input.skills).slice(0, 18);
  const country = normalizeCountry(input.country, input.country_code, input.phone);
  return {
    id: crypto.randomUUID(),
    name: stringValue(input.name, "Candidate"),
    email: stringValue(input.email),
    phone: stringValue(input.phone),
    experience_years: Number.isFinite(years) ? Math.max(0, years) : 0,
    experience_level: isExperienceLevel(input.experience_level) ? input.experience_level : levelFromYears(years),
    skills,
    education: normalizeEducation(input.education),
    job_titles: uniqueStrings(input.job_titles).slice(0, 5).length ? uniqueStrings(input.job_titles).slice(0, 5) : inferTitles(skills),
    summary: stringValue(input.summary, "Resume parsed successfully. CareerOS is ready to search relevant live job postings."),
    industries: uniqueStrings(input.industries).slice(0, 6),
    country: country.name,
    country_code: country.code,
    created_at: new Date().toISOString(),
  };
}

async function collectSearchCandidates(queries: string[], profile: ParsedResumeProfile) {
  const batches = await batchMap(queries, 3, async (query) => {
    try {
      if (process.env.SERPAPI_API_KEY) return searchSerpApi(query, profile);
      await sleep(1200);
      const googleResults = await searchGoogleHtml(query, profile);
      if (googleResults.length) return googleResults;
      return searchDuckDuckGoHtml(query, profile);
    } catch {
      return [];
    }
  });
  return batches.flat();
}

async function searchSerpApi(query: string, profile: ParsedResumeProfile): Promise<SearchCandidate[]> {
  const url = new URL("https://serpapi.com/search");
  url.searchParams.set("engine", "google_jobs");
  url.searchParams.set("q", cleanGoogleJobsQuery(query, profile));
  url.searchParams.set("hl", "en");
  url.searchParams.set("gl", profile.country_code.toLowerCase());
  url.searchParams.set("chips", "date_posted:today");
  url.searchParams.set("api_key", process.env.SERPAPI_API_KEY ?? "");

  const response = await fetch(url, { headers: { "user-agent": "CareerOS Job Search" } });
  if (!response.ok) return [];
  const payload = await response.json();
  return (payload.jobs_results ?? []).flatMap((result: SerpApiJobResult): SearchCandidate[] => {
    const postedAt = parsePostedAt(result.detected_extensions?.posted_at ?? result.extensions?.find((item) => /ago|today|yesterday/i.test(item)));
    if (!isFreshIso(postedAt)) return [];

    const source = [
      result.title,
      result.company_name,
      result.location,
      result.description,
      result.detected_extensions?.posted_at,
      ...(result.extensions ?? []),
    ]
      .filter(Boolean)
      .join(" | ");

    const applyOptions = result.apply_options?.length
      ? result.apply_options
      : result.share_link
        ? [{ title: result.company_name ?? result.title ?? "Official job", link: result.share_link }]
        : [];

    const officialOptions = applyOptions.filter((option) => option.link && shouldKeepJobUrl(option.link));
    const selectedOptions = officialOptions.length ? officialOptions : applyOptions.filter((option) => option.link).slice(0, 1);

    return selectedOptions.flatMap((option): SearchCandidate[] => {
      if (!option.link) return [];
      return [{
        url: option.link,
        title: result.title,
        snippet: source,
        postedAt,
        country: profile.country,
        location: result.location,
        isLiveGoogleJob: !officialOptions.length,
      }];
    });
  });
}

function cleanGoogleJobsQuery(query: string, profile: ParsedResumeProfile) {
  return query
    .replace(/-site:\S+/g, "")
    .replace(/official company website/gi, "")
    .replace(/\binurl:\S+/gi, "")
    .replace(/\bcareers?\b/gi, "")
    .replace(/\bapply\b/gi, "")
    .replace(/\s+/g, " ")
    .trim() || `${profile.job_titles[0] ?? "Software Engineer"} ${profile.country}`;
}

async function searchGoogleHtml(query: string, profile: ParsedResumeProfile): Promise<SearchCandidate[]> {
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=20&tbs=qdr:d4`;
  const response = await fetch(url, {
    headers: {
      "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
    },
  });
  const html = await response.text();
  if (!response.ok || /detected unusual traffic|enable javascript|captcha-form/i.test(html)) {
    return [];
  }
  const matches = Array.from(html.matchAll(/href="\/url\?q=([^"&]+)[^"]*"/g));
  return matches.map((match) => ({ url: decodeURIComponent(match[1]), postedAt: new Date().toISOString(), country: profile.country })).slice(0, 20);
}

async function searchDuckDuckGoHtml(query: string, profile: ParsedResumeProfile): Promise<SearchCandidate[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
    },
  });
  if (!response.ok) return [];

  const html = await response.text();
  const matches = Array.from(html.matchAll(/class="result__a" href="([^"]+)"[\s\S]*?>([\s\S]*?)<\/a>/g));
  return matches
    .flatMap((match): SearchCandidate[] => {
      const resultUrl = normalizeSearchResultUrl(decodeHtml(match[1]));
      if (!resultUrl) return [];
      return [{
        url: resultUrl,
        title: decodeHtml(match[2]),
        postedAt: new Date().toISOString(),
        country: profile.country,
      }];
    })
    .slice(0, 20);
}

function normalizeSearchResultUrl(value: string) {
  const withProtocol = value.startsWith("//") ? `https:${value}` : value;
  try {
    const parsed = new URL(withProtocol);
    const duckDuckGoTarget = parsed.searchParams.get("uddg");
    return duckDuckGoTarget ? decodeURIComponent(duckDuckGoTarget) : withProtocol;
  } catch {
    return "";
  }
}

function buildOfficialCareerFallbackCandidates(profile: ParsedResumeProfile): SearchCandidate[] {
  const fallbackRows = [...(officialCareerFallbacks[profile.country_code] ?? []), ...universalCareerFallbacks];
  const profileTerms = `${profile.job_titles.join(" ")} ${profile.skills.join(" ")}`.toLowerCase();
  const ranked = fallbackRows
    .map((row) => {
      const score = row.keywords?.some((keyword) => profileTerms.includes(keyword)) ? 1 : 0;
      return { row, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  return ranked.map(({ row }) => ({
    url: row.url,
    title: `${row.company} official careers`,
    snippet: `${row.company} official company careers page for ${profile.country}. Search recent ${profile.job_titles[0] ?? "job"} openings and apply on the company website.`,
    postedAt: new Date().toISOString(),
    country: profile.country,
    location: row.location ?? profile.country,
    trustedCareerPage: true,
  }));
}

async function validateUrls(urls: string[]) {
  return batchMap(urls, 20, validateUrl);
}

async function validateUrl(url: string): Promise<UrlValidation> {
  const cached = validationCache.get(url);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const result = await runValidationRequest(url);
  validationCache.set(url, { expiresAt: Date.now() + VALIDATION_CACHE_MS, value: result });
  return result;
}

async function runValidationRequest(url: string): Promise<UrlValidation> {
  try {
    const head = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(6000),
      headers: { "user-agent": "CareerOS Link Validator" },
    });
    if (head.status === 405 || head.status === 403) {
      return validateWithGet(url);
    }
    return responseToValidation(url, head);
  } catch {
    return validateWithGet(url);
  }
}

async function validateWithGet(url: string): Promise<UrlValidation> {
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: { "user-agent": "CareerOS Link Validator" },
    });
    return responseToValidation(url, response);
  } catch (error) {
    return { url, valid: false, reason: error instanceof Error ? error.message : "Request failed" };
  }
}

function responseToValidation(originalUrl: string, response: Response): UrlValidation {
  const finalUrl = response.url || originalUrl;
  if (response.status >= 400) {
    return { url: originalUrl, valid: false, status_code: response.status, final_url: finalUrl, reason: `HTTP ${response.status}` };
  }
  if (isHomepage(finalUrl, originalUrl)) {
    return { url: originalUrl, valid: false, status_code: response.status, final_url: finalUrl, reason: "Redirects to homepage" };
  }
  return { url: originalUrl, valid: true, status_code: response.status, final_url: finalUrl };
}

function isHomepage(finalUrl: string, originalUrl: string) {
  try {
    const original = new URL(originalUrl);
    const final = new URL(finalUrl);
    return original.hostname === final.hostname && ["", "/"].includes(final.pathname);
  } catch {
    return false;
  }
}

async function enrichJobResult(url: string, snippet: string, profile: ParsedResumeProfile, candidate: SearchCandidate): Promise<JobResult> {
  const page = await fetchPageSnippet(url);
  const source = `${snippet} ${page.title} ${page.description}`.trim();
  const ai = await enrichWithClaude(url, source);
  const heuristic = enrichWithHeuristics(url, source, profile);
  const result = { ...heuristic, ...ai };
  const matchedSkills = profile.skills.filter((skill) => source.toLowerCase().includes(skill.toLowerCase()));
  const postedAt = candidate.postedAt ?? new Date().toISOString();
  const inferredCountry = inferCountryFromLocation(`${candidate.location ?? ""} ${result.location ?? ""} ${source}`);
  const country = candidate.country
    ? normalizeCountry(candidate.country, undefined, undefined, `${candidate.location ?? ""} ${result.location ?? ""} ${source}`).name
    : inferredCountry?.name ?? "Not specified";

  return {
    ...result,
    id: crypto.createHash("sha1").update(url).digest("hex"),
    apply_url: result.apply_url || url,
    source_url: url,
    favicon: faviconFor(url),
    match_score: calculateMatchScore(profile, source, matchedSkills),
    matched_skills: matchedSkills.slice(0, 6),
    snippet: source.slice(0, 220),
    posted_at: postedAt,
    country,
  };
}

async function fetchPageSnippet(url: string) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(7000),
      headers: { "user-agent": "CareerOS Job Enricher" },
    });
    const html = await response.text();
    return {
      title: decodeHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ""),
      description: decodeHtml(
        html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
          html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)?.[1] ??
          "",
      ),
    };
  } catch {
    return { title: "", description: "" };
  }
}

async function enrichWithClaude(url: string, snippet: string) {
  if (!process.env.ANTHROPIC_API_KEY || snippet.length < 20) return {};
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 700,
      temperature: 0,
      system:
        'Given this URL and page snippet, extract: { "job_title": "", "company": "", "location": "", "type": "remote|onsite|hybrid", "salary": "", "experience_required": "", "apply_url": "" }. Return ONLY JSON.',
      messages: [{ role: "user", content: `URL: ${url}\nSnippet: ${snippet.slice(0, 5000)}` }],
    }),
  });
  if (!response.ok) return {};
  const payload = await response.json();
  try {
    return JSON.parse(payload?.content?.[0]?.text ?? "{}");
  } catch {
    return {};
  }
}

function enrichWithHeuristics(url: string, source: string, profile: ParsedResumeProfile) {
  const parsed = new URL(url);
  const cleanHost = parsed.hostname.replace(/^www\./, "");
  const sourceParts = source.split("|").map((part) => part.trim()).filter(Boolean);
  const title = sourceParts[0] ?? source.split(/[|\-–]/)[0]?.trim();
  const type = /remote/i.test(source) ? "remote" : /hybrid/i.test(source) ? "hybrid" : "onsite";
  const location =
    sourceParts.slice(2).find((part) => /^(remote|hybrid|onsite|[A-Za-z .,-]+)$/i.test(part) && !part.includes("Development")) ??
    source.match(/\b(Remote|Bengaluru|Bangalore|Hyderabad|Pune|Mumbai|Delhi|Noida|Gurgaon|Chennai|Kolkata|Berlin|Munich|Hamburg|India|Germany|United States|USA)\b/i)?.[0] ??
    "Not specified";
  const company = sourceParts[1] && sourceParts[1].length < 80 ? sourceParts[1] : companyFromHost(cleanHost);

  return {
    job_title: title && title.length < 80 ? title : profile.job_titles[0] ?? "Relevant job opening",
    company,
    location,
    type: type as JobResult["type"],
    salary: source.match(/(?:₹|\$|INR|USD)\s?[0-9][0-9,.kK -]+/)?.[0] ?? "Not listed",
    experience_required: source.match(/\b\d+\+?\s*(?:-|to)?\s*\d*\s*years?\b/i)?.[0] ?? labelFromLevel(profile.experience_level),
    apply_url: url,
  };
}

function shouldKeepJobUrl(url: string) {
  try {
    const parsed = new URL(url);
    const combined = `${parsed.hostname}${parsed.pathname}`.toLowerCase();
    if (blockedHosts.some((host) => combined.includes(host.toLowerCase()))) return false;
    if (/\.(pdf|jpg|jpeg|png|gif|zip)$/i.test(parsed.pathname)) return false;
    if (["/", ""].includes(parsed.pathname) && !/careers?|jobs?|work-with-us|join-us/i.test(combined)) return false;
    return isOfficialCompanyJobUrl(parsed);
  } catch {
    return false;
  }
}

function isOfficialCompanyJobUrl(url: URL) {
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const path = url.pathname.toLowerCase();
  const combined = `${host}${path}`;
  const isKnownOfficialAts = officialAtsHosts.some((atsHost) => host === atsHost || host.endsWith(`.${atsHost}`));
  const hasCareerPath = /(careers?|jobs?|job-openings?|open-positions?|positions?|join-us|work-with-us|vacancies|opportunities|apply)(\/|$|-)/i.test(combined);
  const hasHashJobList = /\/#!\/joblist/i.test(`${path}${url.hash.toLowerCase()}`);
  const hasApplyRoute = /\/(apply|job-detail|jobdetails|job-description|opening)(\/|$|-)/i.test(path);

  return isKnownOfficialAts || hasCareerPath || hasHashJobList || hasApplyRoute;
}

function isFreshCandidate(candidate: SearchCandidate) {
  return Boolean(candidate.postedAt && isFreshIso(candidate.postedAt));
}

function parsePostedAt(value?: string) {
  if (!value) return new Date().toISOString();
  const normalized = value.toLowerCase().trim();
  if (normalized.includes("today") || normalized.includes("just now")) return new Date().toISOString();
  if (normalized.includes("yesterday")) return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const relative = normalized.match(/(\d+)\s*(minute|hour|day|week|month)s?\s*ago/);
  if (relative) {
    const amount = Number(relative[1]);
    const unit = relative[2];
    const unitMs =
      unit === "minute" ? 60 * 1000 :
      unit === "hour" ? 60 * 60 * 1000 :
      unit === "day" ? 24 * 60 * 60 * 1000 :
      unit === "week" ? 7 * 24 * 60 * 60 * 1000 :
      30 * 24 * 60 * 60 * 1000;
    return new Date(Date.now() - amount * unitMs).toISOString();
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : new Date().toISOString();
}

function isFreshIso(value: string) {
  const posted = Date.parse(value);
  return Number.isFinite(posted) && posted >= Date.now() - FRESH_JOB_WINDOW_MS && posted <= Date.now() + 60 * 60 * 1000;
}

function isCandidateForProfileCountry(candidate: SearchCandidate, profile: ParsedResumeProfile) {
  return countryMatches(profile.country, `${candidate.country ?? ""} ${candidate.location ?? ""} ${candidate.snippet ?? ""}`);
}

function countryMatches(country: string, source: string) {
  const normalizedCountry = country.toLowerCase();
  const normalizedSource = source.toLowerCase();
  const signal = countrySignals.find((item) => item.name.toLowerCase() === normalizedCountry);
  if (!signal) return true;

  if (hasCountryTerm(normalizedSource, signal)) return true;

  return /\b(worldwide|anywhere)\b/i.test(source);
}

function hasCountryTerm(source: string, country: (typeof countrySignals)[number]) {
  return country.terms.some((term) => new RegExp(`(^|[^a-z])${escapeRegExp(term.toLowerCase())}([^a-z]|$)`, "i").test(source));
}

function applyJobFilters(jobs: JobResult[], profile: ParsedResumeProfile, filters?: { type?: string; location?: string; experience_level?: string }) {
  return jobs.filter((job) => {
    if (!isFreshIso(job.posted_at)) return false;
    if (!countryMatches(profile.country, `${job.country} ${job.location} ${job.snippet}`)) return false;
    if (filters?.type && filters.type !== "all" && job.type !== filters.type) return false;
    if (filters?.location && !job.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
    if (filters?.experience_level && filters.experience_level !== "all") {
      return experienceMatchesFilter(job.experience_required, filters.experience_level);
    }
    return true;
  });
}

function experienceMatchesFilter(experienceRequired: string, selectedLevel: string) {
  if (!isExperienceLevel(selectedLevel)) return true;

  const source = experienceRequired.toLowerCase();
  const labelPatterns: Record<ExperienceLevel, RegExp> = {
    fresher: /\b(fresher|freshers|entry[- ]?level|graduate|new grad|trainee|internship|intern)\b/i,
    junior: /\b(junior|associate|early[- ]?career)\b/i,
    mid: /\b(mid[- ]?level|intermediate|experienced)\b/i,
    senior: /\b(senior|lead|staff|principal|architect)\b/i,
  };

  if (labelPatterns[selectedLevel].test(source)) return true;

  const range = parseExperienceRange(source);
  if (!range) return false;

  const levelRanges: Record<ExperienceLevel, { min: number; max: number }> = {
    fresher: { min: 0, max: 1 },
    junior: { min: 1, max: 3 },
    mid: { min: 3, max: 7 },
    senior: { min: 7, max: Number.POSITIVE_INFINITY },
  };
  const selectedRange = levelRanges[selectedLevel];
  return range.min <= selectedRange.max && range.max >= selectedRange.min;
}

function parseExperienceRange(source: string) {
  if (/\b(no experience|zero experience|0 experience)\b/i.test(source)) {
    return { min: 0, max: 0 };
  }

  const rangeMatch = source.match(/(\d+(?:\.\d+)?)\s*(?:\+|(?:-|to)\s*(\d+(?:\.\d+)?))?\s*(?:years?|yrs?)/i);
  if (!rangeMatch) return null;

  const min = Number(rangeMatch[1]);
  if (!Number.isFinite(min)) return null;

  if (rangeMatch[0].includes("+")) {
    return { min, max: Number.POSITIVE_INFINITY };
  }

  const explicitMax = rangeMatch[2] ? Number(rangeMatch[2]) : min;
  const max = Number.isFinite(explicitMax) ? explicitMax : min;
  return { min: Math.min(min, max), max: Math.max(min, max) };
}

function calculateMatchScore(profile: ParsedResumeProfile, source: string, matchedSkills: string[]) {
  const skillScore = profile.skills.length ? (matchedSkills.length / Math.min(profile.skills.length, 8)) * 55 : 20;
  const titleScore = profile.job_titles.some((title) => source.toLowerCase().includes(title.toLowerCase())) ? 25 : 10;
  const levelScore = source.toLowerCase().includes(profile.experience_level) ? 15 : 8;
  return Math.min(98, Math.round(20 + skillScore + titleScore + levelScore));
}

function inferExperienceYears(text: string) {
  const matches = Array.from(text.matchAll(/(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)/gi)).map((match) => Number(match[1]));
  return matches.length ? Math.max(...matches) : 0;
}

function levelFromYears(years: number): ExperienceLevel {
  if (years <= 1) return "fresher";
  if (years <= 3) return "junior";
  if (years <= 7) return "mid";
  return "senior";
}

function inferName(lines: string[], email: string) {
  const first = lines.find((line) => /^[A-Za-z][A-Za-z .'-]{2,60}$/.test(line) && !line.includes("@"));
  return first ?? email.split("@")[0]?.replace(/[._-]/g, " ") ?? "Candidate";
}

function inferEducation(lines: string[]) {
  const education = lines
    .filter((line) => /(bachelor|master|b\.tech|m\.tech|bsc|msc|university|college|institute|degree)/i.test(line))
    .slice(0, 3)
    .map((line) => ({
      degree: line.match(/(bachelor|master|b\.tech|m\.tech|bsc|msc|mba|degree)[^,|]*/i)?.[0] ?? "Degree",
      institution: line,
      graduation_year: line.match(/\b(20\d{2}|19\d{2})\b/)?.[0] ?? "",
    }));
  return education.length ? education : [{ degree: "Not found", institution: "Not found", graduation_year: "" }];
}

function inferTitles(skills: string[]) {
  const lower = skills.join(" ").toLowerCase();
  if (/machine learning|tensorflow|pytorch|data/.test(lower)) return ["Data Scientist", "Machine Learning Engineer", "Data Analyst"];
  if (/react|next|tailwind|figma|ui/.test(lower)) return ["Frontend Developer", "React Developer", "UI Engineer"];
  if (/node|fastapi|django|spring|sql/.test(lower)) return ["Backend Developer", "Software Engineer", "API Developer"];
  return ["Software Engineer", "Associate Software Developer", "Graduate Engineer Trainee"];
}

function inferIndustries(text: string, skills: string[]) {
  const source = `${text} ${skills.join(" ")}`.toLowerCase();
  const industries = [
    ["AI/ML", /machine learning|ai|tensorflow|pytorch/],
    ["SaaS", /react|node|api|cloud/],
    ["Data", /sql|tableau|power bi|analytics/],
    ["Cloud", /aws|azure|gcp|docker|kubernetes/],
    ["FinTech", /finance|bank|payment/],
  ] as const;
  return industries.filter(([, pattern]) => pattern.test(source)).map(([industry]) => industry);
}

function inferCountry(text: string, phone = "") {
  const normalizedText = text.toLowerCase();
  const normalizedPhone = phone.replace(/\s/g, "");
  const byPhone = countrySignals.find((country) => country.phonePrefixes.some((prefix) => normalizedPhone.startsWith(prefix)));
  if (byPhone) return byPhone;

  return inferCountryFromLocation(normalizedText) ?? countrySignals[0];
}

function inferCountryFromLocation(source: string) {
  const normalized = source.toLowerCase();
  return countrySignals.find((country) => hasCountryTerm(normalized, country));
}

function normalizeCountry(country?: unknown, countryCode?: unknown, phone?: unknown, source = "") {
  const countryText = stringValue(country);
  const codeText = stringValue(countryCode).toUpperCase();
  const phoneText = stringValue(phone);
  const byCode = countrySignals.find((item) => item.code === codeText);
  if (byCode) return byCode;

  const byName = countrySignals.find((item) => item.name.toLowerCase() === countryText.toLowerCase());
  if (byName) return byName;

  const byAlias = countrySignals.find((item) => item.terms.includes(countryText.toLowerCase()));
  if (byAlias) return byAlias;

  return inferCountry(`${countryText} ${source}`, phoneText);
}

function normalizeEducation(value: unknown) {
  if (!Array.isArray(value)) return [{ degree: "Not found", institution: "Not found", graduation_year: "" }];
  return value.slice(0, 4).map((item) => {
    if (typeof item === "string") return { degree: item, institution: item, graduation_year: item.match(/\b(20\d{2}|19\d{2})\b/)?.[0] ?? "" };
    const record = item as Record<string, unknown>;
    return {
      degree: stringValue(record.degree, "Degree"),
      institution: stringValue(record.institution, "Institution"),
      graduation_year: stringValue(record.graduation_year ?? record.year),
    };
  });
}

function isExperienceLevel(value: unknown): value is ExperienceLevel {
  return value === "fresher" || value === "junior" || value === "mid" || value === "senior";
}

function uniqueStrings(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((item) => String(item).trim()).filter(Boolean)));
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function dedupe(candidates: SearchCandidate[]) {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    if (!candidate.url || seen.has(candidate.url)) return false;
    seen.add(candidate.url);
    return true;
  });
}

async function batchMap<T, R>(items: T[], batchSize: number, mapper: (item: T) => Promise<R>) {
  const results: R[] = [];
  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize);
    results.push(...(await Promise.all(batch.map(mapper))));
  }
  return results;
}

function faviconFor(url: string) {
  const hostname = new URL(url).hostname;
  return `https://www.google.com/s2/favicons?sz=64&domain=${hostname}`;
}

function companyFromHost(host: string) {
  const parts = host.split(".");
  const raw = parts.length > 2 && ["greenhouse", "lever", "myworkdayjobs"].some((name) => host.includes(name)) ? parts[0] : parts.at(-2) ?? parts[0];
  return raw.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function labelFromLevel(level: ExperienceLevel) {
  return {
    fresher: "0-1 years",
    junior: "1-3 years",
    mid: "3-7 years",
    senior: "7+ years",
  }[level];
}

function decodeHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
