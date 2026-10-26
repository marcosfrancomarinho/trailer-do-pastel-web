import { useState } from 'react';

type Props = {
  id: string;
  label?: string;
  className?: string;
};

export default function CopyId({ id, label, className = '' }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type='button'
      onClick={(event) => {
        event.stopPropagation();
        void copy();
      }}
      title={copied ? 'ID copiado!' : 'Clique para copiar o ID completo'}
      aria-label={copied ? 'ID copiado' : 'Copiar ID completo ' + id}
      className={'inline-flex cursor-copy items-center gap-1 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ' + className}
    >
      <span>{label ?? id.slice(0, 8).toUpperCase()}</span>
      <svg aria-hidden='true' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8'
        strokeLinecap='round' strokeLinejoin='round' className='h-3.5 w-3.5 shrink-0 opacity-70'>
        {copied ? <path d='m5 12 4 4L19 6' /> : (
          <>
            <rect x='8' y='8' width='12' height='12' rx='2' />
            <path d='M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2' />
          </>
        )}
      </svg>
      <span className='sr-only' role='status'>{copied ? 'Copiado' : ''}</span>
    </button>
  );
}
