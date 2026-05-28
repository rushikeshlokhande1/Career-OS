"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  FileSearch,
  Filter,
  Loader2,
  MapPin,
  Search,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { readApiJson } from "@/lib/api-response";
import type { JobResult, ParsedResumeProfile } from "@/lib/intelligence/smart-job-search";

type SearchPayload = {
  jobs: JobResult[];
  total_found: number;
  total_checked: number;
  total_valid: number;
  search_time_seconds: number;
  queries: string[];
  country: string;
  country_code: string;
  fresh_since: string;
};

const uploadStatuses = ["Extracting data...", "Analyzing skills...", "Mapping experience...", "Preparing job search..."];
const searchStatuses = ["Searching Google...", "Filtering company sites...", "Validating official links...", "Ranking results..."];

export function SmartResumeJobSearch() {
  const [file, setFile] = useState<File | null>(null);
  const [profile, setProfile] = useState<ParsedResumeProfile | null>(null);
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [stats, setStats] = useState<Omit<SearchPayload, "jobs" | "queries"> | null>(null);
  const [queries, setQueries] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchProgress, setSearchProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("");

  const uploadStatus = uploadStatuses[Math.min(uploadStatuses.length - 1, Math.floor(uploadProgress / 26))];
  const searchStatus = searchStatuses[Math.min(searchStatuses.length - 1, Math.floor(searchProgress / 26))];
  const topSkills = useMemo(() => profile?.skills.slice(0, 5) ?? [], [profile]);

  async function analyzeResume(selectedFile = file) {
    if (!selectedFile) {
      setError("Upload a resume first.");
      return;
    }

    setError("");
    setIsUploading(true);
    setUploadProgress(12);
    setJobs([]);
    setStats(null);

    const timer = window.setInterval(() => {
      setUploadProgress((value) => Math.min(92, value + 9));
    }, 600);

    const formData = new FormData();
    formData.append("resume", selectedFile);

    try {
      const response = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });
      const payload = await readApiJson<{ profile?: ParsedResumeProfile }>(response);

      if (!response.ok || !payload.profile) {
        setError(payload.error ?? "CareerOS could not parse this resume.");
        return;
      }

      setProfile(payload.profile);
      setUploadProgress(100);
    } catch {
      setError("Network error while analyzing the resume.");
    } finally {
      window.clearInterval(timer);
      setIsUploading(false);
    }
  }

  async function searchJobs() {
    if (!profile) {
      setError("Analyze a resume before searching jobs.");
      return;
    }

    setError("");
    setIsSearching(true);
    setSearchProgress(8);

    const timer = window.setInterval(() => {
      setSearchProgress((value) => Math.min(94, value + 5));
    }, 850);

    try {
      const response = await fetch("/api/jobs/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          profile_id: profile.id,
          profile,
          filters: {
            type: typeFilter,
            location: locationFilter.trim(),
            experience_level: profile.experience_level,
          },
        }),
      });
      const payload = await readApiJson<SearchPayload>(response);

      if (!response.ok) {
        setError(payload.error ?? "CareerOS could not complete the job search.");
        return;
      }

      setJobs(payload.jobs ?? []);
      setStats({
        total_found: payload.total_found,
        total_checked: payload.total_checked,
        total_valid: payload.total_valid,
        search_time_seconds: payload.search_time_seconds,
        country: payload.country,
        country_code: payload.country_code,
        fresh_since: payload.fresh_since,
      });
      setQueries(payload.queries ?? []);
      setSearchProgress(100);
    } catch {
      setError("Network error while searching and validating jobs.");
    } finally {
      window.clearInterval(timer);
      setIsSearching(false);
    }
  }

  function onDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    const selected = event.dataTransfer.files?.[0];
    if (selected) {
      setFile(selected);
      void analyzeResume(selected);
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <motion.label
          whileHover={{ y: -2 }}
          onDrop={onDrop}
          onDragOver={(event) => event.preventDefault()}
          className="relative flex min-h-[420px] cursor-pointer flex-col justify-between overflow-hidden rounded-xl border border-dashed border-teal-200/30 bg-white/[0.045] p-6 shadow-panel backdrop-blur-2xl"
        >
          <input
            type="file"
            accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
            className="sr-only"
            onChange={(event) => {
              const selected = event.target.files?.[0] ?? null;
              setFile(selected);
            }}
          />
          <div>
            <div className="grid h-14 w-14 place-items-center rounded-lg border border-white/10 bg-white/[0.06]">
              {isUploading ? <Loader2 className="h-6 w-6 animate-spin text-teal-200" /> : <UploadCloud className="h-6 w-6 text-teal-200" />}
            </div>
            <h2 className="mt-7 text-2xl font-semibold text-white">Resume upload and deep analysis</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/55">
              Drop a PDF, DOCX, or DOC resume under 5MB. CareerOS extracts contact details, skill signals, education, experience level, and target roles.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button type="button" onClick={() => void analyzeResume()} disabled={isUploading || !file}>
                {isUploading ? "Analyzing..." : "Analyze resume"}
              </Button>
              {file ? (
                <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-white/60">
                  <FileSearch className="h-4 w-4" />
                  {file.name}
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between text-xs text-white/45">
              <span>{isUploading ? uploadStatus : profile ? "Analysis complete" : "Waiting for resume"}</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {["Server-side file validation", "PDF and DOCX text extraction", "Claude JSON profile parsing", "Session profile handoff"].map((item, index) => (
                <div key={item} className="flex items-center gap-2 text-xs text-white/55">
                  <CheckCircle2 className={`h-4 w-4 ${uploadProgress > index * 24 ? "text-teal-200" : "text-white/20"}`} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </motion.label>

        <ProfileSummary profile={profile} topSkills={topSkills} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <section className="rounded-xl border border-white/10 bg-white/[0.045] p-5">
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-teal-200" />
            <div>
              <h2 className="font-medium text-white">Search controls</h2>
              <p className="text-xs text-white/45">Google Jobs, country, and real-time freshness apply automatically.</p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <label className="text-xs uppercase tracking-[0.18em] text-white/35">Work mode</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {["all", "remote", "hybrid", "onsite"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTypeFilter(type)}
                    className={`h-9 rounded-lg border text-xs capitalize transition ${
                      typeFilter === type ? "border-teal-200/40 bg-teal-300/15 text-white" : "border-white/10 bg-white/[0.035] text-white/50"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.18em] text-white/35">Location</label>
              <Input className="mt-2" placeholder="Bangalore, Remote, India..." value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} />
              <p className="mt-2 text-xs leading-5 text-white/40">
                Resume country: {profile?.country ?? "analyze resume first"}. CareerOS checks live job results first, then falls back to trusted official career pages.
              </p>
            </div>
            <Button type="button" className="w-full" onClick={() => void searchJobs()} disabled={!profile || isSearching}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {isSearching ? "Searching..." : "Find live jobs"}
            </Button>
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between text-xs text-white/45">
              <span>{isSearching ? searchStatus : stats ? "Search complete" : "Ready after analysis"}</span>
              <span>{Math.round(searchProgress)}%</span>
            </div>
            <Progress value={searchProgress} />
          </div>

          {stats ? (
            <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-4">
              <div className="text-2xl font-semibold text-white">{stats.total_found} valid jobs</div>
              <p className="mt-1 text-xs text-white/45">
                {stats.total_valid} verified {stats.country} links from {stats.total_checked} checked in {stats.search_time_seconds}s
              </p>
            </div>
          ) : null}
        </section>

        <section className="min-h-[460px] rounded-xl border border-white/10 bg-white/[0.035] p-5">
          <div className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Validated job matches</h2>
              <p className="mt-1 text-sm text-white/45">
                {profile ? `Live ${profile.country} matches and trusted official career pages are shown.` : "Live matches and trusted official career pages appear here."}
              </p>
            </div>
            {queries.length ? <span className="text-xs text-white/40">{queries.length} targeted queries generated</span> : null}
          </div>

          {error ? (
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-amber-200/20 bg-amber-300/10 p-3 text-sm text-amber-100">
              <X className="h-4 w-4" />
              {error}
            </div>
          ) : null}

          <div className="mt-5 grid gap-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
            {!jobs.length && !isSearching ? (
              <div className="grid min-h-72 place-items-center text-center">
                <div>
                  <ShieldCheck className="mx-auto h-10 w-10 text-white/20" />
                  <p className="mt-4 text-sm text-white/50">Analyze a resume, then launch the search engine to validate live job links.</p>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function ProfileSummary({ profile, topSkills }: { profile: ParsedResumeProfile | null; topSkills: string[] }) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.045] p-6">
      <div className="flex items-center gap-3">
        <BadgeCheck className="h-5 w-5 text-amber-200" />
        <div>
          <h2 className="font-medium text-white">Parsed resume summary</h2>
          <p className="text-xs text-white/45">Used directly by the job search pipeline.</p>
        </div>
      </div>

      {profile ? (
        <div className="mt-6 space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <Info label="Candidate" value={profile.name} />
            <Info label="Email" value={profile.email || "Not found"} />
            <Info label="Phone" value={profile.phone || "Not found"} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Experience" value={`${profile.experience_years} yrs, ${profile.experience_level}`} />
            <Info label="Country" value={`${profile.country} (${profile.country_code})`} />
            <Info label="Industries" value={profile.industries.join(", ") || "General technology"} />
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-white/35">Top skills</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {topSkills.map((skill) => (
                <span key={skill} className="rounded-lg border border-teal-200/20 bg-teal-300/10 px-3 py-1.5 text-xs text-teal-50">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-white/35">Education</div>
            <div className="mt-3 space-y-2">
              {profile.education.slice(0, 2).map((item, index) => (
                <div key={`${item.degree}-${index}`} className="rounded-lg border border-white/10 bg-black/15 p-3 text-sm text-white/65">
                  <span className="text-white">{item.degree}</span> at {item.institution}
                  {item.graduation_year ? <span className="text-white/40">, {item.graduation_year}</span> : null}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-white/35">Suggested job titles</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.job_titles.map((title) => (
                <span key={title} className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-white/65">
                  {title}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid min-h-72 place-items-center text-center">
          <div>
            <BriefcaseBusiness className="mx-auto h-10 w-10 text-white/20" />
            <p className="mt-4 text-sm text-white/50">Your profile card appears after parsing completes.</p>
          </div>
        </div>
      )}
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/15 p-3">
      <div className="text-[10px] uppercase tracking-[0.16em] text-white/35">{label}</div>
      <div className="mt-2 break-words text-sm text-white">{value}</div>
    </div>
  );
}

function JobCard({ job }: { job: JobResult }) {
  return (
    <article className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={job.favicon} alt="" className="mt-1 h-9 w-9 rounded-lg border border-white/10 bg-white" />
          <div>
            <h3 className="text-base font-semibold text-white">{job.job_title}</h3>
            <p className="mt-1 text-sm text-white/55">{job.company}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/45">
              <span className="inline-flex items-center gap-1 rounded-lg bg-white/[0.06] px-2 py-1">
                <MapPin className="h-3.5 w-3.5" />
                {job.location}
              </span>
              <span className="rounded-lg bg-teal-300/10 px-2 py-1 capitalize text-teal-100">{job.type}</span>
              <span className="rounded-lg bg-white/[0.06] px-2 py-1">{job.experience_required}</span>
              <span className="rounded-lg bg-white/[0.06] px-2 py-1">{formatPostedDate(job.posted_at)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xl font-semibold text-white">{job.match_score}%</div>
            <div className="text-xs text-white/40">match</div>
          </div>
          <Button asChild size="sm">
            <a href={job.apply_url} target="_blank" rel="noreferrer">
              Apply Now <ArrowUpRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
      {job.matched_skills.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {job.matched_skills.map((skill) => (
            <span key={skill} className="rounded-lg border border-white/10 bg-black/15 px-2 py-1 text-[11px] text-white/55">
              {skill}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function formatPostedDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fresh";
  return `Posted ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}
