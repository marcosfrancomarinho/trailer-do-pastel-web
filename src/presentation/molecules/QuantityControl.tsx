type Props = { quantity: number; onDecrease: () => void; onIncrease: () => void; label?: string }
export default function QuantityControl({ quantity, onDecrease, onIncrease, label = 'item' }: Props) {
  return <div className="flex items-center gap-3"><button type="button" aria-label={'Diminuir ' + label} className="rounded-lg bg-[#e8faff] px-3 py-1" onClick={onDecrease}>−</button><b>{quantity}</b><button type="button" aria-label={'Aumentar ' + label} className="rounded-lg bg-[#e8faff] px-3 py-1" onClick={onIncrease}>+</button></div>
}
