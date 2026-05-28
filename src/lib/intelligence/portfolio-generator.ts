import { createOpenAIClient } from "@/lib/openai/client";

export type PortfolioGeneratorInput = {
  fullName?: string;
  email?: string;
  linkedInUrl: string;
  githubUrl: string;
  targetRole?: string;
  resumeText: string;
};

export type PortfolioRepo = {
  name: string;
  description: string;
  rewrittenDescription: string;
  techStack: string[];
  githubUrl: string;
  liveDemoUrl?: string;
  stars: number;
  updatedAt: string;
  score: number;
  readmeSignal: "strong" | "basic" | "missing";
};

export type PortfolioGeneratorResult = {
  hero: {
    fullName: string;
    role: string;
    tagline: string;
    githubUrl: string;
    linkedInUrl: string;
    resumeLabel: string;
  };
  about: {
    summary: string;
    skills: string[];
  };
  projects: PortfolioRepo[];
  contact: {
    email: string;
    githubUrl: string;
    linkedInUrl: string;
  };
  exports: {
    html: string;
    data: Record<string, unknown>;
  };
};

type GitHubUserApi = {
  name: string | null;
  email: string | null;
  bio: string | null;
  html_url: string;
  login: string;
};

type GitHubRepoApi = {
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  language: string | null;
  topics?: string[];
  updated_at: string;
  fork: boolean;
  archived: boolean;
  size: number;
};

type RepoReadme = {
  text: string;
  signal: PortfolioRepo["readmeSignal"];
};

export async function generateAiPortfolio(input: PortfolioGeneratorInput): Promise<PortfolioGeneratorResult> {
  const githubUsername = parseGitHubUsername(input.githubUrl);
  const [githubUser, repos] = await Promise.all([fetchGitHubUser(githubUsername), fetchGitHubRepos(githubUsername)]);
  if (!repos.length) {
    throw new Error("No usable public GitHub repositories found. Add a valid GitHub profile with public, non-fork repositories.");
  }
  const fallback = createPortfolio(input, githubUser, repos);
  const client = createOpenAIClient();
  if (!client) return fallback;

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.25,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You generate clean developer portfolios using ONLY provided GitHub, resume, and user-entered data. Do not invent projects, companies, metrics, demos, skills, education, or achievements. Keep output concise, realistic, human, and recruiter-friendly. Return valid JSON only.",
        },
        {
          role: "user",
          content: JSON.stringify({
            input,
            githubUser,
            repositories: repos,
            requiredShape: fallback,
            instruction:
              "Improve only hero.role, hero.tagline, about.summary, about.skills, and each existing project's rewrittenDescription using the evidence provided. Do not add, remove, rename, reorder, or change project URLs. Keep exactly these portfolio sections: hero, about, projects, contact.",
          }),
        },
      ],
    });
    const content = completion.choices[0]?.message.content;
    if (!content) return fallback;
    return normalizeResult(JSON.parse(content) as PortfolioGeneratorResult, fallback);
  } catch {
    return fallback;
  }
}

async function fetchGitHubUser(username: string): Promise<GitHubUserApi | null> {
  if (!username) return null;
  try {
    const response = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 180 },
    });
    if (!response.ok) return null;
    return (await response.json()) as GitHubUserApi;
  } catch {
    return null;
  }
}

async function fetchGitHubRepos(username: string): Promise<PortfolioRepo[]> {
  if (!username) return [];
  try {
    const response = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=30`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 180 },
    });
    if (!response.ok) return [];
    const repos = (await response.json()) as GitHubRepoApi[];
    const candidates = repos
      .filter((repo) => !repo.fork && !repo.archived)
      .sort((a, b) => scoreRepoShell(b) - scoreRepoShell(a))
      .slice(0, 12);
    const readmes = await Promise.all(candidates.map((repo) => fetchRepoReadme(username, repo.name)));
    return candidates
      .map((repo, index) => {
        const readme = readmes[index];
        const stack = unique([repo.language ?? undefined, ...(repo.topics ?? []).slice(0, 4)]);
        const description = repo.description?.trim() || `${titleFromRepo(repo.name)} project repository.`;
        const score = scoreRepo(repo, readme);
        return {
          name: titleFromRepo(repo.name),
          description,
          rewrittenDescription: rewriteRepoDescription(repo.name, description, stack, readme.text),
          techStack: stack.length ? stack : ["Repository"],
          githubUrl: repo.html_url,
          liveDemoUrl: normalizeHomepage(repo.homepage),
          stars: repo.stargazers_count,
          updatedAt: repo.updated_at,
          score,
          readmeSignal: readme.signal,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  } catch {
    return [];
  }
}

async function fetchRepoReadme(username: string, repo: string): Promise<RepoReadme> {
  try {
    const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(repo)}/readme`, {
      headers: { Accept: "application/vnd.github.raw" },
      next: { revalidate: 180 },
    });
    if (!response.ok) return { text: "", signal: "missing" };
    const text = (await response.text()).slice(0, 5000);
    if (text.length > 900) return { text, signal: "strong" };
    if (text.length > 120) return { text, signal: "basic" };
    return { text, signal: "missing" };
  } catch {
    return { text: "", signal: "missing" };
  }
}

function createPortfolio(input: PortfolioGeneratorInput, githubUser: GitHubUserApi | null, repos: PortfolioRepo[]): PortfolioGeneratorResult {
  const fullName = input.fullName?.trim() || guessNameFromResume(input.resumeText) || githubUser?.name || titleFromRepo(parseGitHubUsername(input.githubUrl)) || "Developer";
  const email = input.email?.trim() || findEmail(input.resumeText) || githubUser?.email || "";
  const skills = inferSkills(input.resumeText, repos);
  const role = input.targetRole?.trim() || inferRole(input.resumeText, repos);
  const projects = repos.length ? repos : [];
  const githubProfileUrl = githubUser?.html_url || canonicalGitHubUrl(input.githubUrl);
  const result: PortfolioGeneratorResult = {
    hero: {
      fullName,
      role,
      tagline: buildTagline(role, skills),
      githubUrl: githubProfileUrl,
      linkedInUrl: input.linkedInUrl,
      resumeLabel: "Download Resume",
    },
    about: {
      summary: buildAboutSummary(fullName, role, skills, projects),
      skills,
    },
    projects,
    contact: {
      email,
      githubUrl: githubProfileUrl,
      linkedInUrl: input.linkedInUrl,
    },
    exports: {
      html: "",
      data: {},
    },
  };
  result.exports = {
    html: buildPortfolioHtml(result),
    data: {
      hero: result.hero,
      about: result.about,
      projects: result.projects,
      contact: result.contact,
    },
  };
  return result;
}

function normalizeResult(result: PortfolioGeneratorResult, fallback: PortfolioGeneratorResult): PortfolioGeneratorResult {
  const projectTextByUrl = new Map(
    (Array.isArray(result.projects) ? result.projects : [])
      .filter((project) => project?.githubUrl)
      .map((project) => [project.githubUrl, project.rewrittenDescription || project.description]),
  );
  const merged: PortfolioGeneratorResult = {
    hero: { ...fallback.hero, ...(result.hero ?? {}) },
    about: {
      ...fallback.about,
      ...(result.about ?? {}),
      skills: normalizeArray(result.about?.skills, fallback.about.skills),
    },
    projects: fallback.projects.map((project) => ({
      ...project,
      rewrittenDescription: safeProjectDescription(projectTextByUrl.get(project.githubUrl), project.rewrittenDescription),
    })),
    contact: { ...fallback.contact, ...(result.contact ?? {}) },
    exports: { html: "", data: {} },
  };
  merged.exports = {
    html: buildPortfolioHtml(merged),
    data: { hero: merged.hero, about: merged.about, projects: merged.projects, contact: merged.contact },
  };
  return merged;
}

function scoreRepoShell(repo: GitHubRepoApi) {
  const recentDays = (Date.now() - new Date(repo.updated_at).getTime()) / (1000 * 60 * 60 * 24);
  const recentScore = recentDays < 60 ? 30 : recentDays < 180 ? 20 : 10;
  const readmeProxy = repo.description ? 18 : 4;
  const stackScore = repo.language ? 14 : 4;
  const demoScore = normalizeHomepage(repo.homepage) ? 12 : 0;
  const starsScore = Math.min(18, repo.stargazers_count * 2);
  const sizeScore = repo.size > 80 ? 8 : 3;
  return Math.round(recentScore + readmeProxy + stackScore + demoScore + starsScore + sizeScore);
}

function scoreRepo(repo: GitHubRepoApi, readme: RepoReadme) {
  const readmeScore = readme.signal === "strong" ? 20 : readme.signal === "basic" ? 10 : 0;
  return scoreRepoShell(repo) + readmeScore;
}

function rewriteRepoDescription(name: string, description: string, stack: string[], readmeText = "") {
  const clean = description.replace(/\s+/g, " ").replace(/[.;\s]+$/, "");
  const stackText = stack.length ? ` Built with ${stack.slice(0, 3).join(", ")}.` : "";
  if (clean.length > 32 && !/no description/i.test(clean)) return `${clean}.${stackText}`.trim();
  const readmeSummary = readmeText
    .split(/\n+/)
    .map((line) => line.replace(/[#*_`>-]/g, "").trim())
    .find((line) => line.length > 40 && line.length < 180);
  if (readmeSummary) return `${readmeSummary.replace(/[.;\s]+$/, "")}.${stackText}`.trim();
  return `${titleFromRepo(name)} is a real GitHub project focused on ${stack.slice(0, 2).join(" and ") || "software development"}.`;
}

function safeProjectDescription(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length < 30 || clean.length > 320) return fallback;
  if (/\b\d+[%x]|\busers?\b|\brevenue\b|\baward|\bwon\b|\bproduction scale\b/i.test(clean)) return fallback;
  return clean;
}

function buildTagline(role: string, skills: string[]) {
  const focus = skills.slice(0, 3).join(", ") || "modern software systems";
  return `${role} building clean, practical systems with ${focus}.`;
}

function buildAboutSummary(fullName: string, role: string, skills: string[], projects: PortfolioRepo[]) {
  const projectText = projects.length
    ? `The project work highlights ${projects.slice(0, 3).map((project) => project.name).join(", ")}.`
    : "The portfolio is ready for GitHub-backed project work once repositories are available.";
  return `${fullName} is a ${role} focused on building readable, practical software backed by real project work. Core strengths include ${skills.slice(0, 7).join(", ") || "software engineering and product execution"}. ${projectText}`;
}

function inferRole(resumeText: string, repos: PortfolioRepo[]) {
  const text = `${resumeText} ${repos.map((repo) => `${repo.name} ${repo.description} ${repo.techStack.join(" ")}`).join(" ")}`.toLowerCase();
  if (/(machine learning|deep learning|openai|llm|rag|model|nlp|pytorch|tensorflow)/.test(text)) return "AI Engineer";
  if (/(data analyst|analytics|dashboard|power bi|tableau|excel|visualization|sql)/.test(text)) return "Data Analyst";
  if (/(frontend|react|next\.js|tailwind|ui|component)/.test(text)) return "Frontend Developer";
  if (/(backend|api|node|express|database|postgres|mongodb)/.test(text)) return "Backend Developer";
  if (/(full stack|full-stack|next|react|node|api)/.test(text)) return "Full Stack Developer";
  return "Software Developer";
}

function inferSkills(resumeText: string, repos: PortfolioRepo[]) {
  const text = `${resumeText} ${repos.map((repo) => `${repo.name} ${repo.description} ${repo.techStack.join(" ")}`).join(" ")}`.toLowerCase();
  const vocabulary = [
    "TypeScript",
    "JavaScript",
    "Python",
    "React",
    "Next.js",
    "Node.js",
    "OpenAI",
    "Machine Learning",
    "SQL",
    "PostgreSQL",
    "MongoDB",
    "Tailwind CSS",
    "GitHub",
    "Vercel",
    "REST APIs",
    "Data Analytics",
  ];
  const found = vocabulary.filter((skill) => text.includes(skill.toLowerCase().replace(" api", "")));
  const repoSkills = repos.flatMap((repo) => repo.techStack);
  return unique([...found, ...repoSkills]).slice(0, 12);
}

function buildPortfolioHtml(result: PortfolioGeneratorResult) {
  const skills = result.about.skills.map((skill) => `<span>${escapeHtml(skill)}</span>`).join("");
  const projects = result.projects
    .map(
      (project) => `<article><h3>${escapeHtml(project.name)}</h3><p>${escapeHtml(project.rewrittenDescription)}</p><div>${project.techStack.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div><a href="${escapeAttr(project.githubUrl)}">GitHub</a>${project.liveDemoUrl ? `<a href="${escapeAttr(project.liveDemoUrl)}">Live Demo</a>` : ""}</article>`,
    )
    .join("");
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(result.hero.fullName)} Portfolio</title>
  <style>
    *{box-sizing:border-box} html{scroll-behavior:smooth} body{margin:0;background:#05070d;color:#f8fafc;font-family:Inter,ui-sans-serif,system-ui,sans-serif} a{color:inherit;text-decoration:none}
    .glow{position:fixed;inset:0;background:radial-gradient(circle at 70% 10%,rgba(34,211,238,.18),transparent 28rem),radial-gradient(circle at 20% 70%,rgba(45,212,191,.12),transparent 24rem);pointer-events:none}
    main{position:relative;max-width:1080px;margin:auto;padding:0 24px}.hero{min-height:100vh;display:grid;align-content:center}.eyebrow{color:#67e8f9;font-size:14px}.hero h1{max-width:850px;margin:18px 0 0;font-size:clamp(48px,8vw,92px);line-height:.95;letter-spacing:-.04em}.hero p{max-width:620px;color:#b6c2d1;font-size:18px;line-height:1.7}.actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}.actions a,button{border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:12px 16px;background:rgba(255,255,255,.06);color:#fff}.primary{background:#67e8f9!important;color:#06111a!important}
    section{padding:76px 0;border-top:1px solid rgba(255,255,255,.08)}h2{font-size:28px}.card{border:1px solid rgba(255,255,255,.1);border-radius:20px;background:rgba(255,255,255,.055);padding:24px;backdrop-filter:blur(16px)}.summary{color:#cbd5e1;line-height:1.8}.skills,.tech{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}.skills span,.tech span{border:1px solid rgba(103,232,249,.18);border-radius:999px;background:rgba(103,232,249,.08);padding:7px 10px;color:#cffafe;font-size:13px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}article{border:1px solid rgba(255,255,255,.1);border-radius:18px;background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.035));padding:20px;transition:.2s}article:hover{transform:translateY(-4px);border-color:rgba(103,232,249,.35)}article p{color:#b6c2d1;line-height:1.65}article a{display:inline-block;margin-top:14px;margin-right:10px;color:#67e8f9}.contact{display:flex;flex-wrap:wrap;gap:12px;color:#cbd5e1}@media(max-width:640px){main{padding:0 18px}.hero h1{font-size:48px}}
  </style>
</head>
<body><div class="glow"></div><main>
  <section class="hero"><div class="eyebrow">${escapeHtml(result.hero.role)}</div><h1>${escapeHtml(result.hero.fullName)}</h1><p>${escapeHtml(result.hero.tagline)}</p><div class="actions"><a class="primary" href="${escapeAttr(result.hero.githubUrl)}">GitHub</a><a href="${escapeAttr(result.hero.linkedInUrl)}">LinkedIn</a><a href="#contact">${escapeHtml(result.hero.resumeLabel)}</a></div></section>
  <section><h2>About</h2><div class="card"><p class="summary">${escapeHtml(result.about.summary)}</p><div class="skills">${skills}</div></div></section>
  <section><h2>Projects</h2><div class="grid">${projects}</div></section>
  <section id="contact"><h2>Contact</h2><div class="contact">${result.contact.email ? `<a href="mailto:${escapeAttr(result.contact.email)}">${escapeHtml(result.contact.email)}</a>` : ""}<a href="${escapeAttr(result.contact.githubUrl)}">GitHub</a><a href="${escapeAttr(result.contact.linkedInUrl)}">LinkedIn</a></div><form class="card" style="margin-top:20px"><input placeholder="Name" /><input placeholder="Email" /><textarea placeholder="Message"></textarea></form></section>
</main></body></html>`;
}

function parseGitHubUsername(value: string) {
  const trimmed = value.trim().replace(/^@/, "");
  const match = trimmed.match(/github\.com\/([^/?#]+)/i);
  return (match?.[1] ?? trimmed).replace(/^@/, "");
}

function canonicalGitHubUrl(value: string) {
  const username = parseGitHubUsername(value);
  return username ? `https://github.com/${username}` : value;
}

function titleFromRepo(name: string) {
  return name.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function findEmail(text: string) {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
}

function guessNameFromResume(text: string) {
  const firstLine = text.split(/\n+/).map((line) => line.trim()).find((line) => /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/.test(line));
  return firstLine ?? "";
}

function normalizeHomepage(value: string | null) {
  const clean = value?.trim();
  if (!clean) return undefined;
  if (/^https?:\/\//i.test(clean)) return clean;
  return undefined;
}

function normalizeArray(value: unknown, fallback: string[]) {
  return Array.isArray(value) ? value.map(String).filter(Boolean).slice(0, 12) : fallback;
}

function unique(values: Array<string | undefined>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean))) as string[];
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeAttr(value: string) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}
