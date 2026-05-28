"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarCheck,
  FilePenLine,
  Globe2,
  GraduationCap,
  Mic,
  Radar,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  TriangleAlert,
} from "lucide-react";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { GitHubIntelligencePanel } from "@/components/app/github-intelligence-panel";
import { MetricCard } from "@/components/app/metric-card";
import { RadialScore } from "@/components/app/radial-score";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { loadLatestAnalysis } from "@/lib/intelligence/client-store";
import type { CareerAnalysis } from "@/lib/intelligence/types";

const launchSteps = [
  {
    step: "01",
    title: "Upload proof",
    body: "Analyze your resume and target role so CareerOS can score readiness from real evidence.",
    href: "/start",
    icon: Target,
  },
  {
    step: "02",
    title: "Tailor the resume",
    body: "Create a clean one-page resume or tailor an existing resume to a job description without fake claims.",
    href: "/resume-match",
    icon: FilePenLine,
  },
  {
    step: "03",
    title: "Generate portfolio",
    body: "Turn resume evidence and real GitHub repositories into a premium developer portfolio.",
    href: "/portfolio-generator",
    icon: Globe2,
  },
  {
    step: "04",
    title: "Find aligned jobs",
    body: "Use readiness insights to focus on jobs where your proof is strongest.",
    href: "/upload",
    icon: BriefcaseBusiness,
  },
  {
    step: "05",
    title: "Practice the screen",
    body: "Prepare answers for the exact weak points recruiters are likely to test.",
    href: "/interview",
    icon: Mic,
  },
];

export default function DashboardPage() {
  const [analysis, setAnalysis] = useState<CareerAnalysis | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setAnalysis(loadLatestAnalysis());
    setIsLoaded(true);
  }, []);

  const metrics = useMemo(
    () => analysis ? [
      { label: "Career Readiness", value: String(analysis.readinessScore), suffix: "/100", trend: `${analysis.confidenceIndex}/100 confidence` },
      { label: "Callback Probability", value: String(analysis.hiringProbability), suffix: "%", trend: "Based on recruiter signals" },
      { label: "Resume Proof", value: String(analysis.scoreBreakdown.resumeQuality), suffix: "%", trend: "Evidence density" },
      { label: "GitHub Signal", value: String(analysis.github?.portfolioStrength ?? analysis.scoreBreakdown.githubActivity), suffix: "%", trend: analysis.github ? "Live profile analyzed" : "Add GitHub proof" },
    ] : [],
    [analysis],
  );

  if (!isLoaded) {
    return (
      <DashboardShell>
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <Card className="min-h-[420px] animate-pulse p-6" />
        </div>
      </DashboardShell>
    );
  }

  if (!analysis) {
    return (
      <DashboardShell>
        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
          <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#070b13] p-6 shadow-panel lg:p-8">
            <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-teal-300/15 blur-3xl" />
            <div className="relative max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-200/20 bg-teal-300/10 px-3 py-1 text-sm text-teal-100">
                <Target className="h-4 w-4" />
                No readiness model yet
              </div>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Upload your resume to generate your first readiness model.
              </h1>
              <p className="mt-4 text-base leading-7 text-white/58">
                CareerOS will use your resume, target role, job description, and optional GitHub profile to build a real dashboard from your own evidence.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <PrimaryLink href="/start" label="Upload resume" icon={Target} />
                <SecondaryLink href="/resume-match" label="Explore resume tools" icon={FilePenLine} />
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <Card className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Launch Workflow</h2>
                  <p className="mt-2 text-sm leading-6 text-white/48">Start with real proof before unlocking scores, risks, missions, and recommendations.</p>
                </div>
                <Rocket className="h-6 w-6 text-teal-200" />
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {launchSteps.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.step} href={item.href} className="group rounded-xl border border-white/10 bg-white/[0.04] p-5 transition hover:-translate-y-1 hover:border-teal-200/30 hover:bg-teal-300/10">
                      <div className="flex items-start justify-between gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-lg border border-teal-200/20 bg-teal-300/10 text-sm font-semibold text-teal-100">
                          {item.step}
                        </div>
                        <Icon className="h-5 w-5 text-white/35 transition group-hover:text-teal-100" />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-white/50">{item.body}</p>
                    </Link>
                  );
                })}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-amber-200" />
                <h2 className="text-xl font-semibold text-white">What unlocks after upload</h2>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  "A readiness score based on your actual resume.",
                  "Recruiter risks tied to your target role.",
                  "A 14-day sprint built from your missing proof.",
                  "Resume, portfolio, job, and interview recommendations.",
                ].map((item) => (
                  <div key={item} className="flex gap-3 rounded-lg border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white/62">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-200" />
                    {item}
                  </div>
                ))}
              </div>
            </Card>
          </section>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#070b13] p-6 shadow-panel lg:p-8">
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-teal-300/15 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-200/20 bg-teal-300/10 px-3 py-1 text-sm text-teal-100">
                <Sparkles className="h-4 w-4" />
                Guided Job-Ready Flow
              </div>
              <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Turn your real proof into a resume, portfolio, jobs, and interview prep.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-white/58">
                Start with your resume and target role. CareerOS keeps every output grounded in evidence, then guides you through the next application step.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <PrimaryLink href="/start" label="Start guided flow" icon={Target} />
                <SecondaryLink href="/resume-match" label="Tailor resume" icon={FilePenLine} />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur">
              <RadialScore value={analysis.readinessScore} label="Readiness" sublabel={`${analysis.hiringProbability}% callback probability`} />
            </div>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>

        <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <Card className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white">Launch Workflow</h2>
                <p className="mt-2 text-sm leading-6 text-white/48">One main path: verified proof, tailored resume, portfolio, live jobs, interview.</p>
              </div>
              <Rocket className="h-6 w-6 text-teal-200" />
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {launchSteps.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.step} href={item.href} className="group rounded-xl border border-white/10 bg-white/[0.04] p-5 transition hover:-translate-y-1 hover:border-teal-200/30 hover:bg-teal-300/10">
                    <div className="flex items-start justify-between gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-lg border border-teal-200/20 bg-teal-300/10 text-sm font-semibold text-teal-100">
                        {item.step}
                      </div>
                      <Icon className="h-5 w-5 text-white/35 transition group-hover:text-teal-100" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/50">{item.body}</p>
                  </Link>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-amber-200" />
              <h2 className="text-xl font-semibold text-white">Product Promise</h2>
            </div>
            <div className="mt-5 space-y-3">
              {[
                "No fake projects or fake skills.",
                "Every resume and portfolio output should be based on user evidence.",
                "Recruiter-facing clarity is more important than decorative AI text.",
                "GitHub, resume, and job description become one application kit.",
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-lg border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white/62">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-200" />
                  {item}
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Radar className="h-5 w-5 text-teal-200" />
              <h2 className="text-xl font-semibold text-white">Readiness Breakdown</h2>
            </div>
            <div className="mt-6 space-y-5">
              {[
                ["Resume", analysis.scoreBreakdown.resumeQuality],
                ["Projects", analysis.scoreBreakdown.projectQuality],
                ["GitHub", analysis.github?.portfolioStrength ?? analysis.scoreBreakdown.githubActivity],
                ["Interview", analysis.scoreBreakdown.communicationQuality],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-white/70">{label}</span>
                    <span className="text-white/45">{value}%</span>
                  </div>
                  <Progress value={Number(value)} />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <TriangleAlert className="h-5 w-5 text-amber-200" />
              <h2 className="text-xl font-semibold text-white">Recruiter Risk</h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/58">{analysis.recruiterSimulation.personaFeedback[analysis.persona]}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {analysis.recruiterAlerts.slice(0, 4).map((alert) => (
                <div key={alert} className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm leading-6 text-white/62">
                  {alert}
                </div>
              ))}
            </div>
          </Card>
        </section>

        <GitHubIntelligencePanel initial={analysis.github} />

        <section className="grid gap-6 xl:grid-cols-2">
          <ActionCard icon={FilePenLine} title="Resume Studio" body="ATS-safe resume creation, JD tailoring, truth labels, and formatted export." href="/resume-match" />
          <ActionCard icon={Globe2} title="Portfolio Generator" body="Generate a clean portfolio using only real resume and GitHub repository data." href="/portfolio-generator" />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <CalendarCheck className="h-5 w-5 text-teal-200" />
              <h2 className="text-xl font-semibold text-white">Next 7 Days</h2>
            </div>
            <div className="mt-5 space-y-3">
              {analysis.dailyMissions.slice(0, 4).map((mission) => (
                <div key={mission.title} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                  <div className="text-sm text-white/76">{mission.title}</div>
                  <div className="mt-1 text-xs text-white/40">{mission.impact} - {mission.estimatedMinutes} min</div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-5 w-5 text-amber-200" />
              <h2 className="text-xl font-semibold text-white">Skills To Prove Next</h2>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {[...analysis.missingSkills.map((skill) => skill.skill), ...analysis.trendingIndustrySkills].slice(0, 14).map((skill) => (
                <span key={skill} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white/60">
                  {skill}
                </span>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </DashboardShell>
  );
}

function PrimaryLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Link href={href} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-glow">
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function SecondaryLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Link href={href} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-medium text-white">
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function ActionCard({
  icon: Icon,
  title,
  body,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  href: string;
}) {
  return (
    <Link href={href} className="glass group rounded-xl p-6 transition hover:-translate-y-1 hover:border-teal-200/30">
      <Icon className="h-5 w-5 text-teal-200" />
      <h3 className="mt-5 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-white/52">{body}</p>
      <div className="mt-5 inline-flex items-center gap-2 text-sm text-teal-100">
        Open <ArrowUpRight className="h-4 w-4" />
      </div>
    </Link>
  );
}
