import { useEffect, useState } from 'react';
import { BrazilianDate } from '../../../shared/formatters/brazilian-date';

interface BrazilianDateInputProps {
  id: string;
  value: string;
  maxDate: string;
  onChange: (date: string) => void;
  onValidityChange?: (valid: boolean) => void;
  className?: string;
  ariaLabel?: string;
}

export default function BrazilianDateInput({
  id,
  value,
  maxDate,
  onChange,
  onValidityChange,
  className = '',
  ariaLabel,
}: BrazilianDateInputProps) {
  const [displayValue, setDisplayValue] = useState(() => BrazilianDate.format(value));
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setDisplayValue(BrazilianDate.format(value));
    setInvalid(false);
  }, [value]);

  function updateFromText(text: string) {
    const formatted = BrazilianDate.mask(text);
    const parsedDate = BrazilianDate.parse(formatted, maxDate);
    setDisplayValue(formatted);
    setInvalid(formatted.length === 10 && !parsedDate);
    onValidityChange?.(parsedDate !== null);
    if (parsedDate) onChange(parsedDate);
  }

  function updateFromPicker(isoDate: string) {
    if (!isoDate || isoDate > maxDate) return;
    setDisplayValue(BrazilianDate.format(isoDate));
    setInvalid(false);
    onValidityChange?.(true);
    onChange(isoDate);
  }

  function openPicker(input: HTMLInputElement) {
    try {
      input.showPicker?.();
    } catch {
      // O clique nativo ainda pode abrir o calendário neste navegador.
    }
  }

  const pickerValue = BrazilianDate.parse(displayValue, maxDate) === value ? value : '';

  return (
    <div className={'relative min-w-0 ' + className}>
      <input
        id={id}
        type='text'
        inputMode='numeric'
        autoComplete='off'
        maxLength={10}
        value={displayValue}
        onChange={(event) => updateFromText(event.target.value)}
        onBlur={() => setInvalid(BrazilianDate.parse(displayValue, maxDate) === null)}
        placeholder='dd/mm/aaaa'
        aria-label={ariaLabel}
        aria-invalid={invalid}
        aria-describedby={invalid ? `${id}-error` : undefined}
        className='min-h-11 w-full min-w-0 rounded-lg border border-[#84a8b9] bg-white px-3 pr-14 text-sm font-bold text-[#123449] placeholder:text-slate-500'
      />
      <span aria-hidden='true' className='pointer-events-none absolute inset-y-0 right-0 grid w-11 place-items-center text-lg text-[#123449]'>
        📅
      </span>
      <input
        type='date'
        lang='pt-BR'
        max={maxDate}
        value={pickerValue}
        onChange={(event) => updateFromPicker(event.target.value)}
        onClick={(event) => openPicker(event.currentTarget)}
        aria-label='Escolher data no calendário'
        className='absolute inset-y-0 right-0 h-full w-11 cursor-pointer opacity-0'
      />
      {invalid && (
        <p id={`${id}-error`} role='alert' className='mt-1 text-xs font-semibold text-amber-200'>
          Informe uma data válida até hoje (dd/mm/aaaa).
        </p>
      )}
    </div>
  );
}
