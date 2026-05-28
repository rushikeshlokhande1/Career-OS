"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bot, Clipboard, FileText, Loader2, MessageSquareText, Send, Sparkles } from "lucide-react";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { readApiJson } from "@/lib/api-response";
import { loadLatestAnalysis } from "@/lib/intelligence/client-store";
import type { CareerAnalysis } from "@/lib/intelligence/types";
import type { AssistantMessage } from "@/lib/intelligence/assistant";

const prompts = [
  "What should I do this week?",
  "Why would I get rejected?",
  "What project should I build first?",
  "How can I improve my GitHub?",
];

export function AssistantClient() {
  const [analysis, setAnalysis] = useState<CareerAnalysis | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [applicationKit, setApplicationKit] = useState<{ coverLetter: string; recruiterDm: string } | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loaded = loadLatestAnalysis();
    setAnalysis(loaded);
    setApplicationKit(loaded ? buildApplicationKit(loaded) : null);
    setMessages(loaded
      ? [
          {
            role: "assistant",
            content: `I know your target role is ${loaded.targetRole}. Your readiness is ${loaded.readinessScore}/100 and your biggest gap is ${loaded.missingSkills[0]?.skill ?? "proof clarity"}. Ask me what to fix first.`,
          },
        ]
      : []);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const memory = useMemo(
    () => [
      ["Target role", analysis?.targetRole ?? "Upload first"],
      ["Readiness", analysis ? `${analysis.readinessScore}/100` : "--"],
      ["Hire probability", analysis ? `${analysis.hiringProbability}%` : "--"],
      ["Biggest gap", analysis?.missingSkills[0]?.skill ?? "Upload resume"],
      ["Career type", analysis?.careerTwin.careerArchetype ?? "Not generated"],
    ],
    [analysis],
  );

  async function send(content = input) {
    const trimmed = content.trim();
    if (!trimmed || isSending || !analysis) return;

    const nextMessages: AssistantMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis, messages: nextMessages }),
      });
      const payload = await readApiJson<{ message?: AssistantMessage }>(response);

      if (!response.ok || !payload.message) {
        setMessages([...nextMessages, { role: "assistant", content: payload.error ?? "I could not answer that yet. Try asking what to do next." }]);
        return;
      }

      setMessages([...nextMessages, payload.message]);
    } catch {
      setMessages([...nextMessages, { role: "assistant", content: "Network error. I could not reach the assistant service." }]);
    } finally {
      setIsSending(false);
    }
  }

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      setInput(value);
    }
  }

  return (
    <DashboardShell active="Assistant">
      <div className="mx-auto grid max-w-7xl gap-6 p-4 sm:p-6 lg:grid-cols-[0.72fr_0.28fr] lg:p-8">
        <Card className="flex min-h-[calc(100vh-8rem)] flex-col overflow-hidden">
          <div className="border-b border-white/10 p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg border border-teal-200/20 bg-teal-300/10">
                <Bot className="h-5 w-5 text-teal-200" />
              </span>
              <div>
                <h1 className="text-xl font-semibold text-white">CareerOS AI Assistant</h1>
                <p className="text-sm text-white/45">Personalized guidance from your resume, GitHub, roadmap, and weaknesses.</p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {isLoaded && !analysis ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-6">
                <div className="text-sm text-teal-100">No assistant memory yet</div>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Upload your resume to generate proof-grounded guidance.</h2>
                <p className="mt-3 text-sm leading-6 text-white/55">
                  The assistant, cover letter, and recruiter DM generator need your real resume analysis before they can write anything trustworthy.
                </p>
                <Button asChild className="mt-5">
                  <Link href="/start">
                    Upload resume <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : null}
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[82%] rounded-2xl border p-4 text-sm leading-7 ${
                  message.role === "assistant"
                    ? "border-white/10 bg-white/[0.055] text-white/70"
                    : "ml-auto border-teal-200/20 bg-teal-300/12 text-teal-50"
                }`}
              >
                {message.content}
              </div>
            ))}
            {isSending ? (
              <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-sm text-white/50">
                <Loader2 className="h-4 w-4 animate-spin text-teal-200" />
                Thinking with your profile...
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-white/10 p-5">
            <div className="mb-3 flex flex-wrap gap-2">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => void send(prompt)}
                  className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs text-white/55 transition hover:border-teal-200/30 hover:text-white"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void send();
                }}
                placeholder="Ask: What should I do next to get hired?"
                disabled={!analysis}
              />
              <Button onClick={() => void send()} disabled={isSending || !analysis}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <Sparkles className="h-4 w-4 text-teal-200" />
              Assistant memory
            </div>
            <div className="mt-4 space-y-3">
              {memory.map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                  <div className="text-xs text-white/35">{label}</div>
                  <div className="mt-1 text-sm font-medium text-white">{value}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <div className="text-sm font-medium text-white">Need fresher analysis?</div>
            <p className="mt-2 text-sm leading-6 text-white/50">Upload your latest resume and GitHub username so the assistant has better memory.</p>
            <Button asChild className="mt-4 w-full">
              <Link href="/upload">
              Run analysis <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </Card>
          {applicationKit ? (
          <Card className="p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <FileText className="h-4 w-4 text-teal-200" />
              Proof-grounded outreach
            </div>
            <p className="mt-2 text-sm leading-6 text-white/50">
              Generated only from your resume evidence, target role, and recruiter risks.
            </p>
            <div className="mt-4 space-y-3">
              <GeneratedBlock
                icon={<FileText className="h-4 w-4" />}
                title="Cover letter"
                value={applicationKit.coverLetter}
                onCopy={() => void copyText(applicationKit.coverLetter)}
              />
              <GeneratedBlock
                icon={<MessageSquareText className="h-4 w-4" />}
                title="Recruiter DM"
                value={applicationKit.recruiterDm}
                onCopy={() => void copyText(applicationKit.recruiterDm)}
              />
            </div>
            <Button type="button" variant="secondary" className="mt-4 w-full" onClick={() => setApplicationKit(analysis ? buildApplicationKit(analysis) : null)}>
              <Sparkles className="h-4 w-4" />
              Regenerate from proof
            </Button>
          </Card>
          ) : null}
        </div>
      </div>
    </DashboardShell>
  );
}

function GeneratedBlock({ icon, title, value, onCopy }: { icon: React.ReactNode; title: string; value: string; onCopy: () => void }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-white">
          <span className="text-teal-200">{icon}</span>
          {title}
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-md border border-white/10 bg-black/20 p-1.5 text-white/50 transition hover:text-white"
          aria-label={`Copy ${title}`}
        >
          <Clipboard className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mt-3 whitespace-pre-line text-xs leading-5 text-white/58">{value}</p>
    </div>
  );
}

function buildApplicationKit(analysis: CareerAnalysis) {
  const resume = analysis.extractedResume;
  const strongestProject = resume.projects[0] ?? analysis.recommendedProjects[0]?.title ?? "a relevant technical project";
  const skills = resume.skills.slice(0, 6).join(", ") || analysis.trendingIndustrySkills.slice(0, 4).join(", ") || "modern software engineering";
  const risk = analysis.recruiterSimulation.rejectionRisks[0] ?? analysis.recruiterAlerts[0] ?? "I am actively strengthening proof around the target role";
  const proofLine = [
    resume.projects.length ? `project proof in ${strongestProject}` : "",
    analysis.github ? `GitHub portfolio signal of ${analysis.github.portfolioStrength}/100` : "",
    resume.achievements[0] ? `achievement evidence: ${resume.achievements[0]}` : "",
  ].filter(Boolean).join("; ") || "resume-backed project and skill evidence";

  return {
    coverLetter: [
      `Dear Hiring Team,`,
      ``,
      `I am applying for the ${analysis.targetRole} role because my current work and project evidence align with the role's need for ${skills}. My strongest proof is ${proofLine}.`,
      ``,
      `CareerOS flagged one important risk in my profile: ${risk}. I am addressing that directly by making my project evidence clearer, improving repository trust signals, and preparing concise explanations of architecture, tradeoffs, and outcomes.`,
      ``,
      `I would value the opportunity to bring this proof-driven, builder-focused approach to your team.`,
    ].join("\n"),
    recruiterDm: `Hi, I am exploring ${analysis.targetRole} roles. My strongest proof is ${proofLine}. I work with ${skills}, and I am currently tightening the main recruiter risk in my profile: ${risk}. If this matches what your team is hiring for, I would be glad to share my resume and a short project walkthrough.`,
  };
}
