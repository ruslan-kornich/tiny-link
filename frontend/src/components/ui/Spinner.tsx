import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-7 w-7',
};

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return <Loader2 className={`animate-spin text-brand-500 ${sizeClasses[size]} ${className}`} />;
}
