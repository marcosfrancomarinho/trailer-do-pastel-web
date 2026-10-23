import type { InputHTMLAttributes } from 'react'
type Props = InputHTMLAttributes<HTMLInputElement> & { label: string }
export default function TextField({ label, className = '', id, ...props }: Props) {
  const fieldId = id ?? label.toLowerCase().replace(/[^a-z0-9]/g, '-')
  return <label htmlFor={fieldId} className="block text-sm font-semibold text-[#143b50]">{label}<input id={fieldId} {...props} className={['mt-2 w-full rounded-xl border border-cyan-100 bg-white p-3 outline-cyan-400', className].join(' ')} /></label>
}
