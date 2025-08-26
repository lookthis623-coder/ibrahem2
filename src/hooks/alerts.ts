import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../utils/supabase'
import type { Product, Alert } from '../types'

export function useNotifications() {
  const { client } = useAuthStore()
  const [notifications, setNotifications] = useState<Alert[]>([])

  useEffect(() => {
    if (!client) return

    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
          filter: `client_id=eq.${client.id}`,
        },
        (payload) => {
          const newAlert = payload.new as Alert
          setNotifications((prev) => [...prev, newAlert])
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [client])

  return notifications
}

export function useProductAlerts() {
  const { client } = useAuthStore()
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])

  useEffect(() => {
    if (!client) return

    const checkLowStock = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('client_id', client.id)
        .lt('quantity', 10)

      if (data) setLowStockProducts(data)
    }

    checkLowStock()
    const interval = setInterval(checkLowStock, 300000) // Check every 5 minutes

    return () => clearInterval(interval)
  }, [client])

  return lowStockProducts
}

export function useSubscriptionAlert() {
  const { client } = useAuthStore()
  const [isExpiringSoon, setIsExpiringSoon] = useState(false)

  useEffect(() => {
    if (!client?.subscription_end) return

    const checkSubscription = () => {
      if (!client.subscription_end) return
      const endDate = new Date(client.subscription_end)
      const daysUntilExpiry = Math.ceil(
        (endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )

      setIsExpiringSoon(daysUntilExpiry <= 7)
    }

    checkSubscription()
    const interval = setInterval(checkSubscription, 86400000) // Check every 24 hours

    return () => clearInterval(interval)
  }, [client])

  return isExpiringSoon
}
