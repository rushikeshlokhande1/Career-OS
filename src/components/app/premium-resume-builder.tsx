"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useForm, useWatch } from "react-hook-form";
import {
  ArrowDown,
  ArrowUp,
  Download,
  GripVertical,
  Layers3,
  Palette,
  Sparkles,
  Wand2,
} from "lucide-react";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type ResumeForm = {
  fullName: string;
  role: string;
  targetRole: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  summary: string;
  languages: string;
  frameworks: string;
  aiMl: string;
  databases: string;
  tools: string;
  cloud: string;
  company: string;
  experienceRole: string;
  duration: string;
  experienceBullets: string;
  projectTitle: string;
  projectStack: string;
  projectBullets: string;
  university: string;
  degree: string;
  year: string;
  gpa: string;
  certifications: string;
  achievements: string;
  interests: string;
};

type SectionKey = "summary" | "skills" | "experience" | "projects" | "education" | "certifications" | "achievements";

const defaultValues: ResumeForm = {
  fullName: "Rushi Sharma",
  role: "AI Engineer",
  targetRole: "AI Engineer",
  email: "rushi@email.com",
  phone: "+91 98765 43210",
  location: "India",
  linkedin: "linkedin.com/in/rushi",
  github: "github.com/rushi",
  portfolio: "rushi.dev",
  summary:
    "AI-focused software engineer building production-ready web applications, intelligent resume systems, and data-driven user experiences with strong ownership across frontend, APIs, and applied AI workflows.",
  languages: "TypeScript, JavaScript, Python, SQL",
  frameworks: "React, Next.js, Node.js, Tailwind CSS",
  aiMl: "OpenAI API, LLM workflows, Prompt Engineering, RAG fundamentals",
  databases: "PostgreSQL, MongoDB, Supabase",
  tools: "Git, GitHub, REST APIs, Vercel, Figma",
  cloud: "AWS basics, Vercel, Supabase",
  company: "CareerOS AI",
  experienceRole: "Full Stack AI Developer",
  duration: "2025 - Present",
  experienceBullets:
    "Built an AI-powered career platform with resume analysis, ATS scoring, and job-matching workflows.\nImproved recruiter scan quality by converting weak resume content into role-aligned, evidence-based bullets.\nIntegrated OpenAI-powered analysis with Next.js APIs and clean dashboard interfaces.",
  projectTitle: "AI Resume Optimization Engine",
  projectStack: "Next.js, TypeScript, OpenAI API, Tailwind CSS, Supabase",
  projectBullets:
    "Designed a resume-to-job matching engine that identifies supported skills, missing keywords, and recruiter risk.\nGenerated ATS-friendly optimized resumes with proof-aware guardrails to avoid fake claims.\nBuilt a polished live dashboard for score breakdowns, section analysis, and PDF export.",
  university: "Your University",
  degree: "B.Tech in Computer Science",
  year: "2026",
  gpa: "",
  certifications: "OpenAI API Projects, Full Stack Web Development, Data Analytics Foundations",
  achievements: "Built multiple AI career tools, shipped production-style Next.js apps, maintained GitHub project portfolio",
  interests: "Applied AI, startup products, developer tools",
};

const initialOrder: SectionKey[] = ["summary", "skills", "experience", "projects", "education", "certifications", "achievements"];

const sectionLabels: Record<SectionKey, string> = {
  summary: "Professional Summary",
  skills: "Technical Skills",
  experience: "Experience",
  projects: "Projects",
  education: "Education",
  certifications: "Certifications",
  achievements: "Achievements & Interests",
};

export function PremiumResumeBuilder() {
  const resumeRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [sectionOrder, setSectionOrder] = useState<SectionKey[]>(initialOrder);
  const [dragging, setDragging] = useState<SectionKey | null>(null);
  const { register, control, setValue } = useForm<ResumeForm>({ defaultValues });
  const values = useWatch({ control }) as ResumeForm;
  const score = useMemo(() => calculateResumeScore(values), [values]);
  const suggestions = useMemo(() => buildSuggestions(values), [values]);

  function generateSummary() {
    const skills = compact([values.languages, values.frameworks, values.aiMl]).join(", ");
    setValue(
      "summary",
      `${values.role || values.targetRole} with hands-on experience across ${skills || "modern software and AI systems"}. Builds polished, ATS-ready products with strong focus on measurable impact, clean implementation, and startup-speed execution for ${values.targetRole || "AI/Tech"} roles.`,
      { shouldDirty: true },
    );
  }

  function enhanceBullets(field: "experienceBullets" | "projectBullets") {
    const source = values[field] || "";
    const enhanced = lines(source)
      .map((line) => enhanceBullet(line, values.targetRole || values.role))
      .join("\n");
    setValue(field, enhanced, { shouldDirty: true });
  }

  function recommendSkills() {
    setValue("aiMl", mergeList(values.aiMl, "OpenAI API, LLM Evaluation, RAG, Vector Search"), { shouldDirty: true });
    setValue("tools", mergeList(values.tools, "GitHub Actions, API Documentation, Agile Collaboration"), { shouldDirty: true });
    setValue("cloud", mergeList(values.cloud, "Vercel, AWS, Supabase"), { shouldDirty: true });
  }

  async function exportPdf() {
    if (!resumeRef.current) return;
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
    const canvas = await html2canvas(resumeRef.current, {
      scale: 2.5,
      backgroundColor: theme === "light" ? "#ffffff" : "#0f172a",
      useCORS: true,
    });
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
    pdf.save(`${slugify(values.fullName || "premium-tech-resume")}.pdf`);
  }

  function moveSection(section: SectionKey, direction: -1 | 1) {
    const index = sectionOrder.indexOf(section);
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= sectionOrder.length) return;
    const next = [...sectionOrder];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setSectionOrder(next);
  }

  function dropSection(target: SectionKey) {
    if (!dragging || dragging === target) return;
    const next = sectionOrder.filter((section) => section !== dragging);
    next.splice(next.indexOf(target), 0, dragging);
    setSectionOrder(next);
    setDragging(null);
  }

  return (
    <DashboardShell active="Resume Builder">
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
          }

          aside,
          main > div:first-child {
            display: none !important;
          }

          .print\\:shadow-none {
            box-shadow: none !important;
          }
        }
      `}</style>
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <div className="space-y-5">
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-white/45">Premium AI/Tech builder</p>
                  <h1 className="mt-1 text-2xl font-semibold text-white">One-page resume</h1>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-semibold gradient-text">{score}%</div>
                  <p className="text-xs text-white/40">Resume score</p>
                </div>
              </div>
              <Progress value={score} className="mt-4" />
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button onClick={generateSummary} size="sm">
                  <Sparkles className="h-4 w-4" />
                  Summary
                </Button>
                <Button onClick={recommendSkills} size="sm" variant="secondary">
                  <Wand2 className="h-4 w-4" />
                  Skills
                </Button>
              </div>
            </Card>

            <Card className="p-5">
              <PanelTitle icon={Palette} title="Export Theme" />
              <div className="mt-4 grid grid-cols-2 gap-2">
                {(["light", "dark"] as const).map((item) => (
                  <button
                    key={item}
                    onClick={() => setTheme(item)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm capitalize transition",
                      theme === item ? "border-teal-200/40 bg-teal-300/15 text-white" : "border-white/10 bg-white/[0.04] text-white/55",
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <Button onClick={() => void exportPdf()} className="mt-4 w-full">
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
            </Card>

            <Card className="p-5">
              <PanelTitle icon={Layers3} title="Section Order" />
              <div className="mt-4 space-y-2">
                {sectionOrder.map((section) => (
                  <div
                    key={section}
                    draggable
                    onDragStart={() => setDragging(section)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => dropSection(section)}
                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] p-2 text-sm text-white/70"
                  >
                    <GripVertical className="h-4 w-4 text-white/35" />
                    <span className="flex-1">{sectionLabels[section]}</span>
                    <button aria-label="Move up" onClick={() => moveSection(section, -1)} className="rounded-md p-1 hover:bg-white/10">
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button aria-label="Move down" onClick={() => moveSection(section, 1)} className="rounded-md p-1 hover:bg-white/10">
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            <EditorPanel register={register} onEnhanceExperience={() => enhanceBullets("experienceBullets")} onEnhanceProjects={() => enhanceBullets("projectBullets")} />

            <Card className="p-5">
              <PanelTitle icon={Sparkles} title="AI Improvements" />
              <div className="mt-4 space-y-2">
                {suggestions.map((suggestion) => (
                  <p key={suggestion} className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white/60">
                    {suggestion}
                  </p>
                ))}
              </div>
            </Card>
          </div>

          <div className="min-w-0 xl:sticky xl:top-24 xl:self-start">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              <div className="max-w-full overflow-x-auto overflow-y-hidden rounded-xl border border-white/10 bg-white/[0.04] p-3 sm:p-6">
                <ResumePreview refEl={resumeRef} values={values} theme={theme} sectionOrder={sectionOrder} />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function EditorPanel({
  register,
  onEnhanceExperience,
  onEnhanceProjects,
}: {
  register: ReturnType<typeof useForm<ResumeForm>>["register"];
  onEnhanceExperience: () => void;
  onEnhanceProjects: () => void;
}) {
  return (
    <Card className="p-5">
      <div className="space-y-5">
        <EditorSection title="Header">
          <Input {...register("fullName")} placeholder="Full name" />
          <Input {...register("role")} placeholder="Role title" />
          <Input {...register("targetRole")} placeholder="Target role" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input {...register("email")} placeholder="Email" />
            <Input {...register("phone")} placeholder="Phone" />
          </div>
          <Input {...register("location")} placeholder="Location" />
          <Input {...register("linkedin")} placeholder="LinkedIn" />
          <Input {...register("github")} placeholder="GitHub" />
          <Input {...register("portfolio")} placeholder="Portfolio" />
        </EditorSection>

        <EditorSection title="Summary">
          <Textarea {...register("summary")} rows={5} placeholder="Professional summary" />
        </EditorSection>

        <EditorSection title="Technical Skills">
          <Input {...register("languages")} placeholder="Languages" />
          <Input {...register("frameworks")} placeholder="Frameworks" />
          <Input {...register("aiMl")} placeholder="AI/ML" />
          <Input {...register("databases")} placeholder="Databases" />
          <Input {...register("tools")} placeholder="Tools" />
          <Input {...register("cloud")} placeholder="Cloud" />
        </EditorSection>

        <EditorSection title="Experience">
          <Input {...register("company")} placeholder="Company" />
          <Input {...register("experienceRole")} placeholder="Role" />
          <Input {...register("duration")} placeholder="Duration" />
          <Textarea {...register("experienceBullets")} rows={6} placeholder="Achievement bullets, one per line" />
          <Button type="button" variant="secondary" size="sm" onClick={onEnhanceExperience}>
            <Wand2 className="h-4 w-4" />
            Enhance bullets
          </Button>
        </EditorSection>

        <EditorSection title="Projects">
          <Input {...register("projectTitle")} placeholder="Project title" />
          <Input {...register("projectStack")} placeholder="Tech stack" />
          <Textarea {...register("projectBullets")} rows={5} placeholder="Project achievements, one per line" />
          <Button type="button" variant="secondary" size="sm" onClick={onEnhanceProjects}>
            <Wand2 className="h-4 w-4" />
            Enhance project
          </Button>
        </EditorSection>

        <EditorSection title="Education & Extras">
          <Input {...register("university")} placeholder="University" />
          <Input {...register("degree")} placeholder="Degree" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input {...register("year")} placeholder="Year" />
            <Input {...register("gpa")} placeholder="GPA optional" />
          </div>
          <Textarea {...register("certifications")} rows={3} placeholder="Certifications" />
          <Textarea {...register("achievements")} rows={3} placeholder="Achievements" />
          <Input {...register("interests")} placeholder="Professional interests" />
        </EditorSection>
      </div>
    </Card>
  );
}

function ResumePreview({
  refEl,
  values,
  theme,
  sectionOrder,
}: {
  refEl: React.RefObject<HTMLDivElement | null>;
  values: ResumeForm;
  theme: "light" | "dark";
  sectionOrder: SectionKey[];
}) {
  const dark = theme === "dark";
  return (
    <div
      ref={refEl}
      className={cn(
        "mx-auto h-[1123px] w-[794px] max-w-none overflow-hidden p-[46px] font-sans shadow-2xl print:shadow-none",
        dark ? "bg-slate-950 text-slate-100" : "bg-white text-slate-900",
      )}
    >
      <header className="border-b pb-4" style={{ borderColor: dark ? "#334155" : "#d1d5db" }}>
        <div className="flex items-start justify-between gap-8">
          <div>
            <h2 className="text-[30px] font-semibold leading-none tracking-normal">{values.fullName}</h2>
            <p className={cn("mt-2 text-[13px] font-medium", dark ? "text-cyan-200" : "text-teal-700")}>{values.role}</p>
          </div>
          <div className={cn("max-w-[310px] text-right text-[9.5px] leading-[1.55]", dark ? "text-slate-300" : "text-slate-600")}>
            {compact([values.email, values.phone, values.location]).join(" | ")}
            <br />
            {compact([values.linkedin, values.github, values.portfolio]).join(" | ")}
          </div>
        </div>
      </header>

      <main className="mt-5 space-y-4">
        {sectionOrder.map((section) => (
          <PreviewSection key={section} section={section} values={values} dark={dark} />
        ))}
      </main>
    </div>
  );
}

function PreviewSection({ section, values, dark }: { section: SectionKey; values: ResumeForm; dark: boolean }) {
  const border = dark ? "border-slate-700" : "border-slate-300";
  const muted = dark ? "text-slate-300" : "text-slate-600";

  if (section === "summary") {
    return (
      <ResumeSection title="Professional Summary" border={border}>
        <p className={cn("text-[10.5px] leading-[1.55]", muted)}>{values.summary}</p>
      </ResumeSection>
    );
  }

  if (section === "skills") {
    return (
      <ResumeSection title="Technical Skills" border={border}>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-[10px] leading-[1.35]">
          <SkillLine label="Languages" value={values.languages} />
          <SkillLine label="Frameworks" value={values.frameworks} />
          <SkillLine label="AI/ML" value={values.aiMl} />
          <SkillLine label="Databases" value={values.databases} />
          <SkillLine label="Tools" value={values.tools} />
          <SkillLine label="Cloud" value={values.cloud} />
        </div>
      </ResumeSection>
    );
  }

  if (section === "experience") {
    return (
      <ResumeSection title="Experience" border={border}>
        <div className="flex items-start justify-between gap-6">
          <div>
            <h3 className="text-[12px] font-semibold">{values.experienceRole}</h3>
            <p className={cn("text-[10px]", muted)}>{values.company}</p>
          </div>
          <p className={cn("text-[9.5px]", muted)}>{values.duration}</p>
        </div>
        <BulletList items={lines(values.experienceBullets)} />
      </ResumeSection>
    );
  }

  if (section === "projects") {
    return (
      <ResumeSection title="Projects" border={border}>
        <div className="flex items-start justify-between gap-6">
          <h3 className="text-[12px] font-semibold">{values.projectTitle}</h3>
          <p className={cn("max-w-[330px] text-right text-[9.5px]", muted)}>{values.projectStack}</p>
        </div>
        <BulletList items={lines(values.projectBullets)} />
      </ResumeSection>
    );
  }

  if (section === "education") {
    return (
      <ResumeSection title="Education" border={border}>
        <div className="flex items-start justify-between gap-6 text-[10.5px]">
          <div>
            <p className="font-semibold">{values.degree}</p>
            <p className={muted}>{values.university}</p>
          </div>
          <p className={muted}>{compact([values.year, values.gpa ? `GPA: ${values.gpa}` : ""]).join(" | ")}</p>
        </div>
      </ResumeSection>
    );
  }

  if (section === "certifications") {
    return (
      <ResumeSection title="Certifications" border={border}>
        <p className={cn("text-[10.5px] leading-[1.45]", muted)}>{values.certifications}</p>
      </ResumeSection>
    );
  }

  return (
    <ResumeSection title="Achievements & Interests" border={border}>
      <BulletList items={[...lines(values.achievements), values.interests].filter(Boolean)} />
    </ResumeSection>
  );
}

function ResumeSection({ title, border, children }: { title: string; border: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className={cn("mb-2 border-b pb-1 text-[11px] font-semibold uppercase tracking-normal", border)}>{title}</h3>
      {children}
    </section>
  );
}

function SkillLine({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="font-semibold">{label}: </span>
      <span>{value}</span>
    </p>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 list-disc space-y-1 pl-4 text-[10.2px] leading-[1.42]">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function PanelTitle({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>; title: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-white">
      <Icon className="h-4 w-4 text-teal-200" />
      {title}
    </div>
  );
}

function EditorSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-white">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full resize-none rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/35 focus:border-teal-300/50 focus:ring-2 focus:ring-teal-300/20",
        className,
      )}
      {...props}
    />
  );
}

function calculateResumeScore(values: ResumeForm) {
  const required = [
    values.fullName,
    values.role,
    values.email,
    values.summary,
    values.languages,
    values.frameworks,
    values.experienceBullets,
    values.projectBullets,
    values.degree,
    values.university,
  ];
  const filled = required.filter((item) => String(item ?? "").trim().length > 12).length;
  const bulletCount = lines(values.experienceBullets).length + lines(values.projectBullets).length;
  const links = [values.linkedin, values.github, values.portfolio].filter(Boolean).length;
  const aiSignals = compact([values.aiMl, values.tools, values.cloud]).join(" ").match(/ai|openai|llm|rag|python|api|cloud|aws|vercel/gi)?.length ?? 0;
  return Math.min(98, Math.round(42 + filled * 4.5 + Math.min(18, bulletCount * 3) + links * 3 + Math.min(11, aiSignals * 1.8)));
}

function buildSuggestions(values: ResumeForm) {
  const suggestions = [];
  if (lines(values.experienceBullets).length < 3) suggestions.push("Add at least three achievement bullets in experience with action, scope, and result.");
  if (!/\d|%|users|latency|accuracy|revenue|time/i.test(`${values.experienceBullets} ${values.projectBullets}`)) {
    suggestions.push("Add one true metric such as users, records processed, accuracy, latency, time saved, or adoption.");
  }
  if (!values.github) suggestions.push("Add GitHub for startup and engineering credibility.");
  if (!/openai|llm|rag|python|machine learning/i.test(values.aiMl)) suggestions.push("Add verified AI/ML skills that match the target role.");
  return suggestions.length ? suggestions : ["Resume is clean, focused, and ready for a recruiter-friendly one-page export."];
}

function enhanceBullet(line: string, role: string) {
  const clean = line.replace(/^[-*]\s+/, "").trim();
  if (!clean) return clean;
  if (/^(built|designed|implemented|developed|optimized|integrated|created|automated|analyzed)\b/i.test(clean)) {
    return `${clean.replace(/[.;\s]+$/, "")}, improving clarity, maintainability, and fit for ${role} requirements.`;
  }
  return `Delivered ${clean.charAt(0).toLowerCase()}${clean.slice(1).replace(/[.;\s]+$/, "")}, aligned with ${role} expectations and production-quality execution.`;
}

function mergeList(current: string, additions: string) {
  return Array.from(new Set([...splitList(current), ...splitList(additions)])).join(", ");
}

function lines(value?: string) {
  return String(value ?? "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitList(value?: string) {
  return String(value ?? "")
    .split(/[,|;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function compact(values: Array<string | undefined>) {
  return values.map((value) => String(value ?? "").trim()).filter(Boolean);
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "resume";
}
