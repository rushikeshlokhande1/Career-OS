import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://careeros-ai.vercel.app"),
  title: {
    default: "CareerOS AI",
    template: "%s | CareerOS AI",
  },
  description:
    "An AI-powered career readiness operating system for resume scoring, job matching, portfolio generation, and interview practice.",
  applicationName: "CareerOS AI",
  keywords: [
    "career readiness",
    "AI resume analysis",
    "ATS resume scoring",
    "portfolio generator",
    "interview practice",
    "job search",
  ],
  authors: [{ name: "CareerOS AI" }],
  openGraph: {
    title: "CareerOS AI",
    description:
      "Turn your resume, GitHub, and projects into a guided application workflow with AI-powered readiness scoring.",
    type: "website",
    images: ["/images/careeros-hero.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var saved = localStorage.getItem("careeros.theme");
                var prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
                var theme = saved === "light" || saved === "dark" ? saved : prefersLight ? "light" : "dark";
                document.documentElement.classList.toggle("light", theme === "light");
                document.documentElement.classList.toggle("dark", theme === "dark");
              } catch {}
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="noise" />
        {children}
      </body>
    </html>
  );
}
