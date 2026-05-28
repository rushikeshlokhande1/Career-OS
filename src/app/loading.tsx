export default function Loading() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#05070d] px-4">
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-white/[0.04] p-5 shadow-panel">
        <div className="h-3 w-28 rounded-full bg-teal-200/25" />
        <div className="mt-5 space-y-3">
          <div className="h-3 rounded-full bg-white/10" />
          <div className="h-3 w-5/6 rounded-full bg-white/10" />
          <div className="h-3 w-2/3 rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  );
}
