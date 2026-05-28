import Link from "next/link";
import { ArrowUpRight, Bell, Bot, Command, FilePenLine, FileText, FileUp, Globe2, Home, Mic, Rocket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/start", label: "Start Here", icon: Rocket },
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/resume-match", label: "Resume Tools", icon: FilePenLine },
  { href: "/resume-builder", label: "Resume Builder", icon: FileText },
  { href: "/portfolio-generator", label: "Portfolio Generator", icon: Globe2 },
  { href: "/upload", label: "Smart Job Search", icon: FileUp },
  { href: "/interview", label: "Interview Practice", icon: Mic },
  { href: "/assistant", label: "AI Assistant", icon: Bot },
];

export function DashboardShell({
  children,
  active = "Dashboard",
}: {
  children: React.ReactNode;
  active?: string;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-border bg-card/70 backdrop-blur-2xl lg:block">
        <div className="flex h-full flex-col p-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/[0.06]">
              <Command className="h-5 w-5 text-teal-200" />
            </span>
            <div>
              <div className="font-semibold text-white">CareerOS AI</div>
              <div className="text-xs text-white/45">Job readiness engine</div>
            </div>
          </Link>
          <nav className="mt-10 space-y-2">
            {nav.map((item) => {
              const Icon = item.icon;
              const selected = active === item.label;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
                    selected
                      ? "border border-teal-300/20 bg-teal-300/10 text-white"
                      : "text-white/55 hover:bg-white/[0.06] hover:text-white",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto rounded-xl border border-white/10 bg-white/[0.05] p-4">
            <Sparkles className="h-5 w-5 text-amber-200" />
            <div className="mt-3 text-sm font-medium text-white">CareerOS Flow</div>
            <p className="mt-1 text-xs leading-5 text-white/50">
              Resume, portfolio, job fit, interview prep in one application kit.
            </p>
            <Button asChild size="sm" className="mt-4 w-full">
              <Link href="/start">
                Start guided flow <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </aside>
      <main className="lg:pl-72">
        <div className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-2xl sm:px-6 lg:px-8">
          <div>
            <div className="text-sm text-white/45">Career readiness system</div>
            <div className="font-medium text-white">{active}</div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="secondary" size="icon" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
            <Button asChild variant="secondary">
              <Link href="/start">Start flow</Link>
            </Button>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
