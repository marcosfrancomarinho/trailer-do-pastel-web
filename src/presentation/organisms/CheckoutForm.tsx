import type { Dispatch, FormEvent, SetStateAction } from 'react'
import Button from '../atoms/Button'
import Price from '../atoms/Price'
import TextField from '../atoms/TextField'
type Props = { customerName: string; setCustomerName: Dispatch<SetStateAction<string>>; customerPhone: string; setCustomerPhone: Dispatch<SetStateAction<string>>; total: number; sending: boolean; error: string; checkout: (event: FormEvent<HTMLFormElement>) => Promise<void> }
export default function CheckoutForm({ customerName, setCustomerName, customerPhone, setCustomerPhone, total, sending, error, checkout }: Props) {
  return <form onSubmit={e => void checkout(e)} className="h-fit space-y-4 rounded-3xl bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Finalizar pedido</h2><TextField label="Seu nome" required value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Como podemos chamar você?" /><TextField label="Telefone" required type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="(99) 99999-9999" /><div className="flex justify-between border-t border-cyan-100 pt-4 text-lg"><span>Total estimado</span><Price value={total}/></div><p className="text-xs text-[#557383]">O preço final será validado pela pastelaria no servidor.</p>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}<Button type="submit" disabled={sending} className="w-full py-4 font-black">{sending ? 'Enviando pedido...' : 'Confirmar pedido →'}</Button></form>
}
