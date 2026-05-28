"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Github, Loader2, RadioTower, Sparkles, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { readApiJson } from "@/lib/api-response";
import { loadLatestGithub, saveLatestGithub } from "@/lib/intelligence/client-store";
import type { GitHubIntelligence } from "@/lib/intelligence/types";

export function GitHubIntelligencePanel({ initial }: { initial?: GitHubIntelligence }) {
  const [username, setUsername] = useState(initial?.username ?? "");
  const [github, setGithub] = useState<GitHubIntelligence | undefined>(initial);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setGithub(initial ?? loadLatestGithub() ?? undefined);
    setUsername(initial?.username ?? loadLatestGithub()?.username ?? "");
  }, [initial]);

  async function analyze() {
    if (!username.trim()) {
      setError("Enter a GitHub username first.");
      return;
    }

    setError("");
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const payload = await readApiJson<{ github?: GitHubIntelligence }>(response);

      if (!response.ok || !payload.github) {
        setError(payload.error ?? "Could not analyze this GitHub profile.");
        return;
      }

      setGithub(payload.github);
      saveLatestGithub(payload.github);
    } catch {
      setError("Network error. Could not reach GitHub analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Github className="h-5 w-5 text-teal-200" />
            <h2 className="text-xl font-semibold text-white">GitHub Intelligence</h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
            Analyze repository quality, README trust, stack diversity, recent activity, and real-world complexity.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-md">
          <Input
            placeholder="GitHub username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void analyze();
            }}
          />
          <Button onClick={() => void analyze()} disabled={isAnalyzing}>
            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RadioTower className="h-4 w-4" />}
            Analyze
          </Button>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-amber-200">{error}</p> : null}

      {github ? (
        <div className="mt-6 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-xl border border-white/10 bg-black/20 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-white/45">@{github.username}</div>
                <div className="mt-2 text-4xl font-semibold gradient-text">{github.portfolioStrength}/100</div>
                <div className="mt-1 text-sm text-white/50">portfolio strength</div>
              </div>
              <a
                href={github.profileUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-white/10 bg-white/[0.05] p-2 text-white/55 transition hover:text-white"
                aria-label="Open GitHub profile"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            <div className="mt-5 space-y-4">
              <Metric label="Repository quality" value={github.repositoryQuality} />
              <Metric label="Commit consistency" value={github.commitConsistency} />
              <Metric label="README quality" value={github.readmeQuality} />
              <Metric label="Real-world complexity" value={github.realWorldComplexity} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <MiniStat label="Public repos" value={String(github.publicRepos)} />
              <MiniStat label="Followers" value={String(github.followers)} />
              <MiniStat label="Stacks" value={String(github.techStackDiversity.length)} />
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                <Sparkles className="h-4 w-4 text-teal-200" />
                AI portfolio insights
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {github.insights.map((insight) => (
                  <div key={insight} className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white/58">
                    {insight}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
              <div className="text-sm font-medium text-white">Top repositories analyzed</div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {github.repositories.slice(0, 4).map((repo) => (
                  <div key={repo.name} className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <div className="truncate text-sm font-medium text-white">{repo.name}</div>
                    <div className="mt-1 text-xs text-white/40">{repo.language ?? "Mixed stack"} - {repo.hasReadme ? "README found" : "README missing"}</div>
                  </div>
                ))}
              </div>
            </div>
            <ProjectImprovementChecklist github={github} />
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-sm leading-6 text-white/50">
          Try `octocat` or your own GitHub username. This runs against the live GitHub API and saves the latest result in the browser.
        </div>
      )}
    </Card>
  );
}

function ProjectImprovementChecklist({ github }: { github: GitHubIntelligence }) {
  const repos = github.repositories.slice(0, 5);
  const readmeCount = repos.filter((repo) => repo.hasReadme).length;
  const deployCount = repos.filter((repo) => repo.hasDeploySignal).length;
  const testCount = repos.filter((repo) => repo.hasTestSignal).length;
  const recentCount = repos.filter((repo) => Date.now() - new Date(repo.updatedAt).getTime() < 120 * 86_400_000).length;
  const checklist = [
    {
      label: "README proof",
      done: readmeCount >= Math.min(3, repos.length),
      detail: `${readmeCount}/${repos.length} top repos include README files. Add setup, screenshots, architecture, and decisions.`,
    },
    {
      label: "Deployment signal",
      done: deployCount >= 1,
      detail: deployCount ? `${deployCount} repo${deployCount > 1 ? "s" : ""} show a live/demo/deploy signal.` : "Add one live demo link or deployment config to your strongest project.",
    },
    {
      label: "Test signal",
      done: testCount >= 1,
      detail: testCount ? `${testCount} repo${testCount > 1 ? "s" : ""} show tests or test tooling.` : "Add at least one unit/integration test path and document how to run it.",
    },
    {
      label: "Recent maintenance",
      done: recentCount >= Math.min(2, repos.length),
      detail: `${recentCount}/${repos.length} top repos were updated in the last 120 days.`,
    },
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
        <TriangleAlert className="h-4 w-4 text-amber-200" />
        GitHub/project improvement checklist
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {checklist.map((item) => (
          <div key={item.label} className={`rounded-lg border p-3 ${item.done ? "border-teal-200/25 bg-teal-300/10" : "border-amber-200/20 bg-amber-300/10"}`}>
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <CheckCircle2 className={`h-4 w-4 ${item.done ? "text-teal-200" : "text-amber-200"}`} />
              {item.label}
            </div>
            <p className="mt-2 text-xs leading-5 text-white/52">{item.detail}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3 text-xs leading-5 text-white/48">
        Recruiter priority: make one flagship repository unmistakably real with a live URL, strong README, tests, screenshots, architecture notes, and clear ownership.
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-white/60">{label}</span>
        <span className="text-white/40">{value}%</span>
      </div>
      <Progress value={value} />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div className="text-2xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-xs text-white/45">{label}</div>
    </div>
  );
}
