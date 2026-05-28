import Link from "next/link";
import { ArrowRight, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/app/theme-toggle";

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/[0.08] bg-[#05070d]/70 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06]">
            <Command className="h-4 w-4 text-teal-200" />
          </span>
          <span className="text-sm font-semibold tracking-wide text-white">CareerOS AI</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-white/60 md:flex">
          <Link href="/#features" className="transition hover:text-white">Platform</Link>
          <Link href="/#readiness" className="transition hover:text-white">Readiness</Link>
          <Link href="/#simulation" className="transition hover:text-white">Simulation</Link>
          <Link href="/#testimonials" className="transition hover:text-white">Proof</Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/auth">Login</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/start">
              Start Flow <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
