export default function LoadingSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <span className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-brand animate-spin" />
      {label}
    </div>
  );
}
