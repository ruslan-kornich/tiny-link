import { Link2 } from 'lucide-react';

interface BrandLogoProps {
  size?: 'md' | 'lg';
}

export function BrandLogo({ size = 'md' }: BrandLogoProps) {
  const markClasses = size === 'lg' ? 'h-11 w-11 rounded-2xl' : 'h-8 w-8 rounded-xl';
  const iconClasses = size === 'lg' ? 'h-6 w-6' : 'h-4.5 w-4.5';
  const wordClasses = size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={`inline-flex items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-button ${markClasses}`}
      >
        <Link2 className={iconClasses} />
      </span>
      <span className={`font-display font-bold tracking-tight text-slate-900 ${wordClasses}`}>
        tiny<span className="text-brand-600">link</span>
      </span>
    </span>
  );
}
