"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, BriefcaseBusiness, CheckCircle2, FileText, Github, Loader2, ScanSearch, ShieldCheck, Target, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IntelligenceLoading, intelligenceStates } from "@/components/app/intelligence-loading";
import { readApiJson } from "@/lib/api-response";
import { clearLatestAnalysis, saveLatestAnalysis } from "@/lib/intelligence/client-store";
import type { CareerAnalysis } from "@/lib/intelligence/types";
import type { RecruiterPersona } from "@/lib/intelligence/types";

export type UploadDraftState = {
  hasFile: boolean;
  hasTargetRole: boolean;
};

export function UploadFlow({
  redirectTo = "/analysis",
  onDraftChange,
  onAnalysisComplete,
}: {
  redirectTo?: string;
  onDraftChange?: (state: UploadDraftState) => void;
  onAnalysisComplete?: (analysis: CareerAnalysis) => void;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [githubUsername, setGithubUsername] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [persona, setPersona] = useState<RecruiterPersona>("startup");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const activeIndex = useMemo(() => Math.min(intelligenceStates.length - 1, Math.floor(progress / 18)), [progress]);

  useEffect(() => {
    onDraftChange?.({
      hasFile: Boolean(file),
      hasTargetRole: Boolean(targetRole.trim()),
    });
  }, [file, onDraftChange, targetRole]);

  useEffect(() => {
    if (!isAnalyzing) return;

    const timer = window.setInterval(() => {
      setProgress((current) => Math.min(92, current + Math.random() * 9 + 4));
    }, 700);

    return () => window.clearInterval(timer);
  }, [isAnalyzing]);

  async function runAnalysis(selectedFile = file) {
    if (!selectedFile) {
      setError("Upload a PDF resume first.");
      return;
    }
    if (!targetRole.trim()) {
      setError("Enter the target role you want CareerOS to analyze.");
      return;
    }

    setError("");
    setIsAnalyzing(true);
    setProgress(8);

    const formData = new FormData();
    formData.append("resume", selectedFile);
    formData.append("githubUsername", githubUsername);
    formData.append("targetRole", targetRole);
    formData.append("jobDescription", jobDescription);
    formData.append("persona", persona);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const payload = await readApiJson<{ analysis?: CareerAnalysis }>(response);
      if (!response.ok || !payload.analysis) {
        setError(payload.error ?? "CareerOS could not analyze this resume.");
        return;
      }

      setProgress(100);
      saveLatestAnalysis(payload.analysis);
      onAnalysisComplete?.(payload.analysis);
      window.setTimeout(() => router.push(redirectTo), 450);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  const scanItems = [
    { icon: FileText, label: "Resume proof", value: file ? file.name : "PDF required", ready: Boolean(file) },
    { icon: Target, label: "Target role", value: targetRole.trim() || "Choose one role", ready: Boolean(targetRole.trim()) },
    { icon: Github, label: "GitHub signal", value: githubUsername.trim() || "Optional", ready: Boolean(githubUsername.trim()) },
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <div className="space-y-5">
        <motion.div
          whileHover={{ y: -2 }}
          className="group relative overflow-hidden rounded-2xl border border-dashed border-teal-200/30 bg-card p-6 shadow-panel"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-300 via-sky-300 to-amber-200" />
          <label className="relative block cursor-pointer">
            <input
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={(event) => {
                const selected = event.target.files?.[0] ?? null;
                setFile(selected);
                setError("");
                if (selected) clearLatestAnalysis();
              }}
            />
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-border bg-muted">
                {isAnalyzing ? (
                  <Loader2 className="h-7 w-7 animate-spin text-teal-200" />
                ) : file ? (
                  <BadgeCheck className="h-7 w-7 text-teal-200" />
                ) : (
                  <UploadCloud className="h-7 w-7 text-teal-200" />
                )}
              </div>
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-lg border border-teal-200/20 bg-teal-300/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-teal-100">
                  <ScanSearch className="h-3.5 w-3.5" />
                  ATS resume scan
                </div>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-card-foreground">
                  Get a real ATS score for this resume.
                </h1>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Upload a PDF, choose one target role, and CareerOS will score ATS keywords, resume format, proof strength, missing skills, recruiter risks, and next fixes.
                </p>
                <div className="mt-5 rounded-xl border border-border bg-muted/60 p-3">
                  <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Selected resume</div>
                  <div className="mt-1 truncate text-sm font-medium text-card-foreground">{file?.name ?? "No PDF selected yet"}</div>
                </div>
              </div>
            </div>
          </label>

          <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
            {scanItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-xl border border-border bg-muted/50 p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Icon className="h-4 w-4 text-teal-200" />
                    {item.label}
                  </div>
                  <div className="mt-2 truncate text-sm font-medium text-card-foreground">{item.value}</div>
                </div>
              );
            })}
          </div>

          <Button type="button" className="relative mt-6 w-full sm:w-auto" onClick={() => void runAnalysis()} disabled={isAnalyzing}>
            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {isAnalyzing ? "Calculating ATS score..." : "Generate ATS score"}
          </Button>
          {error ? <p className="relative mt-4 text-sm text-amber-200">{error}</p> : null}
        </motion.div>

        <IntelligenceLoading activeIndex={isAnalyzing ? activeIndex : -1} progress={isAnalyzing ? progress : 0} />
      </div>

      <div className="space-y-5">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-teal-200" />
            <div>
              <div className="font-medium text-white">Target role</div>
              <div className="text-sm text-white/45">Use one role so the feedback is specific.</div>
            </div>
          </div>
          <Input
            className="mt-4"
            placeholder="Data Scientist, Frontend Developer, SDE-1..."
            value={targetRole}
            onChange={(event) => setTargetRole(event.target.value)}
          />
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <BriefcaseBusiness className="h-5 w-5 text-teal-200" />
            <div>
              <div className="font-medium text-white">Job description</div>
              <div className="text-sm text-white/45">Optional, but it improves missing-skill accuracy.</div>
            </div>
          </div>
          <textarea
            className="mt-4 min-h-32 w-full resize-none rounded-lg border border-white/10 bg-white/[0.06] p-4 text-sm leading-6 text-white outline-none placeholder:text-white/30 focus:border-teal-200/40"
            placeholder="Paste responsibilities, required skills, and qualifications from the job post..."
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
          />
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <Github className="h-5 w-5 text-teal-200" />
            <div>
              <div className="font-medium text-white">Recruiter lens</div>
              <div className="text-sm text-white/45">Choose who should judge the profile.</div>
            </div>
          </div>
          <Input
            className="mt-4"
            placeholder="GitHub username, optional"
            value={githubUsername}
            onChange={(event) => setGithubUsername(event.target.value)}
          />
          <div className="mt-4 grid grid-cols-3 gap-2">
            {(["startup", "faang", "hr"] as RecruiterPersona[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setPersona(option)}
                className={`rounded-lg border px-3 py-2 text-xs capitalize transition ${
                  persona === option
                    ? "border-teal-200/40 bg-teal-300/15 text-white"
                    : "border-white/10 bg-white/[0.04] text-white/45 hover:text-white"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="font-medium text-white">Report you get after scan</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              "ATS score",
              "Keyword match",
              "Missing ATS keywords",
              "Recruiter rejection risks",
              "Resume fixes",
            ].map((item, index) => (
              <div key={item} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2">
                <CheckCircle2 className={`h-4 w-4 ${isAnalyzing && index <= activeIndex ? "text-teal-200" : "text-white/25"}`} />
                <span className="text-sm text-white/65">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
