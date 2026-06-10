import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CopyButtonProps {
  value: string;
  tone?: 'light' | 'dark';
}

const toneClasses = {
  light: 'text-slate-400 hover:bg-brand-50 hover:text-brand-600',
  dark: 'text-white/70 hover:bg-white/15 hover:text-white',
};

export function CopyButton({ value, tone = 'light' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(resetTimerRef.current), []);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.clearTimeout(resetTimerRef.current);
    resetTimerRef.current = window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy to clipboard"
      className={`rounded-lg p-1.5 transition-colors ${toneClasses[tone]}`}
    >
      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}
