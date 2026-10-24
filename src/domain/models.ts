export type Category = { id: string; name: string }
export type Product = { id: string; name: string; description: string; categoryId: string; price: string; imageUrl?: string | null; available: boolean }
export type Addition = { id: string; name: string; price: string; available: boolean }
export type OrderPayload = { customerName: string; customerPhone: string; observation?: string | null; tableId?: string | null; items: { productId: string; quantity: number; additions: { additionId: string; quantity: number }[] }[] }
export type CreatedOrder = { id: string; trackingToken: string; status: string; total: string; tableId?: string | null }
export type TrackedOrder = { status: string; updatedAt: string }
export type PendingOrder = { id: string; customerName: string; customerPhone: string; observation?: string | null; tableId?: string | null; tableNumber?: number | null; status: string; total: string; createdAt: string; items: { productName: string; quantity: number; unitPrice: string; additions: { additionName: string; quantity: number; unitPrice: string }[] }[] }

export type OrderHistoryItem = Omit<PendingOrder, 'status'> & { status: 'COMPLETED' | 'CANCELED'; updatedAt: string; histories: { status: string; changedAt: string }[] }

export type PreparingOrder = Omit<PendingOrder, 'status'> & { status: 'CONFIRMED' | 'PREPARING'; updatedAt: string }

/** Resumo persistido no dispositivo para o cliente consultar sem autenticação. */
export type CustomerOrderDetails = {
  customerName: string
  customerPhone: string
  observation?: string | null
  createdAt: string
  items: {
    productName: string
    quantity: number
    unitPrice: string
    additions: { additionName: string; quantity: number; unitPrice: string }[]
  }[]
}
export type SavedCustomerOrder = CreatedOrder & { details?: CustomerOrderDetails }

export type StoreState = { status: 'OPEN' | 'CLOSED'; updatedAt: string }
export type RestaurantTable = { id: string; number: number; status: 'FREE' | 'OCCUPIED'; totalSpent: string }
export type TableOrder = PendingOrder & { updatedAt: string; createdBy?: { name: string; role: 'ADMIN' | 'EMPLOYEE' } | null }
export type TableOrders = { tableId: string; number: number; status: 'FREE' | 'OCCUPIED'; totalSpent: string; sessionId: string | null; orders: TableOrder[] }
export type TableSession = { id: string; openedAt: string; closedAt: string | null; closedTotal: string | null; orders: TableOrder[] }
export type TableSessions = { tableId: string; sessions: TableSession[] }
export type RestaurantUser = { id: string; name: string; role: 'ADMIN' | 'EMPLOYEE'; createdAt: string }

export type ClosedComanda = { tableId: string | null; tableNumber: number | null; origin: 'TABLE' | 'ONLINE'; session: TableSession }
export type ClosedComandaHistory = { comandas: ClosedComanda[] }
