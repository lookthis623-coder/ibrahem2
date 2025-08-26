export interface Client {
  id: number
  user_id: string
  name: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface User {
  id: number
  client_id: number
  username: string
  role: 'مدير النظام' | 'مشرف' | 'موظف' | 'قارئ'
  created_at: Date
}

export interface Product {
  id: number
  user_id: string
  name: string
  description?: string
  sku?: string
  barcode?: string
  price: number
  cost?: number
  currency: string
  quantity: number
  min_quantity?: number
  category_id?: number
  image_url?: string
  created_at: string
  updated_at: string
}

export interface TransactionIncome {
  id: number
  client_id: number
  timestamp: Date
  customer_name?: string
  type?: string
  department?: string
  product_or_service?: string
  quantity: number
  unit_price: number
  total_amount: number
  currency: string
  payment_method: string
  notes?: string
}

export interface TransactionExpense {
  id: number
  client_id: number
  timestamp: Date
  vendor_name?: string
  expense_type?: string
  product_or_service?: string
  quantity: number
  unit_price: number
  total_amount: number
  currency: string
  payment_method: string
  notes?: string
}

export interface Invoice {
  id: number
  user_id: string
  client_id: number
  client?: Client
  invoice_number: string
  date: string
  due_date?: string
  subtotal: number
  tax?: number
  discount?: number
  total: number
  currency: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
  items: {
    id: number
    invoice_id: number
    product_id: number
    description: string
    quantity: number
    unit_price: number
    currency: string
    tax?: number
    discount?: number
    total: number
  }[]
}

export interface Alert {
  id: number
  client_id: number
  type: 'انتهاء الاشتراك' | 'انخفاض المخزون'
  message: string
  is_read: boolean
  created_at: Date
}

export interface Report {
  id: number
  client_id: number
  report_type: string
  start_date: Date
  end_date: Date
  currency: string
  generated_at: Date
}

export interface Backup {
  id: number
  client_id: number
  backup_url: string
  created_at: Date
}

export interface Settings {
  id: number
  client_id: number
  app_name?: string
  logo_url?: string
  theme?: string
  language: string
}
