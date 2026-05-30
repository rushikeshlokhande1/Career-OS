# CareerOS AI

CareerOS AI is an AI-powered career readiness operating system for students, freshers, and early-career developers. It turns a resume, target role, job description, GitHub profile, and project evidence into a guided application workflow: readiness scoring, resume tailoring, portfolio generation, live job search, interview practice, and a 14-day improvement sprint.

## Product Demo Story

Most job seekers apply with disconnected proof. Their resume says one thing, GitHub shows another, and their portfolio either does not exist or does not explain their best work clearly. CareerOS AI brings those signals into one place and gives the user a practical answer: "Am I ready for this role, what is blocking me, and what should I fix next?"

The product is designed to be demoed as a complete loop:

1. Upload a PDF resume and choose a target role.
2. Get an ATS-style readiness report with score, risks, missing keywords, and recruiter-facing feedback.
3. Tailor the resume to a job description while preserving truthful evidence.
4. Generate a portfolio from verified resume and GitHub proof.
5. Search relevant roles and validate job URLs.
6. Practice interview questions based on the user's weak points.
7. Track progress through a guided dashboard.

## Hackathon Submission Answers

### What problem did you solve?

CareerOS AI solves the problem of fragmented, guess-based job preparation for students, freshers, and early-career developers. Many candidates apply to roles without knowing whether their resume, GitHub, projects, and interview readiness actually match the job. They waste time sending generic resumes, over-polishing weak claims, and missing the real blockers recruiters notice first.

This matters because early-career candidates often do not have a recruiter, mentor, or career coach reviewing their materials before they apply. CareerOS AI acts like a structured career operating system: it reads the user's actual evidence, scores readiness for a target role, identifies gaps, and turns the result into concrete next actions.

### Who is your target user?

The ideal user is a student, fresher, bootcamp graduate, or early-career software developer preparing for internships, entry-level roles, or their first serious job switch. They may have projects, coursework, GitHub repositories, and some practical skills, but they struggle to package that proof into a resume, portfolio, job search plan, and interview story that feels credible.

Their pain points are:

- They do not know if their resume is strong enough for a specific role.
- They use the same generic resume for every application.
- Their GitHub and portfolio do not clearly communicate real capability.
- They are unsure which skills or projects to improve first.
- They practice interviews without knowing which weaknesses recruiters will test.

### How does your solution improve the user's life or workflow?

CareerOS AI replaces scattered career prep with one guided workflow. Instead of jumping between resume tools, job boards, portfolio templates, and interview notes, the user starts with their real proof and gets a prioritized plan. The app shows their readiness score, explains recruiter risks, tailors their resume to a job description, generates portfolio content from evidence, finds relevant roles, and turns weak areas into interview practice.

This saves time, reduces uncertainty, and helps users apply with more confidence. Most importantly, CareerOS AI keeps recommendations evidence-based: it improves how the user presents their work without inventing fake achievements.

## Features

- Resume PDF parsing with readiness analysis.
- ATS-style scoring, keyword gaps, risk signals, and improvement actions.
- Resume tailoring for a pasted job description.
- GitHub proof analysis for recruiter trust.
- AI portfolio generation from verified career evidence.
- Smart job search and job URL validation.
- Interview practice arena with role-specific feedback.
- Guided "Start Here" workflow and dashboard.
- Supabase-ready profile persistence with local fallback.
- Production-oriented Next.js, TypeScript, Tailwind CSS, and API route architecture.

## Tech Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- OpenAI API
- Supabase
- Zod validation
- Vercel-ready deployment

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values you want to enable.

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SERPAPI_API_KEY=
ANTHROPIC_API_KEY=
```

The app includes fallback behavior for missing AI/search keys, but full demo quality requires an OpenAI API key.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production Checks

Run linting:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

## Supabase Setup

The SQL schema for optional profile persistence is in `supabase/careeros_profiles.sql`. Apply it in Supabase SQL Editor, then set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Evaluation Focus

- Technical execution: typed Next.js app, server API routes, PDF parsing, validation, AI fallbacks, and modular intelligence services.
- Problem solving and usefulness: a complete career readiness loop rather than a single resume checker.
- Creativity and originality: evidence-first career operating system that combines resume, GitHub, portfolio, jobs, and interviews.
- Usage of Codex and OpenAI tools: OpenAI-powered analysis, tailoring, portfolio generation, interview feedback, and assistant flows.
- Product demo and presentation: clear guided workflow from upload to actionable job-readiness output.
