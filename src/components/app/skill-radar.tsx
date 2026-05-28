import type { ScoreBreakdown } from "@/lib/intelligence/types";

const labels: Array<keyof ScoreBreakdown> = [
  "resumeQuality",
  "projectQuality",
  "skillsRelevance",
  "deploymentExperience",
  "githubActivity",
  "technicalDepth",
  "communicationQuality",
];

const display: Record<keyof ScoreBreakdown, string> = {
  resumeQuality: "Resume",
  projectQuality: "Projects",
  skillsRelevance: "Skills",
  deploymentExperience: "Deploy",
  githubActivity: "GitHub",
  technicalDepth: "Depth",
  communicationQuality: "Comms",
};

export function SkillRadar({ breakdown }: { breakdown: ScoreBreakdown }) {
  const center = 120;
  const maxRadius = 86;
  const points = labels
    .map((key, index) => {
      const angle = (Math.PI * 2 * index) / labels.length - Math.PI / 2;
      const radius = (breakdown[key] / 100) * maxRadius;
      return `${center + Math.cos(angle) * radius},${center + Math.sin(angle) * radius}`;
    })
    .join(" ");

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[280px]">
      <svg viewBox="0 0 240 240" className="h-full w-full">
        {[0.25, 0.5, 0.75, 1].map((ring) => (
          <circle key={ring} cx={center} cy={center} r={maxRadius * ring} fill="none" stroke="rgba(255,255,255,.09)" />
        ))}
        {labels.map((key, index) => {
          const angle = (Math.PI * 2 * index) / labels.length - Math.PI / 2;
          const x = center + Math.cos(angle) * maxRadius;
          const y = center + Math.sin(angle) * maxRadius;
          const labelX = center + Math.cos(angle) * (maxRadius + 24);
          const labelY = center + Math.sin(angle) * (maxRadius + 24);
          return (
            <g key={key}>
              <line x1={center} y1={center} x2={x} y2={y} stroke="rgba(255,255,255,.08)" />
              <text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle" className="fill-white/55 text-[10px]">
                {display[key]}
              </text>
            </g>
          );
        })}
        <polygon points={points} fill="rgba(45,212,191,.28)" stroke="#5eead4" strokeWidth="2" />
      </svg>
    </div>
  );
}
