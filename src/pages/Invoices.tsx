import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { supabase } from '../utils/supabase'
import type { Invoice } from '../types'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import 'dayjs/locale/ar'
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { utils, writeFile } from 'xlsx'

dayjs.locale('ar')

const styles = StyleSheet.create({
  page: {
    padding: 30,
    direction: 'rtl',
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  info: {
    marginBottom: 20,
  },
  table: {
    display: 'table',
    width: 'auto',
    marginTop: 20,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#000',
  },
  tableCell: {
    padding: 5,
    flex: 1,
  },
  total: {
    marginTop: 20,
    textAlign: 'left',
  },
})

const InvoicePDF = ({ invoice }: { invoice: Invoice }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>فاتورة رقم: {invoice.invoice_number}</Text>
      <View style={styles.info}>
        <Text>العميل: {invoice.client?.name}</Text>
        <Text>التاريخ: {dayjs(invoice.date).format('DD/MM/YYYY')}</Text>
        {invoice.due_date && (
          <Text>تاريخ الاستحقاق: {dayjs(invoice.due_date).format('DD/MM/YYYY')}</Text>
        )}
      </View>
      <View style={styles.table}>
        {invoice.items?.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.tableCell}>{item.description}</Text>
            <Text style={styles.tableCell}>{item.quantity}</Text>
            <Text style={styles.tableCell}>
              {item.unit_price.toLocaleString()} {item.currency}
            </Text>
            <Text style={styles.tableCell}>
              {item.total.toLocaleString()} {item.currency}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.total}>
        <Text>المجموع: {invoice.subtotal.toLocaleString()} {invoice.currency}</Text>
        {invoice.tax && <Text>الضريبة: {invoice.tax.toLocaleString()} {invoice.currency}</Text>}
        {invoice.discount && <Text>الخصم: {invoice.discount.toLocaleString()} {invoice.currency}</Text>}
        <Text>الإجمالي: {invoice.total.toLocaleString()} {invoice.currency}</Text>
      </View>
    </Page>
  </Document>
)

const statusColors: Record<Invoice['status'], string> = {
  'draft': 'bg-gray-100 text-gray-800',
  'sent': 'bg-blue-100 text-blue-800',
  'paid': 'bg-green-100 text-green-800',
  'overdue': 'bg-red-100 text-red-800',
  'cancelled': 'bg-red-100 text-red-800'
}

const statusTranslations: Record<Invoice['status'], string> = {
  'draft': 'مسودة',
  'sent': 'مرسلة',
  'paid': 'مدفوعة',
  'overdue': 'متأخرة',
  'cancelled': 'ملغاة'
}

export default function Invoices() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<Invoice['status'] | ''>('')

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, clients(*)')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Invoice[]
    }
  })

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client?.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = !statusFilter || invoice.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const queryClient = useQueryClient()

  // تحديث حالة الفاتورة
  const updateInvoiceStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: Invoice['status'] }) => {
      const { error } = await supabase
        .from('invoices')
        .update({ status })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    }
  })

  // تصدير إلى Excel
  const exportToExcel = () => {
    const data = filteredInvoices.map(invoice => ({
      'رقم الفاتورة': invoice.invoice_number,
      'العميل': invoice.client?.name,
      'التاريخ': dayjs(invoice.date).format('DD/MM/YYYY'),
      'تاريخ الاستحقاق': invoice.due_date ? dayjs(invoice.due_date).format('DD/MM/YYYY') : '-',
      'المبلغ': invoice.total,
      'العملة': invoice.currency,
      'الحالة': statusTranslations[invoice.status]
    }))

    const ws = utils.json_to_sheet(data)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'الفواتير')
    writeFile(wb, `فواتير-${dayjs().format('YYYY-MM-DD')}.xlsx`)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">الفواتير</h1>
        <div className="flex gap-2">
          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            تصدير Excel
          </button>
          <Link
            to="/invoices/new"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            إنشاء فاتورة جديدة
          </Link>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-4"
        >
          <h3 className="text-sm font-medium text-gray-500">إجمالي الفواتير</h3>
          <p className="text-2xl font-semibold text-gray-900">{invoices.length}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow p-4"
        >
          <h3 className="text-sm font-medium text-gray-500">الفواتير المدفوعة</h3>
          <p className="text-2xl font-semibold text-green-600">
            {invoices.filter(i => i.status === 'paid').length}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow p-4"
        >
          <h3 className="text-sm font-medium text-gray-500">الفواتير المعلقة</h3>
          <p className="text-2xl font-semibold text-yellow-600">
            {invoices.filter(i => i.status === 'sent').length}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow p-4"
        >
          <h3 className="text-sm font-medium text-gray-500">الفواتير المتأخرة</h3>
          <p className="text-2xl font-semibold text-red-600">
            {invoices.filter(i => i.status === 'overdue').length}
          </p>
        </motion.div>
      </div>

      {/* أدوات البحث والتصفية */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              بحث
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="بحث في الفواتير..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 pl-10"
              />
              <div className="absolute right-3 top-2.5 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الحالة
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Invoice['status'] | '')}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">كل الحالات</option>
              <option value="draft">مسودة</option>
              <option value="sent">مرسلة</option>
              <option value="paid">مدفوعة</option>
              <option value="overdue">متأخرة</option>
              <option value="cancelled">ملغاة</option>
            </select>
          </div>
        </div>

        {searchTerm || statusFilter ? (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              نتائج البحث: {filteredInvoices.length} فاتورة
            </span>
            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('')
              }}
              className="text-indigo-600 hover:text-indigo-900"
            >
              مسح التصفية
            </button>
          </div>
        ) : null}
      </div>

      {/* قائمة الفواتير */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                رقم الفاتورة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                العميل
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                التاريخ
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                المبلغ
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الحالة
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">تعديل</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInvoices.map((invoice) => (
              <motion.tr
                key={invoice.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <Link
                    to={`/invoices/${invoice.id}`}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    {invoice.invoice_number}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {invoice.client?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {dayjs(invoice.date).format('DD/MM/YYYY')}
                  {invoice.due_date && (
                    <div className="text-xs text-gray-400">
                      تاريخ الاستحقاق: {dayjs(invoice.due_date).format('DD/MM/YYYY')}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {invoice.total.toLocaleString()} {invoice.currency}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    statusColors[invoice.status]
                  }`}>
                    {statusTranslations[invoice.status]}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium space-x-2 space-x-reverse">
                  <PDFDownloadLink
                    document={<InvoicePDF invoice={invoice} />}
                    fileName={`فاتورة-${invoice.invoice_number}.pdf`}
                    className="text-red-600 hover:text-red-900 ml-4"
                  >
                    {({ loading }) => loading ? '...' : 'PDF'}
                  </PDFDownloadLink>
                  
                  {invoice.status === 'draft' && (
                    <button
                      onClick={() => updateInvoiceStatus.mutate({ id: invoice.id, status: 'sent' })}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      إرسال
                    </button>
                  )}

                  {invoice.status === 'sent' && (
                    <button
                      onClick={() => updateInvoiceStatus.mutate({ id: invoice.id, status: 'paid' })}
                      className="text-green-600 hover:text-green-900"
                    >
                      تأكيد الدفع
                    </button>
                  )}

                  {['draft', 'sent'].includes(invoice.status) && (
                    <button
                      onClick={() => updateInvoiceStatus.mutate({ id: invoice.id, status: 'cancelled' })}
                      className="text-red-600 hover:text-red-900"
                    >
                      إلغاء
                    </button>
                  )}

                  <Link
                    to={`/invoices/${invoice.id}/edit`}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    تعديل
                  </Link>
                </td>
              </motion.tr>
            ))}
            {filteredInvoices.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  لا توجد فواتير مطابقة للبحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      )}
    </div>
  )
}
