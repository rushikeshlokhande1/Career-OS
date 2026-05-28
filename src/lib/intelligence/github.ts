import type { GitHubIntelligence, GitHubRepositorySignal } from "@/lib/intelligence/types";
import { clamp } from "@/lib/intelligence/scoring";

type GitHubUser = {
  login: string;
  html_url: string;
  public_repos: number;
  followers: number;
};

type GitHubRepo = {
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  size: number;
  topics?: string[];
};

type GitHubContentItem = {
  name: string;
  type: "file" | "dir" | string;
};

export async function analyzeGitHubUsername(username: string): Promise<GitHubIntelligence | undefined> {
  const cleanUsername = username.trim().replace(/^@/, "");
  if (!cleanUsername) return undefined;

  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "CareerOS-AI",
  };

  const [userResponse, repoResponse] = await Promise.all([
    fetch(`https://api.github.com/users/${cleanUsername}`, { headers, next: { revalidate: 3600 } }),
    fetch(`https://api.github.com/users/${cleanUsername}/repos?sort=updated&per_page=12`, {
      headers,
      next: { revalidate: 3600 },
    }),
  ]);

  if (!userResponse.ok || !repoResponse.ok) {
    return undefined;
  }

  const user = (await userResponse.json()) as GitHubUser;
  const repos = (await repoResponse.json()) as GitHubRepo[];
  const repositorySignals = await Promise.all(
    repos.slice(0, 8).map((repo) => buildRepoSignal(cleanUsername, repo, headers)),
  );

  const activeRepos = repositorySignals.filter((repo) => daysSince(repo.updatedAt) < 120).length;
  const readmeQuality = clamp((repositorySignals.filter((repo) => repo.hasReadme).length / Math.max(repositorySignals.length, 1)) * 100);
  const languages = Array.from(new Set(repositorySignals.map((repo) => repo.language).filter(Boolean))) as string[];
  const complexityScore = clamp(
    repositorySignals.reduce((total, repo) => total + repo.complexitySignals.length * 9, 0) / Math.max(repositorySignals.length, 1) + 25,
  );
  const repoQuality = clamp(
    repositorySignals.reduce((total, repo) => total + repo.stars * 2 + repo.forks * 3 + (repo.description ? 8 : 0), 0) /
      Math.max(repositorySignals.length, 1) +
      complexityScore * 0.55,
  );
  const consistency = clamp((activeRepos / Math.max(repositorySignals.length, 1)) * 100);
  const portfolioStrength = clamp(repoQuality * 0.35 + consistency * 0.25 + readmeQuality * 0.2 + languages.length * 7 + complexityScore * 0.2);

  return {
    username: cleanUsername,
    profileUrl: user.html_url,
    publicRepos: user.public_repos,
    followers: user.followers,
    commitConsistency: consistency,
    readmeQuality,
    repositoryQuality: repoQuality,
    techStackDiversity: languages,
    realWorldComplexity: complexityScore,
    portfolioStrength,
    repositories: repositorySignals,
    insights: buildGitHubInsights(portfolioStrength, readmeQuality, languages, complexityScore),
  };
}

async function buildRepoSignal(username: string, repo: GitHubRepo, headers: HeadersInit): Promise<GitHubRepositorySignal> {
  const [readmeResponse, contentsResponse] = await Promise.all([
    fetch(`https://api.github.com/repos/${username}/${repo.name}/readme`, {
      headers,
      next: { revalidate: 3600 },
    }),
    fetch(`https://api.github.com/repos/${username}/${repo.name}/contents`, {
      headers,
      next: { revalidate: 3600 },
    }),
  ]);

  const rootItems = contentsResponse.ok ? ((await contentsResponse.json()) as GitHubContentItem[]) : [];
  const rootNames = rootItems.map((item) => item.name.toLowerCase());
  const readmeText = readmeResponse.ok ? await readReadmeText(readmeResponse) : "";
  const hasDeploySignal = Boolean(
    repo.homepage ||
      rootNames.some((name) => ["vercel.json", "netlify.toml", "dockerfile", "render.yaml", "fly.toml"].includes(name)) ||
      /\b(live demo|deployed|deployment|vercel\.app|netlify\.app|render\.com|railway\.app)\b/i.test(readmeText),
  );
  const hasTestSignal = Boolean(
    rootNames.some((name) => ["__tests__", "tests", "test", "spec", "jest.config.js", "vitest.config.ts", "playwright.config.ts", "cypress"].includes(name)) ||
      /\b(test|tests|testing|unit test|integration test|e2e|playwright|cypress|jest|vitest)\b/i.test(readmeText),
  );

  const complexitySignals = [
    repo.size > 750 ? "substantial codebase" : "",
    repo.topics?.length ? "topic metadata" : "",
    /api|server|fullstack|dashboard|saas|auth|ml|ai|analytics/i.test(`${repo.name} ${repo.description ?? ""}`)
      ? "real-world product scope"
      : "",
    daysSince(repo.updated_at) < 45 ? "recently maintained" : "",
    hasDeploySignal ? "deployment signal" : "",
    hasTestSignal ? "test signal" : "",
  ].filter(Boolean);

  return {
    name: repo.name,
    description: repo.description,
    url: repo.html_url,
    homepage: repo.homepage,
    language: repo.language,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    updatedAt: repo.updated_at,
    hasReadme: readmeResponse.ok,
    hasDeploySignal,
    hasTestSignal,
    complexitySignals,
  };
}

async function readReadmeText(response: Response) {
  try {
    const payload = await response.json() as { content?: string; encoding?: string };
    if (payload.encoding !== "base64" || !payload.content) return "";
    return Buffer.from(payload.content, "base64").toString("utf8").slice(0, 8000);
  } catch {
    return "";
  }
}

function buildGitHubInsights(score: number, readme: number, languages: string[], complexity: number) {
  const insights = [
    score >= 70
      ? "GitHub gives the profile credible proof beyond the resume."
      : "GitHub needs sharper product proof before it becomes a hiring advantage.",
    readme >= 70
      ? "README coverage is a positive recruiter signal."
      : "Several repositories need clearer README files with setup, screenshots, and architecture notes.",
    languages.length >= 3
      ? "Tech stack diversity is visible without looking scattered."
      : "Portfolio would benefit from one more end-to-end project in a modern stack.",
    complexity >= 65
      ? "Some repositories show real-world complexity."
      : "Most projects still read like assignments; add deployment, auth, data, or users.",
  ];

  return insights;
}

function daysSince(date: string) {
  return (Date.now() - new Date(date).getTime()) / 86_400_000;
}
