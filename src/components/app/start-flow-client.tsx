"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, FilePenLine, Globe2, Medal, Mic, ShieldCheck, Target, UploadCloud } from "lucide-react";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { UploadFlow, type UploadDraftState } from "@/components/app/upload-flow";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { loadCareerOSProfile } from "@/lib/careeros-profile-store";
import { loadInterviewProgress, loadLatestAnalysis } from "@/lib/intelligence/client-store";
import type { CareerAnalysis } from "@/lib/intelligence/types";

const flowSteps = [
  {
    label: "Upload resume",
    body: "Parse the resume and evidence base.",
    href: "/start#upload",
    icon: UploadCloud,
    kind: "upload",
  },
  {
    label: "Choose target role",
    body: "Anchor feedback to one job direction.",
    href: "/start#upload",
    icon: Target,
    kind: "target",
  },
  {
    label: "Get score",
    body: "See ATS score, risk, and next move.",
    href: "/analysis",
    icon: Medal,
    kind: "score",
  },
  {
    label: "Fix resume",
    body: "Tailor without invented claims.",
    href: "/resume-match",
    icon: FilePenLine,
    kind: "resume",
  },
  {
    label: "Generate portfolio",
    body: "Turn real GitHub and resume proof into presence.",
    href: "/portfolio-generator",
    icon: Globe2,
    kind: "portfolio",
  },
  {
    label: "Find jobs",
    body: "Search validated live roles that match your profile.",
    href: "/upload",
    icon: BriefcaseBusiness,
    kind: "jobs",
  },
  {
    label: "Practice interview",
    body: "Train against the weak points recruiters will test.",
    href: "/interview",
    icon: Mic,
    kind: "interview",
  },
] as const;

export function StartFlowClient() {
  const [analysis, setAnalysis] = useState<CareerAnalysis | null>(null);
  const [draft, setDraft] = useState<UploadDraftState>({ hasFile: false, hasTargetRole: false });
  const [artifactCounts, setArtifactCounts] = useState({ resume: 0, portfolio: 0 });
  const [interviewsCompleted, setInterviewsCompleted] = useState(0);

  useEffect(() => {
    setAnalysis(loadLatestAnalysis());
    const profile = loadCareerOSProfile();
    setArtifactCounts({
      resume: profile.artifacts.filter((artifact) => artifact.type === "resume").length,
      portfolio: profile.artifacts.filter((artifact) => artifact.type === "portfolio").length,
    });
    setInterviewsCompleted(loadInterviewProgress().completed);
  }, []);

  const completed = useMemo(() => {
    const hasAnalysis = Boolean(analysis);
    return {
      upload: hasAnalysis || draft.hasFile,
      target: hasAnalysis || draft.hasTargetRole,
      score: hasAnalysis,
      resume: artifactCounts.resume > 0,
      portfolio: artifactCounts.portfolio > 0,
      jobs: false,
      interview: interviewsCompleted > 0,
    };
  }, [analysis, artifactCounts, draft, interviewsCompleted]);

  const completedCount = flowSteps.filter((step) => completed[step.kind]).length;
  const progress = Math.round((completedCount / flowSteps.length) * 100);
  const nextStep = flowSteps.find((step) => !completed[step.kind]) ?? flowSteps.at(-1);
  const stepHref = (step: (typeof flowSteps)[number]) => {
    if (step.kind === "upload" || step.kind === "target") return step.href;
    if (step.kind === "score") return analysis ? step.href : "/start#upload";
    return analysis ? step.href : "/start#upload";
  };
  const stepLocked = (step: (typeof flowSteps)[number]) => !["upload", "target"].includes(step.kind) && !analysis;

  return (
    <DashboardShell active="Start Here">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#070b13] p-6 shadow-panel lg:p-8">
          <div className="relative grid gap-8 xl:grid-cols-[1fr_380px] xl:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-teal-200/20 bg-teal-300/10 px-3 py-1 text-sm text-teal-100">
                <ShieldCheck className="h-4 w-4" />
                Start here
              </div>
              <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                One guided flow from resume upload to interview-ready applications.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-white/58">
                Upload your resume, choose a target role, get your ATS score, then move step by step through resume repair, portfolio proof, live jobs, and interview practice.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a href="#upload" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-glow">
                  Upload resume <ArrowRight className="h-4 w-4" />
                </a>
                {analysis ? (
                  <Link href={nextStep?.href ?? "/analysis"} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-medium text-white">
                    Continue flow
                  </Link>
                ) : null}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/55">Flow progress</span>
                <span className="text-white/40">{progress}%</span>
              </div>
              <Progress value={progress} className="mt-3 h-3" />
              <div className="mt-5 text-3xl font-semibold text-white">
                {analysis ? `${analysis.readinessScore}/100` : "Not scored"}
              </div>
              <p className="mt-2 text-sm leading-6 text-white/50">
                {analysis
                  ? `Current target: ${analysis.targetRole}. Next: ${nextStep?.label}.`
                  : draft.hasFile
                    ? "Resume selected. Run analysis to generate your score."
                    : "Your ATS score appears after resume analysis."}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          {flowSteps.map((step, index) => {
            const Icon = step.icon;
            const done = completed[step.kind];
            const isNext = nextStep?.label === step.label;
            return (
              <Link
                key={step.label}
                href={stepHref(step)}
                className={`group rounded-xl border p-4 transition hover:-translate-y-1 ${
                  done
                    ? "border-teal-200/30 bg-teal-300/10"
                    : isNext
                      ? "border-amber-200/30 bg-amber-200/[0.07]"
                      : stepLocked(step)
                        ? "border-white/10 bg-black/20 opacity-65"
                        : "border-white/10 bg-white/[0.035]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-black/20 text-sm font-semibold text-white">
                    {done ? <CheckCircle2 className="h-5 w-5 text-teal-200" /> : String(index + 1).padStart(2, "0")}
                  </div>
                  <Icon className="h-5 w-5 text-white/35 transition group-hover:text-teal-100" />
                </div>
                <h2 className="mt-4 text-sm font-semibold text-white">{step.label}</h2>
                <p className="mt-2 text-xs leading-5 text-white/45">{step.body}</p>
                {stepLocked(step) ? <p className="mt-3 text-xs font-medium text-amber-100/70">Upload first</p> : null}
              </Link>
            );
          })}
        </section>

        <section id="upload" className="space-y-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm uppercase tracking-[0.26em] text-teal-200/75">Readiness scan</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">Upload once. Get a real career diagnosis.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
                CareerOS reads the resume, target role, job description, and GitHub signal, then opens the ATS report with score, missing keywords, risks, and next actions.
              </p>
            </div>
            {analysis ? (
              <Link href="/analysis" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-white">
                View latest score <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
          <UploadFlow redirectTo="/analysis" onDraftChange={setDraft} onAnalysisComplete={setAnalysis} />
        </section>

        <Card className="p-6">
          <div className="grid gap-5 md:grid-cols-3">
            <FlowCta title="Fix resume" body="Use the score and JD to improve the resume without lying." href="/resume-match" enabled={Boolean(analysis)} />
            <FlowCta title="Generate portfolio" body="Create a recruiter-facing portfolio from verified proof." href="/portfolio-generator" enabled={artifactCounts.resume > 0 || Boolean(analysis)} />
            <FlowCta title="Practice interview" body="Turn recruiter risks into mock interview practice." href="/interview" enabled={Boolean(analysis)} />
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}

function FlowCta({ title, body, href, enabled }: { title: string; body: string; href: string; enabled: boolean }) {
  return (
    <div className={`rounded-xl border p-5 ${enabled ? "border-white/10 bg-white/[0.04]" : "border-white/10 bg-black/20 opacity-65"}`}>
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/50">{body}</p>
      <Link
        href={enabled ? href : "/start#upload"}
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-medium text-white"
      >
        {enabled ? "Open step" : "Upload first"}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
