import { Fragment } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications, usePaymentReminders, useStockAlerts } from '../hooks/notifications'
import dayjs from 'dayjs'
import 'dayjs/locale/ar'

dayjs.locale('ar')

export default function NotificationsPanel() {
  const { notifications, markAsRead } = useNotifications()
  const { overdueReminders, upcomingReminders } = usePaymentReminders()
  const { activeAlerts } = useStockAlerts()

  return (
    <div className="fixed left-4 bottom-4 z-50">
      <AnimatePresence>
        {(notifications.length > 0 || overdueReminders.length > 0 || activeAlerts.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white rounded-lg shadow-lg p-4 w-96 max-h-[80vh] overflow-y-auto"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">التنبيهات</h3>
            <div className="space-y-4">
              {/* المدفوعات المتأخرة */}
              {overdueReminders.map(reminder => (
                <div key={reminder.id} className="bg-red-50 border-r-4 border-red-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">💰</div>
                    <div className="mr-3">
                      <p className="text-sm text-red-700">
                        مدفوعات متأخرة: {reminder.amount.toLocaleString()} {reminder.currency}
                      </p>
                      <p className="text-xs text-red-500 mt-1">
                        تاريخ الاستحقاق: {dayjs(reminder.due_date).format('DD/MM/YYYY')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* المدفوعات القادمة */}
              {upcomingReminders.map(reminder => (
                <div key={reminder.id} className="bg-blue-50 border-r-4 border-blue-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">📅</div>
                    <div className="mr-3">
                      <p className="text-sm text-blue-700">
                        مدفوعات مستحقة: {reminder.amount.toLocaleString()} {reminder.currency}
                      </p>
                      <p className="text-xs text-blue-500 mt-1">
                        تاريخ الاستحقاق: {dayjs(reminder.due_date).format('DD/MM/YYYY')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* تنبيهات المخزون */}
              {activeAlerts.map(alert => (
                <div key={alert.id} className="bg-yellow-50 border-r-4 border-yellow-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">📦</div>
                    <div className="mr-3">
                      <p className="text-sm text-yellow-700">
                        المنتج "{alert.product_name}" على وشك النفاد
                      </p>
                      <p className="text-xs text-yellow-500 mt-1">
                        الكمية المتبقية: {alert.current_quantity}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* التنبيهات العامة */}
              {notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`bg-gray-50 border-r-4 border-gray-400 p-4 ${
                    notification.status === 'UNREAD' ? 'opacity-100' : 'opacity-75'
                  }`}
                  onClick={() => markAsRead.mutate(notification.id)}
                >
                  <div className="flex">
                    <div className="flex-shrink-0">🔔</div>
                    <div className="mr-3">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {dayjs(notification.created_at).fromNow()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
