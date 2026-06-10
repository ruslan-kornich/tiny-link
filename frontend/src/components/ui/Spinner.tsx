import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
};

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return <Loader2 className={`animate-spin text-slate-400 ${sizeClasses[size]} ${className}`} />;
}
