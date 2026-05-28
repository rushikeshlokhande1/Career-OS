"use client";

import { motion } from "framer-motion";
import { BrainCircuit } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const intelligenceStates = [
  "Parsing resume text...",
  "Checking ATS readability...",
  "Matching skills to target role...",
  "Analyzing GitHub profile...",
  "Calculating ATS score...",
  "Preparing your resume report...",
];

export function IntelligenceLoading({ activeIndex, progress }: { activeIndex: number; progress: number }) {
  const hasStarted = activeIndex >= 0;

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
          className="grid h-11 w-11 place-items-center rounded-lg border border-teal-200/20 bg-teal-300/10"
        >
          <BrainCircuit className="h-5 w-5 text-teal-200" />
        </motion.div>
        <div>
          <div className="font-medium text-white">ATS resume analysis engine</div>
          <div className="text-sm text-white/45">
            {hasStarted ? intelligenceStates[activeIndex] ?? intelligenceStates[0] : "Waiting for resume and target role"}
          </div>
        </div>
      </div>
      <Progress value={progress} className="mt-6 h-3" />
      <div className="mt-5 space-y-3">
        {intelligenceStates.map((state, index) => (
          <div key={state} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2">
            <span className={hasStarted && index <= activeIndex ? "text-sm text-white" : "text-sm text-white/35"}>{state}</span>
            <span className={hasStarted && index < activeIndex ? "text-xs text-teal-200" : "text-xs text-white/30"}>
              {!hasStarted ? "ready" : index < activeIndex ? "complete" : index === activeIndex ? "active" : "queued"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
