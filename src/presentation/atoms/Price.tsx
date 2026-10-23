import { brl } from '../../api'
export default function Price({ value, className = '' }: { value: number | string; className?: string }) {
  return <strong className={className}>{brl(value)}</strong>
}
