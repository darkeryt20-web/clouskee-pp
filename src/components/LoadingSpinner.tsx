import {Loader2} from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
}

export function LoadingSpinner({label = 'Loading...'}: LoadingSpinnerProps) {
  return (
    <div className="min-h-[75vh] bg-[#07030d] flex flex-col items-center justify-center px-4 py-24">
      <div className="w-12 h-12 rounded-2xl bg-[#140a26] border border-purple-500/30 flex items-center justify-center shadow-[0_0_32px_rgba(139,92,246,0.28)]">
        <Loader2
          className="w-6 h-6 text-purple-400 animate-spin"
          aria-hidden="true"
        />
      </div>
      <p className="mt-4 text-xs font-medium text-slate-400">{label}</p>
    </div>
  );
}
