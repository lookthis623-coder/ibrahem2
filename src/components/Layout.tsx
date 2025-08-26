import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'

const sidebarLinks = [
  { name: 'لوحة التحكم', path: '/dashboard', icon: '📊' },
  { name: 'الواردات', path: '/income', icon: '💰' },
  { name: 'الصادرات', path: '/expenses', icon: '📤' },
  { name: 'المستودع', path: '/inventory', icon: '📦' },
  { name: 'التقارير', path: '/reports', icon: '📈' },
  { name: 'المستخدمين', path: '/users', icon: '👥' },
  { name: 'الإعدادات', path: '/settings', icon: '⚙️' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const { user, client, logout } = useAuthStore()
  const location = useLocation()

  if (!user || !client) return null

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isSidebarOpen ? 0 : -300 }}
        className="bg-white w-64 min-h-screen shadow-lg fixed right-0 top-0 z-50 overflow-y-auto"
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="text-gray-500 hover:text-gray-600"
            >
              {isSidebarOpen ? '✕' : '☰'}
            </button>
            <div className="text-lg font-bold text-gray-800">{client.store_name}</div>
          </div>

          <nav className="space-y-2">
            {sidebarLinks.map((link) => (
              (link.path !== '/users' || user.role === 'مدير النظام') && (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-3 space-x-reverse p-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors ${
                    location.pathname === link.path ? 'bg-indigo-50 text-indigo-600' : ''
                  }`}
                >
                  <span className="text-xl">{link.icon}</span>
                  <span>{link.name}</span>
                </Link>
              )
            ))}
          </nav>
        </div>

        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">{user.username}</div>
              <div className="text-xs text-gray-500">{user.role}</div>
            </div>
            <button
              onClick={logout}
              className="text-sm text-red-600 hover:text-red-700"
            >
              خروج
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'mr-64' : 'mr-0'}`}>
        {/* Top Bar */}
        <header className="bg-white shadow-sm">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <button
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                className="text-gray-500 hover:text-gray-600 lg:hidden"
              >
                {isSidebarOpen ? '✕' : '☰'}
              </button>
              
              <div className="flex items-center">
                {client.logo_url && (
                  <img
                    src={client.logo_url}
                    alt="Logo"
                    className="h-8 w-auto"
                  />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="py-6">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
