import { DashboardShell } from "@/components/app/dashboard-shell";
import { SmartResumeJobSearch } from "@/components/app/smart-resume-job-search";

export default function UploadPage() {
  return (
    <DashboardShell active="Smart Job Search">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm uppercase tracking-[0.26em] text-teal-200/75">Smart resume analyzer</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">Upload once. Find relevant job leads smoothly.</h1>
          <p className="mt-4 text-sm leading-6 text-white/55">
            CareerOS parses your resume, builds targeted job queries, validates live results when available, and falls back to trusted official career pages so you are not left with an empty search.
          </p>
        </div>
        <SmartResumeJobSearch />
      </div>
    </DashboardShell>
  );
}
