import { cn } from "@/lib/utils";

type RadialScoreProps = {
  value: number;
  label: string;
  sublabel?: string;
  size?: "sm" | "lg";
};

export function RadialScore({ value, label, sublabel, size = "lg" }: RadialScoreProps) {
  const dimension = size === "lg" ? "h-48 w-48" : "h-32 w-32";
  const text = size === "lg" ? "text-5xl" : "text-3xl";

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={cn(
          "relative grid place-items-center rounded-full",
          dimension,
        )}
        style={{
          background: `conic-gradient(from 180deg, #2dd4bf ${value * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
        }}
      >
        <div className="absolute inset-3 rounded-full bg-[#070a12] shadow-inner" />
        <div className="relative text-center">
          <div className={cn("font-semibold tracking-tight gradient-text", text)}>{value}</div>
          <div className="text-xs uppercase tracking-[0.24em] text-white/40">score</div>
        </div>
      </div>
      <div className="text-center">
        <div className="font-medium text-white">{label}</div>
        {sublabel ? <div className="mt-1 text-sm text-white/50">{sublabel}</div> : null}
      </div>
    </div>
  );
}
