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
      <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        className={`rounded-xl border bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400
          focus:outline-2 focus:outline-offset-1 transition-colors
          ${error ? 'border-red-400 focus:outline-red-500' : 'border-slate-300 focus:outline-indigo-500'}
          ${className}`}
        {...rest}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
});
