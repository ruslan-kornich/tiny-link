const PRESETS = [7, 30, 90] as const;

interface RangePresetPickerProps {
  selectedDays: number;
  onSelect: (days: number) => void;
}

export function RangePresetPicker({ selectedDays, onSelect }: RangePresetPickerProps) {
  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
      {PRESETS.map((days) => (
        <button
          key={days}
          type="button"
          onClick={() => onSelect(days)}
          className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all duration-150 ${
            selectedDays === days
              ? 'bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-button'
              : 'text-slate-500 hover:bg-brand-50 hover:text-brand-700'
          }`}
        >
          {days}d
        </button>
      ))}
    </div>
  );
}
