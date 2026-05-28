"use client";

import { useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Download,
  FileText,
  FileDown,
  GitBranch,
  LayoutTemplate,
  LockKeyhole,
  Loader2,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Target,
  UploadCloud,
  Wand2,
} from "lucide-react";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { readApiJson } from "@/lib/api-response";
import { saveCareerOSArtifact } from "@/lib/careeros-profile-store";
import type { JobDescriptionAnalysis, ResumeTailorResult } from "@/lib/intelligence/resume-tailor";

export function ResumeMatchClient() {
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<ResumeTailorResult | null>(null);
  const [isTailoring, setIsTailoring] = useState(false);
  const [error, setError] = useState("");

  async function runTailor() {
    if (!file && resumeText.trim().length < 80) {
      setError("Upload a resume PDF or paste your current resume content.");
      return;
    }
    if (jobDescription.trim().length < 40) {
      setError("Paste a real job description so the engine can match keywords accurately.");
      return;
    }

    setError("");
    setIsTailoring(true);
    const formData = new FormData();
    if (file) formData.append("resume", file);
    formData.append("resumeText", resumeText);
    formData.append("jobDescription", jobDescription);

    try {
      const response = await fetch("/api/resume-tailor", {
        method: "POST",
        body: formData,
      });
      const payload = await readApiJson<{ result?: ResumeTailorResult }>(response);

      if (!response.ok || !payload.result) {
        setError(payload.error ?? "Could not optimize this resume.");
        return;
      }

      setResult(payload.result);
      saveCareerOSArtifact({
        type: "resume",
        title: `${payload.result.roleDetected} resume optimization`,
        summary: `ATS ${payload.result.atsMatchScore}% - ${payload.result.missingKeywords.length} missing keywords`,
        payload: payload.result,
      });
    } catch {
      setError("Network error. Could not reach the resume optimizer.");
    } finally {
      setIsTailoring(false);
    }
  }

  return (
    <DashboardShell active="Resume Tools">
      <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">
        <Card className="relative overflow-hidden p-5 lg:p-6">
          <div className="absolute right-0 top-0 h-full w-px bg-teal-200/20" />
          <div className="relative max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-lg border border-teal-200/20 bg-teal-300/10 px-3 py-1 text-sm text-teal-100">
              <Wand2 className="h-4 w-4" />
              ATS Resume Optimization Engine
            </div>
            <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Rewrite a resume for one exact job while preserving its structure.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/58">
              CareerOS tailors the resume to the exact job, scores ATS fit, simulates recruiter risk, strengthens bullets, builds project proof, and labels every claim without inventing experience.
            </p>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="p-6">
            <SectionTitle icon={UploadCloud} title="Resume input" />
            <label className="mt-5 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.035] p-5 text-center transition hover:border-teal-200/30">
              <input
                type="file"
                accept="application/pdf"
                className="sr-only"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              <FileText className="h-8 w-8 text-teal-200" />
              <div className="mt-4 text-sm font-medium text-white">{file ? file.name : "Choose PDF resume"}</div>
              <p className="mt-2 text-xs leading-5 text-white/40">PDF upload takes priority over pasted text.</p>
            </label>

            <textarea
              value={resumeText}
              onChange={(event) => setResumeText(event.target.value)}
              placeholder="Or paste the current resume content here..."
              className="mt-4 min-h-44 w-full resize-none rounded-lg border border-white/10 bg-black/25 p-4 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-teal-200/40"
            />

            <SectionTitle icon={Target} title="Job description" className="mt-6" />
            <textarea
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              placeholder="Paste the real job description here. CareerOS will only optimize against this text."
              className="mt-5 min-h-64 w-full resize-none rounded-lg border border-white/10 bg-black/25 p-4 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-teal-200/40"
            />
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => void runTailor()} disabled={isTailoring}>
                {isTailoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Optimize resume
              </Button>
            </div>
            {error ? <p className="mt-4 text-sm text-amber-200">{error}</p> : null}
          </Card>

          <Card className="p-6">
            <SectionTitle icon={ScanSearch} title="Engine output" />
            {result ? (
              <SimpleTailorResult result={result} />
            ) : (
              <div className="mt-6 grid min-h-[520px] place-items-center rounded-lg border border-dashed border-white/15 bg-white/[0.025] p-8 text-center">
                <div>
                  <Wand2 className="mx-auto h-10 w-10 text-teal-200" />
                  <h3 className="mt-5 text-2xl font-semibold text-white">Optimization results will appear here.</h3>
                  <p className="mt-3 max-w-md text-sm leading-6 text-white/45">
                    The engine returns ATS scoring, JD intelligence, missing keywords, recruiter summary, and optimized resume content.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {result ? <DetailedTailorOutput result={result} /> : null}
      </div>
    </DashboardShell>
  );
}

function SimpleTailorResult({ result }: { result: ResumeTailorResult }) {
  const topMissing = result.missingKeywords.slice(0, 6);
  const topImprovements = result.suggestedImprovements.slice(0, 4);
  const topAdded = result.keywordsAdded.slice(0, 8);

  return (
    <div className="mt-6 space-y-5">
      <div className="rounded-xl border border-teal-200/20 bg-teal-300/10 p-5">
        <div className="space-y-4">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-teal-100/70">Optimized for</div>
            <h3 className="mt-2 text-2xl font-semibold text-white">{result.roleDetected}</h3>
            <p className="mt-2 text-sm leading-6 text-white/62">{shortenText(result.recruiterImpressionSummary, 260)}</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <CompactScore label="ATS" value={result.atsMatchScore} />
            <CompactScore label="Before" value={result.matchScoreBefore} />
            <CompactScore label="After" value={result.matchScoreAfter} />
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <MiniSummary title="Missing keywords" items={topMissing} empty="No major gaps." tone="amber" />
        <MiniSummary title="Added keywords" items={topAdded} empty="No new keywords added." tone="teal" />
        <MiniSummary title="Top fixes" items={topImprovements} empty="Resume already looks clean." tone="neutral" />
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Optimized resume preview</h3>
            <p className="mt-1 text-sm text-white/45">Same structure, cleaner wording, job-specific keywords.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => downloadOptimizedResumePdf(result)}>
              <FileDown className="h-4 w-4" />
              PDF
            </Button>
            <Button variant="secondary" onClick={() => downloadOptimizedResume(result)}>
              <Download className="h-4 w-4" />
              DOC
            </Button>
          </div>
        </div>
        <pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm leading-7 text-white/72">
          {result.optimizedResumeContent}
        </pre>
      </div>

      <details className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
        <summary className="cursor-pointer text-sm font-medium text-white">Show detailed ATS evidence</summary>
        <div className="mt-4 space-y-4">
          <AtsBreakdownPanel result={result} />
          <KeywordEvidencePanel result={result} />
        </div>
      </details>
    </div>
  );
}

function DetailedTailorOutput({ result }: { result: ResumeTailorResult }) {
  return (
    <Card className="p-6">
      <details>
        <summary className="cursor-pointer text-lg font-semibold text-white">Advanced resume comparison and recruiter notes</summary>
        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <div className="space-y-5">
            <AnalysisPanel analysis={result.jobDescriptionAnalysis} />
            <SectionAnalyzerPanel result={result} />
            <RecruiterSimulationPanel result={result} />
            <ProjectProofPanel result={result} />
            <Panel title="Truth Guardrails" items={result.honestyWarnings} tone="amber" />
          </div>
          <div className="space-y-5">
            <JobSpecificPanel tailoring={result.jobSpecificTailoring} />
            <RoleTemplatesPanel result={result} />
            {result.sections.map((section) => (
              <div key={section.heading} className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
                <h3 className="font-semibold text-white">{section.heading}</h3>
                <div className="mt-4 grid gap-4">
                  <ResumeBlock title="Original" lines={section.originalContent} />
                  <ResumeBlock title="Optimized" lines={section.tailoredContent} highlighted />
                </div>
              </div>
            ))}
          </div>
        </div>
      </details>
    </Card>
  );
}

function CompactScore({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.08] p-3 text-center shadow-sm">
      <div className="text-xs text-white/45">{label}</div>
      <div className="mt-1 text-2xl font-semibold gradient-text">{value}%</div>
    </div>
  );
}

function MiniSummary({ title, items, empty, tone }: { title: string; items: string[]; empty: string; tone: "teal" | "amber" | "neutral" }) {
  const color =
    tone === "teal"
      ? "border-teal-200/25 bg-teal-300/10 text-teal-50/80 light:border-teal-700/20 light:bg-teal-50 light:text-teal-900"
      : tone === "amber"
        ? "border-amber-200/25 bg-amber-300/10 text-amber-50/80 light:border-amber-700/20 light:bg-amber-50 light:text-amber-950"
        : "border-white/10 bg-white/[0.04] text-white/62 light:border-slate-300 light:bg-white light:text-slate-800";

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.length ? (
          items.map((item) => (
            <span key={item} className={`rounded-lg border px-2.5 py-1 text-xs ${color}`}>
              {item}
            </span>
          ))
        ) : (
          <span className="text-sm text-white/38">{empty}</span>
        )}
      </div>
    </div>
  );
}

function shortenText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3).trim()}...` : value;
}

function downloadOptimizedResume(result: ResumeTailorResult) {
  const fileName = `${slugify(result.roleDetected || "optimized-resume")}-resume.doc`;
  const html = createResumeDocument(result);
  const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function downloadOptimizedResumePdf(result: ResumeTailorResult) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 44;
  const top = 42;
  const maxWidth = 507;
  const pageBottom = 800;
  let y = top;
  const exportSections = getExportSections(result);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(17);
  pdf.setTextColor(17, 24, 39);
  pdf.text(result.roleDetected || "Optimized Resume", marginX, y, { maxWidth });
  y += 16;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(75, 85, 99);
  pdf.text(result.tailoredHeadline || "ATS-optimized resume", marginX, y, { maxWidth });
  y += 15;
  pdf.setDrawColor(15, 118, 110);
  pdf.setLineWidth(1.1);
  pdf.line(marginX, y, marginX + maxWidth, y);
  y += 18;

  for (const section of exportSections) {
    if (y > 748) {
      pdf.addPage();
      y = top;
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(15, 23, 42);
    pdf.text(cleanResumeHeading(section.heading), marginX, y);
    y += 5;
    pdf.setDrawColor(15, 118, 110);
    pdf.setLineWidth(0.65);
    pdf.line(marginX, y, marginX + maxWidth, y);
    y += 13;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    pdf.setTextColor(31, 41, 55);
    for (const rawLine of section.tailoredContent) {
      const cleanLine = rawLine.trim();
      if (!cleanLine) continue;
      const isBullet = /^[-*]\s+/.test(cleanLine);
      const text = cleanLine.replace(/^[-*]\s+/, "");
      const indent = isBullet ? 12 : 0;
      const wrapped = pdf.splitTextToSize(text, maxWidth - indent);
      if (y + wrapped.length * 12 > pageBottom) {
        pdf.addPage();
        y = top;
      }
      if (isBullet) {
        pdf.text("-", marginX, y);
      }
      pdf.text(wrapped, marginX + indent, y);
      y += wrapped.length * 12 + 4;
    }
    y += 8;
  }

  pdf.save(`${slugify(result.roleDetected || "optimized-resume")}-resume.pdf`);
}

function createResumeDocument(result: ResumeTailorResult) {
  const exportSections = getExportSections(result);
  const body = exportSections
    .map((section, index) => {
      const lines = section.tailoredContent.map((line) => renderResumeLine(line)).join("");
      return `
        <section class="resume-section ${index === 0 ? "first-section" : ""}">
          <h2>${escapeHtml(cleanResumeHeading(section.heading))}</h2>
          <div>${lines}</div>
        </section>
      `;
    })
    .join("");
  const role = result.roleDetected || "Optimized Resume";
  const headline = result.tailoredHeadline || `${role} resume optimized for ATS and recruiter review`;

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(result.roleDetected)} Resume</title>
    <style>
      @page {
        size: A4;
        margin: 0.52in 0.58in;
      }

      body {
        margin: 0;
        color: #1f2937;
        background: #ffffff;
        font-family: "Aptos", "Calibri", "Arial", sans-serif;
        font-size: 10.2pt;
        line-height: 1.32;
      }

      .resume {
        width: 100%;
      }

      .resume-title {
        margin: 0;
        color: #111827;
        font-size: 18pt;
        font-weight: 700;
        line-height: 1.05;
      }

      .resume-subtitle {
        margin: 4pt 0 8pt;
        color: #4b5563;
        font-size: 9.5pt;
      }

      .top-rule {
        margin: 0 0 12pt;
        border: 0;
        border-top: 1.4pt solid #0f766e;
      }

      .resume-section {
        margin: 0 0 10pt;
        page-break-inside: avoid;
      }

      .resume-section h2 {
        margin: 0 0 5pt;
        padding-bottom: 3pt;
        border-bottom: 0.8pt solid #0f766e;
        color: #0f172a;
        font-size: 10.5pt;
        font-weight: 700;
        letter-spacing: 0.4pt;
        text-transform: uppercase;
      }

      p {
        margin: 0 0 3.5pt;
      }

      ul {
        margin: 0 0 4pt 14pt;
        padding: 0;
      }

      li {
        margin: 0 0 3.2pt;
        padding-left: 1pt;
      }

      .skill-line {
        color: #1f2937;
      }

      .resume-line-strong {
        color: #111827;
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <main class="resume">
      <h1 class="resume-title">${escapeHtml(role)}</h1>
      <p class="resume-subtitle">${escapeHtml(headline)}</p>
      <hr class="top-rule" />
      ${body}
    </main>
  </body>
</html>`;
}

function renderResumeLine(line: string) {
  const cleanLine = line.trim();
  if (!cleanLine) return "";
  const escaped = escapeHtml(cleanLine);
  if (/^[-*]\s+/.test(cleanLine)) {
    return `<ul><li>${escaped.replace(/^[-*]\s+/, "")}</li></ul>`;
  }
  if (isResumeRoleOrContactLine(cleanLine)) {
    return `<p class="resume-line-strong">${escaped}</p>`;
  }
  if (cleanLine.includes(" | ") || cleanLine.includes(",")) {
    return `<p class="skill-line">${escaped}</p>`;
  }
  return `<p>${escaped}</p>`;
}

function getExportSections(result: ResumeTailorResult) {
  return result.sections
    .map((section) => ({
      ...section,
      heading: cleanResumeHeading(section.heading),
      tailoredContent: section.tailoredContent
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => !/^optimized resume content$/i.test(line)),
    }))
    .filter((section) => section.tailoredContent.length);
}

function cleanResumeHeading(value: string) {
  return value
    .replace(/\s*[/|]\s*summary/gi, "")
    .replace(/^header$/i, "Profile")
    .replace(/^header\s*$/i, "Profile")
    .trim() || "Profile";
}

function isResumeRoleOrContactLine(value: string) {
  return /^(linkedin|github|portfolio|email|phone)\b/i.test(value) || /linkedin\.com|github\.com|@/.test(value);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "optimized";
}

function SectionTitle({
  icon: Icon,
  title,
  className = "",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Icon className="h-5 w-5 text-teal-200" />
      <h2 className="text-xl font-semibold text-white">{title}</h2>
    </div>
  );
}

function AnalysisPanel({ analysis }: { analysis: JobDescriptionAnalysis }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-white">
        <CheckCircle2 className="h-4 w-4 text-teal-200" />
        Job Description Analysis
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <MiniList title="Required Skills" items={analysis.requiredSkills} />
        <MiniList title="Tools" items={analysis.toolsAndTechnologies} />
        <MiniList title="Hidden Keywords" items={analysis.hiddenKeywords} />
        <MiniList title="Industry Language" items={analysis.industryLanguage} />
      </div>
      <div className="mt-4 grid gap-3">
        <Insight label="Seniority" value={analysis.seniorityExpectation} />
        <Insight label="Recruiter Intent" value={analysis.recruiterIntent} />
      </div>
    </div>
  );
}

function AtsBreakdownPanel({ result }: { result: ResumeTailorResult }) {
  const riskColor =
    result.atsBreakdown.recruiterRiskLevel === "Low"
      ? "border-teal-200/15 bg-teal-300/10 text-teal-50/80 light:border-teal-700/20 light:bg-teal-50 light:text-teal-900"
      : result.atsBreakdown.recruiterRiskLevel === "Medium"
        ? "border-amber-200/15 bg-amber-300/10 text-amber-50/80 light:border-amber-700/20 light:bg-amber-50 light:text-amber-950"
        : "border-red-300/20 bg-red-400/10 text-red-50/80 light:border-red-700/20 light:bg-red-50 light:text-red-950";

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-white">
        <BarChart3 className="h-4 w-4 text-teal-200" />
        ATS Match Score
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Insight label="Keyword Match" value={`${result.atsBreakdown.keywordMatch}% aligned to the pasted job description`} />
        <div className={`rounded-lg border p-3 ${riskColor}`}>
          <div className="text-xs uppercase tracking-[0.2em] text-white/45">Recruiter Risk</div>
          <p className="mt-2 text-sm font-medium">{result.atsBreakdown.recruiterRiskLevel}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <MiniList title="Required Skills Found" items={result.atsBreakdown.requiredSkillsFound} />
        <MiniList title="Missing Required Skills" items={result.atsBreakdown.missingRequiredSkills} />
      </div>
      <div className="mt-4">
        <MiniList title="Needs Proof" items={result.atsBreakdown.needsProofKeywords} />
      </div>
      <div className="mt-4">
        <MiniList title="Weak Sections" items={result.atsBreakdown.weakSections} />
      </div>
    </div>
  );
}

function KeywordEvidencePanel({ result }: { result: ResumeTailorResult }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-white">
        <ShieldCheck className="h-4 w-4 text-teal-200" />
        Resume vs Job Evidence
      </div>
      <div className="mt-4 space-y-3">
        {result.keywordEvidence.slice(0, 10).map((item) => (
          <div key={`${item.keyword}-${item.status}`} className="rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="font-medium text-white">{item.keyword}</div>
              <ClaimBadge status={item.status} />
            </div>
            <p className="mt-2 text-sm leading-6 text-white/58">{item.evidence}</p>
            <p className="mt-2 text-xs leading-5 text-white/42">{item.recommendation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionAnalyzerPanel({ result }: { result: ResumeTailorResult }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-white">
        <ShieldCheck className="h-4 w-4 text-teal-200" />
        Resume Sections Analyzer
      </div>
      <div className="mt-4 grid gap-3">
        {result.sectionAnalysis.map((section) => (
          <div key={section.section} className="rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-white">{section.section}</div>
                <p className="mt-1 text-xs text-white/45">{section.verdict}</p>
              </div>
              <div className="text-lg font-semibold gradient-text">{section.score}%</div>
            </div>
            <Progress value={section.score} className="mt-3" />
            <div className="mt-3 flex flex-wrap gap-2">
              {section.fixes.map((fix) => (
                <span key={fix} className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/58">
                  {fix}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function JobSpecificPanel({ tailoring }: { tailoring: ResumeTailorResult["jobSpecificTailoring"] }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-white">
        <Wand2 className="h-4 w-4 text-teal-200" />
        Job-Specific Tailoring
      </div>

      <div className="mt-4 rounded-lg border border-teal-200/15 bg-teal-300/10 p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-white/35">Tailored Summary</div>
        <p className="mt-3 text-sm leading-6 text-white/72">{tailoring.tailoredSummary.rewritten}</p>
        <Guardrail rewrite={tailoring.tailoredSummary} />
      </div>

      <div className="mt-4">
        <div className="text-xs uppercase tracking-[0.2em] text-white/35">Reordered Skills</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {tailoring.tailoredSkills.map((skill) => (
            <span key={skill} className="rounded-lg border border-teal-200/15 bg-teal-300/10 px-2.5 py-1 text-xs text-teal-50/80 light:border-teal-700/20 light:bg-teal-50 light:text-teal-900">
              {skill}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-white/45">{tailoring.skillRationale}</p>
      </div>

      <div className="mt-5 space-y-3">
        <div className="text-xs uppercase tracking-[0.2em] text-white/35">Rewritten Bullets</div>
        {tailoring.tailoredBullets.length ? (
          tailoring.tailoredBullets.map((rewrite, index) => (
            <div key={`${rewrite.original}-${index}`} className="rounded-lg border border-white/10 bg-black/20 p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <RewriteBlock title="Original" text={rewrite.original} />
                <RewriteBlock title="Tailored" text={rewrite.rewritten} highlighted />
              </div>
              <Guardrail rewrite={rewrite} />
            </div>
          ))
        ) : (
          <p className="text-sm text-white/40">No rewriteable bullets were found. Paste more project or experience detail for bullet-level tailoring.</p>
        )}
      </div>
    </div>
  );
}

function RewriteBlock({ title, text, highlighted = false }: { title: string; text: string; highlighted?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${highlighted ? "border-teal-200/15 bg-teal-300/10" : "border-white/10 bg-white/[0.035]"}`}>
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">{title}</div>
      <p className="mt-2 text-sm leading-6 text-white/65">{text}</p>
    </div>
  );
}

function Guardrail({ rewrite }: { rewrite: ResumeTailorResult["jobSpecificTailoring"]["tailoredSummary"] }) {
  const label = rewrite.supportedByResume ? "Supported by resume" : rewrite.warning === "Do not claim unless true" ? "Do not claim unless true" : "Needs proof";
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/45">
      <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 ${rewrite.supportedByResume ? "border-teal-200/15 bg-teal-300/10 text-teal-50/75 light:border-teal-700/20 light:bg-teal-50 light:text-teal-900" : "border-amber-200/20 bg-amber-300/10 text-amber-50/80 light:border-amber-700/20 light:bg-amber-50 light:text-amber-950"}`}>
        {rewrite.supportedByResume ? <CheckCircle2 className="h-3.5 w-3.5" /> : <LockKeyhole className="h-3.5 w-3.5" />}
        {label}
      </span>
      <span>{rewrite.evidence}</span>
      {rewrite.warning ? <span className="text-amber-100">{rewrite.warning}</span> : null}
    </div>
  );
}

function ClaimBadge({ status }: { status: "Supported by resume" | "Needs proof" | "Missing" }) {
  const className =
    status === "Supported by resume"
      ? "border-teal-200/15 bg-teal-300/10 text-teal-50/80 light:border-teal-700/20 light:bg-teal-50 light:text-teal-900"
      : status === "Needs proof"
        ? "border-amber-200/15 bg-amber-300/10 text-amber-50/80 light:border-amber-700/20 light:bg-amber-50 light:text-amber-950"
        : "border-red-300/20 bg-red-400/10 text-red-50/80 light:border-red-700/20 light:bg-red-50 light:text-red-950";

  return (
    <span className={`inline-flex w-fit items-center gap-1 rounded-lg border px-2 py-1 text-xs ${className}`}>
      {status === "Supported by resume" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <LockKeyhole className="h-3.5 w-3.5" />}
      {status}
    </span>
  );
}

function RecruiterSimulationPanel({ result }: { result: ResumeTailorResult }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-white">
        <ScanSearch className="h-4 w-4 text-teal-200" />
        Recruiter Simulation
      </div>
      <p className="mt-3 text-sm leading-6 text-white/62">{result.recruiterSimulation.thirtySecondRead}</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <MiniList title="A Recruiter May Reject Because" items={result.recruiterSimulation.rejectionRisks} />
        <MiniList title="Fixes" items={result.recruiterSimulation.fixes} />
      </div>
    </div>
  );
}

function ProjectProofPanel({ result }: { result: ResumeTailorResult }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-white">
        <GitBranch className="h-4 w-4 text-teal-200" />
        Project Proof Builder
      </div>
      <div className="mt-4 space-y-3">
        {result.projectProofBuilder.length ? (
          result.projectProofBuilder.map((project) => (
            <div key={`${project.originalTitle}-${project.improvedTitle}`} className="rounded-lg border border-white/10 bg-black/20 p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <RewriteBlock title="Current Title" text={project.originalTitle} />
                <RewriteBlock title="Stronger Title" text={project.improvedTitle} highlighted />
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <MiniList title="Tech Stack Clarity" items={project.techStackClarity} />
                <MiniList title="GitHub/Demo Checklist" items={project.linkChecklist} />
              </div>
              <div className="mt-4 space-y-3">
                {project.impactBullets.map((rewrite, index) => (
                  <div key={`${rewrite.rewritten}-${index}`} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                    <RewriteBlock title="Impact Bullet" text={rewrite.rewritten} highlighted={rewrite.supportedByResume} />
                    <Guardrail rewrite={rewrite} />
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-white/40">Add project details to generate proof-focused titles, tech stacks, impact bullets, and GitHub checks.</p>
        )}
      </div>
    </div>
  );
}

function RoleTemplatesPanel({ result }: { result: ResumeTailorResult }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-white">
        <LayoutTemplate className="h-4 w-4 text-teal-200" />
        Role-Based Templates
      </div>
      <div className="mt-4 grid gap-3">
        {result.roleTemplates.map((template) => (
          <div key={template.role} className="rounded-lg border border-white/10 bg-black/20 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-semibold text-white">{template.role}</h3>
                <p className="mt-1 text-sm text-white/55">{template.headline}</p>
              </div>
              {template.role === result.roleDetected ? (
                <span className="rounded-lg border border-teal-200/15 bg-teal-300/10 px-2.5 py-1 text-xs text-teal-50/80 light:border-teal-700/20 light:bg-teal-50 light:text-teal-900">Detected fit</span>
              ) : null}
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <MiniList title="Section Order" items={template.sectionOrder} />
              <MiniList title="Priority Skills" items={template.prioritySkills} />
            </div>
            <p className="mt-3 text-xs leading-5 text-white/45">{template.bulletStyle}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.2em] text-white/35">{title}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.length ? (
          items.map((item) => (
            <span key={item} className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-white/62">
              {item}
            </span>
          ))
        ) : (
          <span className="text-sm text-white/35">None detected.</span>
        )}
      </div>
    </div>
  );
}

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="text-xs uppercase tracking-[0.2em] text-white/35">{label}</div>
      <p className="mt-2 text-sm leading-6 text-white/62">{value}</p>
    </div>
  );
}

function Panel({ title, items, tone }: { title: string; items: string[]; tone: "teal" | "amber" | "neutral" }) {
  const color =
    tone === "teal"
      ? "bg-teal-300/10 text-teal-50/75 border-teal-200/15 light:border-teal-700/20 light:bg-teal-50 light:text-teal-900"
      : tone === "amber"
        ? "bg-amber-300/10 text-amber-50/75 border-amber-200/15 light:border-amber-700/20 light:bg-amber-50 light:text-amber-950"
        : "bg-white/[0.04] text-white/60 border-white/10 light:border-slate-300 light:bg-white light:text-slate-800";
  const Icon = tone === "amber" ? AlertTriangle : CheckCircle2;

  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-medium text-white">
        <Icon className="h-4 w-4 text-teal-200" />
        {title}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.length ? (
          items.map((item) => (
            <span key={item} className={`rounded-lg border px-3 py-1.5 text-xs ${color}`}>
              {item}
            </span>
          ))
        ) : (
          <span className="text-sm text-white/35">Nothing critical found.</span>
        )}
      </div>
    </div>
  );
}

function ResumeBlock({ title, lines, highlighted = false }: { title: string; lines: string[]; highlighted?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${highlighted ? "border-teal-200/15 bg-teal-300/10" : "border-white/10 bg-black/20"}`}>
      <div className="text-xs uppercase tracking-[0.2em] text-white/35">{title}</div>
      <div className="mt-3 space-y-2">
        {lines.map((line, index) => (
          <p key={`${line}-${index}`} className="text-sm leading-6 text-white/62">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
