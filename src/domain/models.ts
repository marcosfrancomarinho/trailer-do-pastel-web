export type Category = { id: string; name: string }
export type Product = { id: string; name: string; description: string; categoryId: string; price: string; imageUrl?: string | null; available: boolean }
export type Addition = { id: string; name: string; price: string; available: boolean }
export type OrderPayload = { customerName: string; customerPhone: string; items: { productId: string; quantity: number; additions: { additionId: string; quantity: number }[] }[] }
export type CreatedOrder = { id: string; trackingToken: string; status: string; total: string }
export type TrackedOrder = { status: string; updatedAt: string }
export type PendingOrder = { id: string; customerName: string; customerPhone: string; status: string; total: string; createdAt: string; items: { productName: string; quantity: number; unitPrice: string; additions: { additionName: string; quantity: number; unitPrice: string }[] }[] }

export type OrderHistoryItem = Omit<PendingOrder, 'status'> & { status: 'COMPLETED' | 'CANCELED'; updatedAt: string; histories: { status: string; changedAt: string }[] }

export type PreparingOrder = Omit<PendingOrder, 'status'> & { status: 'CONFIRMED' | 'PREPARING'; updatedAt: string }

/** Resumo persistido no dispositivo para o cliente consultar sem autenticação. */
export type CustomerOrderDetails = {
  customerName: string
  customerPhone: string
  createdAt: string
  items: {
    productName: string
    quantity: number
    unitPrice: string
    additions: { additionName: string; quantity: number; unitPrice: string }[]
  }[]
}
export type SavedCustomerOrder = CreatedOrder & { details?: CustomerOrderDetails }
