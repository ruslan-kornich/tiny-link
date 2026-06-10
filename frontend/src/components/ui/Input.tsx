import { forwardRef, useId, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className = '', ...rest },
  ref,
) {
  const inputId = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        className={`rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400
          transition-all duration-150 focus:outline-none focus:ring-4
          ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
              : 'border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-brand-100'
          }
          ${className}`}
        {...rest}
      />
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
});
