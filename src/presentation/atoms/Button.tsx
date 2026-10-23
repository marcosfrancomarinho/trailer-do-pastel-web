import type { ButtonHTMLAttributes } from 'react'
type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }
export default function Button({ variant = 'primary', className = '', type = 'button', ...props }: Props) {
  return <button type={type} {...props} className={['rounded-full px-6 py-3 font-bold transition disabled:cursor-not-allowed disabled:opacity-60', variant === 'primary' ? 'bg-[#ffc629] text-[#113548] hover:brightness-95' : 'border border-cyan-200 bg-white text-[#143b50] hover:bg-cyan-50', className].join(' ')} />
}
