import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, FilePenLine, Flame, Github, Mic, ShieldCheck, Sparkles, Target } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { SiteHeader } from "@/components/app/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const conversionFeatures = [
  {
    icon: Target,
    title: "Job-specific readiness verdict",
    description: "Upload your resume, paste a job description, and see your score, shortlist risk, and biggest blocker in one place.",
  },
  {
    icon: FilePenLine,
    title: "Resume Match Engine",
    description: "Tailor your existing resume to the JD while preserving the same structure, section order, and truthful claims.",
  },
  {
    icon: Flame,
    title: "14-Day Hire-Ready Sprint",
    description: "Get a practical day-by-day plan to fix resume proof, GitHub trust, projects, and interview readiness.",
  },
  {
    icon: Github,
    title: "GitHub proof analysis",
    description: "Know whether your repositories look like real work or academic projects to recruiters.",
  },
  {
    icon: Mic,
    title: "Interview training arena",
    description: "Practice role-specific interviews and get feedback on technical depth, clarity, confidence, and communication.",
  },
];

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden">
      <SiteHeader />
      <div className="absolute inset-x-0 top-0 h-[760px] bg-grid-fade grid-mask opacity-40" />

      <section className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-center px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-sm text-white/65 backdrop-blur-xl">
              <Sparkles className="h-4 w-4 text-teal-200" />
              Verified AI application kit for tech careers
            </div>
            <h1 className="mt-7 max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Get job-ready with a tailored resume, portfolio, live jobs, and interview prep.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/62">
              CareerOS turns your resume, GitHub, and projects into one guided application flow, so every recommendation is tied to real proof instead of invented career claims.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/start">
                  Start guided flow <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/resume-match">
                  <FilePenLine className="h-4 w-4" /> Match my resume
                </Link>
              </Button>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {["Tailored resume", "Verified portfolio", "Live job prep"].map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-white/[0.045] px-3 py-3 text-sm text-white/65">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-5 flex max-w-2xl items-start gap-3 rounded-xl border border-amber-200/15 bg-amber-200/[0.06] p-4 text-sm leading-6 text-amber-50/72">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" />
              <span>Trust rule: CareerOS uses resume evidence, GitHub activity, and the target JD. It flags weak proof before it writes polished claims.</span>
            </div>
          </Reveal>

          <Reveal delay={0.15} className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-teal-300/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-panel">
              <Image
                src="/images/careeros-hero.png"
                alt="CareerOS AI readiness interface"
                width={1400}
                height={900}
                priority
                className="h-auto w-full"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="relative border-y border-white/[0.08] bg-white/[0.025]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <Reveal>
            <p className="text-sm uppercase tracking-[0.28em] text-teal-200/80">The problem</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Most candidates apply with disconnected proof.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-xl leading-9 text-white/62">
              The resume says one thing, GitHub says another, and the portfolio often does not exist. CareerOS turns those scattered signals into one focused path recruiters can understand quickly: proof first, polish second.
            </p>
          </Reveal>
        </div>
      </section>

      <section id="features" className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <Reveal className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.28em] text-teal-200/80">What you get</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white">One guided flow from resume upload to confident applications.</h2>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {conversionFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Reveal key={feature.title} delay={index * 0.05}>
                <Card className="h-full p-6">
                  <Icon className="h-5 w-5 text-teal-200" />
                  <h3 className="mt-5 text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/55">{feature.description}</p>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section id="readiness" className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {[
            ["1. Upload your real proof", "CareerOS reads your resume, projects, GitHub, and target role to understand what you can honestly claim."],
            ["2. Build the application kit", "Create a tailored resume, verified portfolio, recruiter-facing project descriptions, and live job-fit insights."],
            ["3. Apply with confidence", "Use readiness scores, recruiter risks, and interview practice to fix weak proof before applying heavily."],
          ].map(([title, body]) => (
            <Card key={title} className="p-7">
              <CheckCircle2 className="h-5 w-5 text-amber-200" />
              <h3 className="mt-5 text-xl font-semibold text-white">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/55">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="simulation" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_1fr]">
          <Reveal>
            <h2 className="text-4xl font-semibold tracking-tight text-white">No demo scores. No invented profile.</h2>
            <p className="mt-5 text-lg leading-8 text-white/60">
              CareerOS only shows readiness, risk, skills, and sprint data after the user uploads a resume and chooses a target role.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <Card className="p-6">
              <div className="rounded-lg border border-white/10 bg-black/25 p-5">
                <div className="text-sm text-white/45">Product rule</div>
                <p className="mt-4 text-lg leading-8 text-white/78">
                  The app starts empty. Every score, recruiter note, missing skill, and recommendation must come from the uploaded resume, pasted job description, or connected GitHub profile.
                </p>
              </div>
            </Card>
          </Reveal>
        </div>
      </section>

      <section id="testimonials" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Resume required", "Readiness data is locked until a PDF resume or pasted resume content is provided."],
            ["Role required", "CareerOS asks for one target role so feedback does not become generic."],
            ["Evidence locked", "Portfolio and resume outputs are generated from user evidence, not sample achievements."],
          ].map(([title, body]) => (
            <Card key={title} className="p-6">
              <ShieldCheck className="h-5 w-5 text-teal-200" />
              <h3 className="mt-5 font-semibold text-white">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/70">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/[0.08] px-4 py-10 text-center text-sm text-white/45">
        CareerOS AI - Know if you are ready before you apply
      </footer>
    </main>
  );
}
