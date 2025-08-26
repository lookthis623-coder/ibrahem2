import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../utils/supabase'
import type { Notification, PaymentReminder, StockAlert } from '../types/notifications'

export function useNotifications() {
  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Notification[]
    }
  })

  const markAsRead = useMutation({
    mutationFn: async (notificationId: number) => {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'READ', read_at: new Date().toISOString() })
        .eq('id', notificationId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  return {
    notifications,
    unreadCount: notifications.filter(n => n.status === 'UNREAD').length,
    isLoading,
    markAsRead
  }
}

export function usePaymentReminders() {
  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['payment-reminders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_reminders')
        .select('*')
        .order('due_date', { ascending: true })
      
      if (error) throw error
      return data as PaymentReminder[]
    }
  })

  const overdueReminders = reminders.filter(r => 
    r.status === 'OVERDUE' || 
    (r.status === 'PENDING' && new Date(r.due_date) < new Date())
  )

  const upcomingReminders = reminders.filter(r =>
    r.status === 'PENDING' && new Date(r.due_date) > new Date()
  )

  return {
    reminders,
    overdueReminders,
    upcomingReminders,
    isLoading
  }
}

export function useStockAlerts() {
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['stock-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_alerts')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as StockAlert[]
    }
  })

  return {
    alerts,
    activeAlerts: alerts.filter(a => a.status === 'ACTIVE'),
    isLoading
  }
}
