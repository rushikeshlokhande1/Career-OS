"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Download, FileText, Github, Globe2, Linkedin, Loader2, Mail, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { readApiJson } from "@/lib/api-response";
import { saveCareerOSArtifact } from "@/lib/careeros-profile-store";
import type { PortfolioGeneratorResult } from "@/lib/intelligence/portfolio-generator";
import { cn } from "@/lib/utils";

export function AiPortfolioGeneratorClient() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PortfolioGeneratorResult | null>(null);
  const resumeDownloadUrl = resume ? URL.createObjectURL(resume) : "";

  async function generatePortfolio() {
    if (!/^https:\/\/(www\.)?linkedin\.com\/in\/[^/\s]+\/?$/i.test(linkedInUrl.trim())) {
      setError("Add a valid LinkedIn profile URL.");
      return;
    }
    if (!/(^https:\/\/github\.com\/[^/\s]+\/?$)|(^@?[\w-]+$)/i.test(githubUrl.trim())) {
      setError("Add a valid GitHub URL or username.");
      return;
    }
    if (!resume && resumeText.trim().length < 80) {
      setError("Upload a resume PDF or paste resume text so the portfolio stays realistic.");
      return;
    }

    setError("");
    setIsGenerating(true);
    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("email", email);
    formData.append("targetRole", targetRole);
    formData.append("linkedInUrl", linkedInUrl);
    formData.append("githubUrl", githubUrl);
    formData.append("resumeText", resumeText);
    if (resume) formData.append("resume", resume);

    try {
      const response = await fetch("/api/portfolio-generator", { method: "POST", body: formData });
      const payload = await readApiJson<{ result?: PortfolioGeneratorResult }>(response);
      if (!response.ok || !payload.result) {
        setError(payload.error ?? "Could not generate portfolio.");
        return;
      }
      setResult(payload.result);
      saveCareerOSArtifact({
        type: "portfolio",
        title: `${payload.result.hero.fullName} portfolio`,
        summary: `${payload.result.hero.role} - ${payload.result.projects.length} real GitHub projects`,
        payload: payload.result,
      });
    } catch {
      setError("Network error. Could not reach AI Portfolio Generator.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <DashboardShell active="Portfolio Generator">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#070b13] p-6 shadow-panel">
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-cyan-300/15 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-56 w-56 rounded-full bg-teal-300/10 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-lg border border-cyan-200/20 bg-cyan-300/10 px-3 py-1 text-sm text-cyan-100">
              <Globe2 className="h-4 w-4" />
              AI Portfolio Generator
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Generate a premium developer portfolio from verified GitHub and resume data.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-white/58">
              CareerOS builds only four clean sections: hero, about, projects, and contact. No fake projects, no fake achievements, no random buzzwords.
            </p>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
          <div className="space-y-6">
            <Card className="p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Sparkles className="h-4 w-4 text-cyan-200" />
                Source Material
              </div>
              <p className="mt-2 text-sm leading-6 text-white/42">
                Only real resume and GitHub data is used. Name and email are optional polish fields.
              </p>
              <div className="mt-5 space-y-3">
                <Field label="Full name">
                  <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Uses resume or GitHub name if empty" />
                </Field>
                <Field label="Email">
                  <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Optional contact email" />
                </Field>
                <Field label="Target role">
                  <Input value={targetRole} onChange={(event) => setTargetRole(event.target.value)} placeholder="AI Engineer, Full Stack Developer..." />
                </Field>
                <Field label="LinkedIn">
                  <Input value={linkedInUrl} onChange={(event) => setLinkedInUrl(event.target.value)} placeholder="https://linkedin.com/in/..." />
                </Field>
                <Field label="GitHub">
                  <Input value={githubUrl} onChange={(event) => setGithubUrl(event.target.value)} placeholder="https://github.com/..." />
                </Field>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-cyan-200/20 bg-cyan-300/[0.055] p-4 text-sm text-white/68 transition hover:border-cyan-200/40">
                  <FileText className="h-5 w-5 text-cyan-200" />
                  <span className="flex-1">{resume ? resume.name : "Upload resume PDF"}</span>
                  <input type="file" accept="application/pdf" className="sr-only" onChange={(event) => setResume(event.target.files?.[0] ?? null)} />
                </label>
                <textarea
                  value={resumeText}
                  onChange={(event) => setResumeText(event.target.value)}
                  placeholder="Or paste resume text..."
                  className="min-h-28 w-full resize-none rounded-xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white outline-none placeholder:text-white/30 focus:border-cyan-200/40"
                />
              </div>
              <Button onClick={() => void generatePortfolio()} disabled={isGenerating} className="mt-4 w-full">
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate portfolio
              </Button>
              {error ? <p className="mt-3 text-sm text-amber-200">{error}</p> : null}
              <div className="mt-4 rounded-xl border border-amber-200/15 bg-amber-200/[0.06] p-3 text-xs leading-5 text-amber-50/70">
                <div className="flex items-center gap-2 font-medium text-amber-100">
                  <ShieldCheck className="h-4 w-4" />
                  Truth guardrail
                </div>
                <p className="mt-2">Project cards are selected from real public GitHub repositories only. AI can polish wording, but it cannot create new projects.</p>
              </div>
            </Card>

            <Card className="p-5">
              <div className="text-sm font-medium text-white">Export Portfolio</div>
              <p className="mt-2 text-sm leading-6 text-white/42">Download the generated portfolio as clean static HTML or structured data.</p>
              <div className="mt-4 grid gap-2">
                <Button variant="secondary" disabled={!result} onClick={() => result && downloadText("portfolio.html", result.exports.html)}>
                  <Download className="h-4 w-4" />
                  Download portfolio
                </Button>
                <Button variant="secondary" disabled={!result} onClick={() => result && downloadText("portfolio-data.json", JSON.stringify(result.exports.data, null, 2))}>
                  <Download className="h-4 w-4" />
                  Export data
                </Button>
              </div>
            </Card>
          </div>

          {result ? <PortfolioPreview result={result} resumeUrl={resumeDownloadUrl} /> : <EmptyPreview />}
        </div>
      </div>
    </DashboardShell>
  );
}

function PortfolioPreview({ result, resumeUrl }: { result: PortfolioGeneratorResult; resumeUrl: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#05070d] shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.035] px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-300/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/80" />
        </div>
        <div className="text-xs text-white/35">live portfolio preview</div>
      </div>
      <section className="relative grid min-h-[650px] place-items-center overflow-hidden p-8 sm:p-12">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] bg-[size:56px_56px] opacity-20" />
        <div className="absolute right-10 top-10 h-72 w-72 rounded-full bg-cyan-300/15 blur-3xl" />
        <div className="absolute bottom-10 left-10 h-64 w-64 rounded-full bg-teal-300/10 blur-3xl" />
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="relative max-w-4xl text-center">
          <div className="mx-auto inline-flex rounded-full border border-cyan-200/15 bg-cyan-300/10 px-3 py-1 text-sm font-medium text-cyan-100">
            {result.hero.role}
          </div>
          <h2 className="mt-5 text-5xl font-semibold leading-none text-white sm:text-7xl">{result.hero.fullName}</h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/58">{result.hero.tagline}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <PreviewButton href={result.hero.githubUrl} icon={Github} label="GitHub" primary />
            <PreviewButton href={result.hero.linkedInUrl} icon={Linkedin} label="LinkedIn" />
            <PreviewButton href={resumeUrl || "#contact"} icon={FileText} label="Resume" />
          </div>
        </motion.div>
      </section>

      <section className="border-t border-white/10 p-6 sm:p-10">
        <GlassTitle title="About" />
        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-5 rounded-2xl border border-white/10 bg-white/[0.055] p-6 backdrop-blur">
          <p className="text-sm leading-7 text-white/64">{result.about.summary}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {result.about.skills.map((skill) => (
              <span key={skill} className="rounded-full border border-cyan-200/15 bg-cyan-300/10 px-3 py-1.5 text-xs text-cyan-50/80">
                {skill}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="border-t border-white/10 p-6 sm:p-10">
        <GlassTitle title="Projects" />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {result.projects.map((project) => (
            <motion.article
              whileHover={{ y: -4 }}
              key={project.githubUrl}
              className="group rounded-2xl border border-white/10 bg-white/[0.045] p-5 transition hover:-translate-y-1 hover:border-cyan-200/30 hover:bg-white/[0.07]"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-white">{project.name}</h3>
                <span className="text-xs text-white/35">{project.readmeSignal} README</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/56">{project.rewrittenDescription}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {project.techStack.map((item) => (
                  <span key={item} className="rounded-md bg-white/[0.07] px-2 py-1 text-[11px] text-white/55">
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-3 text-sm">
                <a className="inline-flex items-center gap-1 text-cyan-100" href={project.githubUrl} target="_blank" rel="noreferrer">
                  GitHub <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
                {project.liveDemoUrl ? (
                  <a className="inline-flex items-center gap-1 text-cyan-100" href={project.liveDemoUrl} target="_blank" rel="noreferrer">
                    Live Demo <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 p-6 sm:p-10">
        <GlassTitle title="Contact" />
        <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-wrap content-start gap-3 text-sm text-white/62">
            {result.contact.email ? <a className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2" href={`mailto:${result.contact.email}`}><Mail className="h-4 w-4" />{result.contact.email}</a> : null}
            <a className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2" href={result.contact.githubUrl} target="_blank" rel="noreferrer"><Github className="h-4 w-4" />GitHub</a>
            <a className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2" href={result.contact.linkedInUrl} target="_blank" rel="noreferrer"><Linkedin className="h-4 w-4" />LinkedIn</a>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <UserRound className="h-4 w-4 text-cyan-200" />
              Contact form
            </div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/35">Name</div>
              <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/35">Email</div>
              <div className="min-h-20 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/35">Message</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function EmptyPreview() {
  return (
    <Card className="relative grid min-h-[660px] place-items-center overflow-hidden p-8 text-center">
      <div className="absolute right-1/4 top-16 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />
      <div className="absolute bottom-16 left-1/4 h-48 w-48 rounded-full bg-teal-300/10 blur-3xl" />
      <div className="relative">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-cyan-200/20 bg-cyan-300/10">
          <Globe2 className="h-8 w-8 text-cyan-200" />
        </div>
        <h2 className="mt-5 text-3xl font-semibold text-white">Portfolio preview will appear here.</h2>
        <p className="mt-3 max-w-lg text-sm leading-6 text-white/45">
          CareerOS will use only your resume, GitHub profile, GitHub repositories, LinkedIn URL, and entered contact details.
        </p>
      </div>
    </Card>
  );
}

function PreviewButton({ href, icon: Icon, label, primary = false }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string; primary?: boolean }) {
  return (
    <a
      href={href}
      target={href === "#" ? undefined : "_blank"}
      rel="noreferrer"
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition",
        primary ? "border-cyan-200/30 bg-cyan-200 text-slate-950" : "border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </a>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.16em] text-white/35">{label}</span>
      {children}
    </label>
  );
}

function GlassTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px w-8 bg-cyan-200/50" />
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
    </div>
  );
}

function downloadText(fileName: string, text: string) {
  const blob = new Blob([text], { type: fileName.endsWith(".html") ? "text/html;charset=utf-8" : "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
