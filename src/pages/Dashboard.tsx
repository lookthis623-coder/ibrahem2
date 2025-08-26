import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { Transaction } from '../types'
import { supabase } from '../utils/supabase'
import dayjs from 'dayjs'
import 'dayjs/locale/ar'

interface Product {
  id: number
  name: string
  quantity: number
  user_id: string
}

dayjs.locale('ar')

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

export default function Dashboard() {
  const { user } = useAuthStore()
  const [selectedCurrency, setSelectedCurrency] = useState('SYP')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    grossProfit: 0,
  })
  const [alerts, setAlerts] = useState<{
    lowStock: Product[];
    subscription: boolean;
    notifications: string[];
  }>({
    lowStock: [],
    subscription: false,
    notifications: []
  })

  useEffect(() => {
    const calculateStats = (transactions: Transaction[]) => {
      const totalIncome = transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)

      const totalExpenses = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

      setStats({
        totalIncome,
        totalExpenses,
        grossProfit: totalIncome - totalExpenses,
      })
    }

    const loadDashboard = async () => {
      try {
        await Promise.all([
          (async () => {
            const { data, error } = await supabase
              .from('transactions')
              .select('*')
              .eq('user_id', user?.id)
              .eq('currency', selectedCurrency)
              .order('date', { ascending: false })
              .limit(30)

            if (error) throw error

            setTransactions(data || [])
            calculateStats(data || [])
          })(),
          (async () => {
            // Fetch low stock products
            const { data: products } = await supabase
              .from('products')
              .select('*')
              .eq('user_id', user?.id)
              .lt('quantity', 10)

            // Fetch subscription status
            const { data: subscription } = await supabase
              .from('subscriptions')
              .select('*')
              .eq('user_id', user?.id)
              .single()

            const isSubscriptionExpiring = subscription && 
              dayjs(subscription.expires_at).diff(dayjs(), 'days') <= 7

            // Update alerts
            setAlerts({
              lowStock: products || [],
              subscription: isSubscriptionExpiring,
              notifications: []
            })
          })()
        ])
      } catch (error) {
        console.error('Error loading dashboard:', error)
      }
    }
    loadDashboard()
  }, [user?.id, selectedCurrency])

  // Prepare chart data for last 7 days
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    return dayjs().subtract(i, 'day').format('YYYY-MM-DD')
  }).reverse()

  const chartData = {
    labels: last7Days.map(date => dayjs(date).format('dddd')),
    datasets: [
      {
        label: 'الإيرادات',
        data: last7Days.map(date => {
          return transactions
            .filter(t => t.type === 'income' && 
                     dayjs(t.date).format('YYYY-MM-DD') === date)
            .reduce((sum, t) => sum + t.amount, 0)
        }),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
      },
      {
        label: 'المصروفات',
        data: last7Days.map(date => {
          return transactions
            .filter(t => t.type === 'expense' && 
                     dayjs(t.date).format('YYYY-MM-DD') === date)
            .reduce((sum, t) => sum + t.amount, 0)
        }),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
      },
    ],
  }

  return (
    <div className="space-y-6">
      {/* Header with Currency Selector */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">لوحة التحكم</h1>
        <select
          value={selectedCurrency}
          onChange={(e) => setSelectedCurrency(e.target.value)}
          className="block w-32 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="SYP">ليرة سورية</option>
          <option value="TRY">ليرة تركية</option>
          <option value="USD">دولار</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            إجمالي الإيرادات
          </h3>
          <p className="text-3xl font-bold text-green-600">
            {stats.totalIncome.toLocaleString()} {selectedCurrency}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            إجمالي المصروفات
          </h3>
          <p className="text-3xl font-bold text-red-600">
            {stats.totalExpenses.toLocaleString()} {selectedCurrency}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            الربح الإجمالي
          </h3>
          <p
            className={`text-3xl font-bold ${
              stats.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {stats.grossProfit.toLocaleString()} {selectedCurrency}
          </p>
        </motion.div>
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-lg shadow p-6"
      >
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          النشاط المالي الأسبوعي
        </h3>
        <div className="h-80">
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top' as const,
                  align: 'end' as const,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
            }}
          />
        </div>
      </motion.div>

      {/* Alerts Section */}
      <AnimatePresence>
        {(alerts.notifications.length > 0 || alerts.lowStock.length > 0 || alerts.subscription) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-lg shadow"
          >
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">التنبيهات</h3>
              <div className="space-y-4">
                {alerts.subscription && (
                  <div className="bg-red-50 border-r-4 border-red-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">⚠️</div>
                      <div className="mr-3">
                        <p className="text-sm text-red-700">
                          اشتراكك سينتهي قريباً. يرجى تجديد الاشتراك لضمان استمرار الخدمة.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {alerts.lowStock.map((product: Product) => (
                  <div key={product.id} className="bg-yellow-50 border-r-4 border-yellow-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">📦</div>
                      <div className="mr-3">
                        <p className="text-sm text-yellow-700">
                          المنتج "{product.name}" على وشك النفاد (الكمية المتبقية: {product.quantity})
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow"
        >
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">آخر الإيرادات</h3>
            <div className="flow-root">
              <ul className="-my-5 divide-y divide-gray-200">
                {transactions
                  .filter(t => t.type === 'income')
                  .slice(0, 5)
                  .map((transaction) => (
                    <li key={transaction.id} className="py-4">
                      <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {transaction.description || 'معاملة'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {dayjs(transaction.date).format('DD/MM/YYYY')}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-green-600">
                            {transaction.amount.toLocaleString()} {transaction.currency}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow"
        >
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">آخر المصروفات</h3>
            <div className="flow-root">
              <ul className="-my-5 divide-y divide-gray-200">
                {transactions
                  .filter(t => t.type === 'expense')
                  .slice(0, 5)
                  .map((transaction) => (
                    <li key={transaction.id} className="py-4">
                      <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {transaction.description || 'معاملة'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {dayjs(transaction.date).format('DD/MM/YYYY')}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-red-600">
                            {transaction.amount.toLocaleString()} {transaction.currency}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
