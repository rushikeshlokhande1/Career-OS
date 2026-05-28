import Link from "next/link";
import { Chrome, Command, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AuthPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mx-auto flex w-fit items-center gap-2 text-white">
          <span className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/[0.06]">
            <Command className="h-5 w-5 text-teal-200" />
          </span>
          <span className="font-semibold">CareerOS AI</span>
        </Link>
        <Card className="mt-8 p-6">
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-white">Enter your CareerOS account</h1>
            <p className="mt-2 text-sm text-white/50">Login or register to start building your readiness model.</p>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-white/[0.04] p-1 text-sm">
            <button className="rounded-md bg-white/[0.08] px-3 py-2 text-white">Login</button>
            <button className="rounded-md px-3 py-2 text-white/55">Register</button>
          </div>
          <div className="mt-6 space-y-3">
            <Input type="email" placeholder="student@email.com" />
            <Input type="password" placeholder="Password" />
            <Button className="w-full">
              <Mail className="h-4 w-4" /> Continue with email
            </Button>
            <Button variant="secondary" className="w-full">
              <Chrome className="h-4 w-4" /> Continue with Google
            </Button>
          </div>
          <p className="mt-6 text-center text-xs leading-5 text-white/40">
            Supabase authentication hooks are ready for connection when backend setup begins.
          </p>
        </Card>
      </div>
    </main>
  );
}
