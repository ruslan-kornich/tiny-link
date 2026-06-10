const PRESETS = [7, 30, 90] as const;

interface RangePresetPickerProps {
  selectedDays: number;
  onSelect: (days: number) => void;
}

export function RangePresetPicker({ selectedDays, onSelect }: RangePresetPickerProps) {
  return (
    <div className="inline-flex rounded-xl border border-slate-300 bg-white p-0.5">
      {PRESETS.map((days) => (
        <button
          key={days}
          type="button"
          onClick={() => onSelect(days)}
          className={`rounded-[10px] px-3 py-1.5 text-sm font-medium transition-colors ${
            selectedDays === days
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {days} days
        </button>
      ))}
    </div>
  );
}
