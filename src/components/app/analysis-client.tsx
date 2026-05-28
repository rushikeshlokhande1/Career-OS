"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bot, CalendarDays, CheckCircle2, FileText, Flame, Github, Mic, ShieldCheck, Target, TriangleAlert } from "lucide-react";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { RadialScore } from "@/components/app/radial-score";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { loadLatestAnalysis, loadSprintProgress, toggleSprintDay } from "@/lib/intelligence/client-store";
import { projectedScore } from "@/lib/intelligence/hire-ready-sprint";
import type { CareerAnalysis, HireReadySprintDay } from "@/lib/intelligence/types";

export function AnalysisClient() {
  const [analysis, setAnalysis] = useState<CareerAnalysis | null>(null);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loaded = loadLatestAnalysis();
    setAnalysis(loaded);
    setCompletedDays(loaded ? loadSprintProgress(loaded.id) : []);
    setIsLoaded(true);
  }, []);

  if (!isLoaded) {
    return (
      <DashboardShell active="Readiness Sprint">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <Card className="min-h-[420px] animate-pulse p-6" />
        </div>
      </DashboardShell>
    );
  }

  if (!analysis) {
    return (
      <DashboardShell active="Readiness Sprint">
        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
          <Card className="relative overflow-hidden p-6 lg:p-8">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal-300/10 blur-3xl" />
            <div className="relative max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-200/20 bg-teal-300/10 px-3 py-1 text-sm text-teal-100">
                <Target className="h-4 w-4" />
                No readiness model yet
              </div>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Upload your resume to generate your first readiness model.
              </h1>
              <p className="mt-5 text-base leading-7 text-white/60">
                Your sprint, recruiter risks, readiness score, and next actions will appear here after CareerOS analyzes your real resume and target role.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/start"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-glow"
                >
                  Upload resume <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-medium text-white"
                >
                  View dashboard
                </Link>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <RealityCard label="Current readiness" value="--" helper="Generated from your uploaded resume." />
            <RealityCard label="Hiring probability" value="--" helper="Calculated after target role analysis." />
            <RealityCard label="Sprint progress" value="--" helper="Your 14-day plan unlocks after upload." />
          </div>
        </div>
      </DashboardShell>
    );
  }

  const sprint = analysis.hireReadySprint;
  const progressValue = Math.round((completedDays.length / sprint.sprintDays.length) * 100);
  const nextDay = sprint.sprintDays.find((day) => !completedDays.includes(day.day)) ?? sprint.sprintDays.at(-1);
  const ats = analysis.atsReport ?? buildAtsScore(analysis);
  const atsLevel = ats.score >= 82 ? "Strong ATS fit" : ats.score >= 68 ? "Needs tailoring" : "Needs ATS cleanup";
  const atsPrimaryFix = ats.fixes[0] ?? "Paste the exact job description in Resume Match to tune keyword coverage.";

  return (
    <DashboardShell active="Readiness Sprint">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <Card className="relative overflow-hidden p-6">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal-300/10 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-200/20 bg-teal-300/10 px-3 py-1 text-sm text-teal-100">
                <ShieldCheck className="h-4 w-4" />
                ATS resume score ready
              </div>
              <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white">
                ATS Score: {ats.score}/100
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-white/60">
                CareerOS analyzed your resume text, ATS readability, target role fit, recruiter risks, and GitHub signal for{" "}
                <span className="font-medium text-white">{analysis.targetRole}</span>. {ats.verdict}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#sprint"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-glow"
                >
                  Start 14-day sprint <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  href="/interview"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-medium text-white"
                >
                  <Mic className="h-4 w-4" />
                  Practice interview
                </Link>
              </div>
            </div>
            <RadialScore value={ats.score} label="ATS score" sublabel={atsLevel} />
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <RealityCard label="ATS score" value={`${ats.score}%`} helper={atsPrimaryFix} />
          <RealityCard label="Keyword match" value={`${ats.keywordMatch}%`} helper="Based on skills and target-role signals found in the resume." />
          <RealityCard label="Resume format" value={`${ats.formatScore}%`} helper="Contact details, readable sections, and ATS-safe structure." />
          <RealityCard label="Proof strength" value={`${ats.proofScore}%`} helper="Projects, metrics, technical depth, and deployment evidence." />
        </div>

        <Card className="p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div>
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-teal-200" />
                <h2 className="text-2xl font-semibold text-white">ATS scan summary</h2>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">
                This score is generated from the uploaded resume, not demo data. It measures whether an ATS and recruiter can quickly read your role fit, skills, sections, links, and proof.
              </p>
            </div>
            <Link
              href="/resume-match"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-white"
            >
              Improve ATS match <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {ats.fixes.map((fix) => (
              <div key={fix} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <CheckCircle2 className="h-4 w-4 text-teal-200" />
                  Recommended fix
                </div>
                <p className="mt-2 text-sm leading-6 text-white/55">{fix}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <RealityCard label="Current readiness" value={`${analysis.readinessScore}%`} helper={`Projected: ${projectedScore(analysis.readinessScore, sprint.projectedReadinessGain)}% after sprint`} />
          <RealityCard label="Hiring probability" value={`${analysis.hiringProbability}%`} helper={`Potential lift: +${sprint.projectedHiringGain}% with proof upgrades`} />
          <RealityCard label="Sprint progress" value={`${progressValue}%`} helper={`${completedDays.length}/${sprint.sprintDays.length} tasks completed`} />
        </div>

        <Card className="p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <div className="flex items-center gap-3">
                <Flame className="h-5 w-5 text-teal-200" />
                <h2 className="text-2xl font-semibold text-white">Your next action</h2>
              </div>
              <p className="mt-3 text-lg leading-8 text-white/70">
                Day {nextDay?.day}: {nextDay?.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/50">{nextDay?.task}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-5">
              <div className="mb-3 flex justify-between text-sm">
                <span className="text-white/55">Sprint completion</span>
                <span className="text-white/40">{progressValue}%</span>
              </div>
              <Progress value={progressValue} className="h-3" />
              <div className="mt-4 flex gap-2">
                {nextDay ? (
                  <>
                    <button
                      onClick={() => setCompletedDays(toggleSprintDay(analysis.id, nextDay.day))}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark day {nextDay.day} done
                    </button>
                    <Link
                      href={toolHref(nextDay.tool)}
                      className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-white"
                    >
                      Open tool
                    </Link>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <div className="flex items-center gap-3">
                <TriangleAlert className="h-5 w-5 text-amber-200" />
                <h2 className="text-2xl font-semibold text-white">The brutal truth</h2>
              </div>
              <p className="mt-4 text-lg leading-8 text-white/70">{sprint.brutalTruth}</p>
            </div>
            <div className="rounded-xl border border-teal-200/15 bg-teal-300/10 p-5">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-teal-200" />
                <h3 className="text-lg font-semibold text-white">Fastest path</h3>
              </div>
              <p className="mt-3 text-sm leading-7 text-white/65">{sprint.fastestPath}</p>
            </div>
          </div>
        </Card>

        <section id="sprint" className="space-y-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm uppercase tracking-[0.26em] text-teal-200/75">14-day sprint</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">Do this before applying heavily.</h2>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white/55">
              Resume + GitHub + Project + Interview
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {sprint.sprintDays.map((day) => (
              <SprintDayCard
                key={day.day}
                day={day}
                completed={completedDays.includes(day.day)}
                onToggle={() => setCompletedDays(toggleSprintDay(analysis.id, day.day))}
              />
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <ToolCard
            icon={<Bot className="h-5 w-5" />}
            title="Ask about any sprint day"
            body="Use the assistant when a task feels unclear or you need a stronger resume bullet."
            href="/assistant"
            cta="Ask assistant"
          />
          <ToolCard
            icon={<Mic className="h-5 w-5" />}
            title="Practice Day 7 and Day 12"
            body="Use Interview Arena to test project explanations and pressure answers."
            href="/interview"
            cta="Open arena"
          />
          <ToolCard
            icon={<Github className="h-5 w-5" />}
            title="Repair portfolio trust"
            body={analysis.github ? `Current GitHub signal: ${analysis.github.portfolioStrength}/100.` : "Add GitHub during analysis to judge portfolio proof."}
            href="/dashboard"
            cta="View dashboard"
          />
        </div>
      </div>
    </DashboardShell>
  );
}

function RealityCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <Card className="p-5">
      <div className="text-sm text-white/45">{label}</div>
      <div className="mt-3 text-4xl font-semibold tracking-tight gradient-text">{value}</div>
      <p className="mt-3 text-sm leading-6 text-white/50">{helper}</p>
    </Card>
  );
}

function buildAtsScore(analysis: CareerAnalysis) {
  const breakdown = analysis.scoreBreakdown;
  const resume = analysis.extractedResume;
  const contactScore = Math.round((resume.contactSignals.filter((item) => item.includes("present")).length / 3) * 100);
  const sectionScore = Math.round(([resume.education.length, resume.experience.length, resume.projects.length, resume.skills.length].filter(Boolean).length / 4) * 100);
  const keywordMatch = clamp(Math.round(breakdown.skillsRelevance * 0.7 + breakdown.technicalDepth * 0.3));
  const formatScore = clamp(Math.round(breakdown.resumeQuality * 0.55 + contactScore * 0.25 + sectionScore * 0.2));
  const proofScore = clamp(Math.round(breakdown.projectQuality * 0.35 + breakdown.communicationQuality * 0.3 + breakdown.technicalDepth * 0.2 + breakdown.deploymentExperience * 0.15));
  const score = clamp(Math.round(formatScore * 0.34 + keywordMatch * 0.33 + proofScore * 0.33));
  const fixes = [
    ...(keywordMatch < 70 ? ["Add role-specific keywords from the job description to your skills, project bullets, and summary where they are truthful."] : []),
    ...(formatScore < 70 ? ["Use clear standard sections like Summary, Skills, Experience, Projects, Education, and keep contact links visible."] : []),
    ...(proofScore < 70 ? ["Strengthen 2-3 bullets with measurable results, architecture choices, deployment links, or real user/project outcomes."] : []),
  ];
  const fallbackFix = "Open Resume Match, paste the job description, and tailor the resume for exact ATS keyword coverage.";

  return {
    score,
    keywordMatch,
    formatScore,
    proofScore,
    level: score >= 80 ? "Strong ATS fit" : score >= 65 ? "Needs light tailoring" : "Needs ATS cleanup",
    verdict:
      score >= 80
        ? "The resume is readable and has solid ATS signals, but a pasted job description can still improve keyword precision."
        : score >= 65
          ? "The resume is usable, but it needs sharper job keywords and stronger proof before heavy applications."
          : "The resume needs ATS cleanup before applying: clearer sections, stronger keywords, and more evidence.",
    primaryFix: fixes[0] ?? fallbackFix,
    fixes: (fixes.length ? fixes : [fallbackFix]).slice(0, 3),
  };
}

function clamp(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function SprintDayCard({ day, completed, onToggle }: { day: HireReadySprintDay; completed: boolean; onToggle: () => void }) {
  return (
    <Card className={`p-5 transition ${completed ? "border-teal-200/30 bg-teal-300/10" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggle}
            className={`grid h-10 w-10 place-items-center rounded-lg border text-sm font-semibold transition ${
              completed ? "border-teal-200/50 bg-teal-300/20 text-teal-50" : "border-teal-200/20 bg-teal-300/10 text-teal-100"
            }`}
            aria-label={`Mark day ${day.day} ${completed ? "incomplete" : "complete"}`}
          >
            {completed ? <CheckCircle2 className="h-5 w-5" /> : day.day}
          </button>
          <div>
            <h3 className="font-semibold text-white">{day.title}</h3>
            <p className="mt-1 text-xs text-white/40">{day.tool} - {day.difficulty}</p>
          </div>
        </div>
        <CalendarDays className="h-5 w-5 text-white/25" />
      </div>
      <p className="mt-4 text-sm leading-6 text-white/55">{day.task}</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          onClick={onToggle}
          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
            completed ? "border border-teal-200/20 bg-teal-300/10 text-teal-50" : "border border-white/10 bg-white/[0.05] text-white/65"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          {completed ? "Completed" : "Mark complete"}
        </button>
        <Link
          href={toolHref(day.tool)}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-medium text-white/65"
        >
          Open {day.tool}
        </Link>
      </div>
      <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-teal-200/70">
          <CheckCircle2 className="h-4 w-4" />
          Outcome
        </div>
        <p className="mt-2 text-sm text-white/60">{day.outcome}</p>
      </div>
    </Card>
  );
}

function toolHref(tool: HireReadySprintDay["tool"]) {
  const routes: Record<HireReadySprintDay["tool"], string> = {
    Resume: "/resume-match",
    GitHub: "/dashboard",
    Project: "/assistant",
    Skills: "/assistant",
    Interview: "/interview",
    Assistant: "/assistant",
  };
  return routes[tool];
}

function ToolCard({ icon, title, body, href, cta }: { icon: React.ReactNode; title: string; body: string; href: string; cta: string }) {
  return (
    <Card className="p-5">
      <div className="text-teal-200">{icon}</div>
      <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/50">{body}</p>
      <Link href={href} className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-teal-100">
        {cta} <ArrowRight className="h-4 w-4" />
      </Link>
    </Card>
  );
}
