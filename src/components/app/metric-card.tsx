import { Card } from "@/components/ui/card";

type MetricCardProps = {
  label: string;
  value: string;
  suffix?: string;
  trend: string;
};

export function MetricCard({ label, value, suffix, trend }: MetricCardProps) {
  return (
    <Card className="p-5">
      <div className="text-sm text-white/50">{label}</div>
      <div className="mt-4 flex items-end gap-1">
        <span className="text-4xl font-semibold tracking-tight text-white">{value}</span>
        {suffix ? <span className="pb-1 text-sm text-white/50">{suffix}</span> : null}
      </div>
      <div className="mt-4 rounded-full border border-teal-300/15 bg-teal-300/10 px-3 py-1 text-xs text-teal-100">
        {trend}
      </div>
    </Card>
  );
}
