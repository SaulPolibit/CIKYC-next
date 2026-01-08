'use client';

import { cn } from '@/lib/utils';

interface ChipOption {
  value: string;
  label: string;
}

interface ChoiceChipsProps {
  options: ChipOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  multiple?: boolean;
  label?: string;
}

export function ChoiceChips({
  options,
  selected,
  onChange,
  multiple = false,
  label,
}: ChoiceChipsProps) {
  const handleChipClick = (value: string) => {
    if (multiple) {
      if (selected.includes(value)) {
        onChange(selected.filter((s) => s !== value));
      } else {
        onChange([...selected, value]);
      }
    } else {
      if (selected.includes(value)) {
        onChange([]);
      } else {
        onChange([value]);
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="text-[14px] font-medium text-[#212121]">{label}</span>
      )}
      <div className="flex flex-wrap gap-2" style={{ rowGap: '12px' }}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleChipClick(option.value)}
            className={cn(
              'px-3 py-2 text-[12px] font-normal rounded-lg border transition-all cursor-pointer',
              selected.includes(option.value)
                ? 'bg-black/35 border-[#4B39EF]/30 text-white shadow-sm'
                : 'bg-white border-[#E0E3E7] text-[#434447] hover:bg-[#F1F4F8] hover:border-[#d0d3d7]'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
