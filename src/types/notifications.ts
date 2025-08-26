export interface Notification {
  id: number
  user_id: string
  type: 'LOW_STOCK' | 'PAYMENT_DUE' | 'SUBSCRIPTION' | 'SYSTEM'
  title: string
  message: string
  status: 'UNREAD' | 'READ'
  created_at: string
  read_at?: string
}

export interface PaymentReminder {
  id: number
  user_id: string
  client_id: number
  invoice_id: number
  amount: number
  currency: string
  due_date: string
  status: 'PENDING' | 'PAID' | 'OVERDUE'
  created_at: string
}

export interface StockAlert {
  id: number
  user_id: string
  product_id: number
  product_name: string
  current_quantity: number
  threshold: number
  status: 'ACTIVE' | 'RESOLVED'
  created_at: string
}
