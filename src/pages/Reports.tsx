import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../utils/supabase'
import dayjs from 'dayjs'
import 'dayjs/locale/ar'
import { utils, writeFile } from 'xlsx'
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

dayjs.locale('ar')

const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#000',
    minHeight: 30,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  tableCell: {
    flex: 1,
    padding: 5,
    textAlign: 'right',
  },
})

export default function ReportsPage() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly')
  const [selectedCurrency, setSelectedCurrency] = useState('SYP')

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['reports', period, selectedCurrency],
    queryFn: async () => {
      let startDate
      const now = dayjs()

      switch (period) {
        case 'daily':
          startDate = now.subtract(1, 'day')
          break
        case 'weekly':
          startDate = now.subtract(1, 'week')
          break
        case 'monthly':
          startDate = now.subtract(1, 'month')
          break
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('currency', selectedCurrency)
        .gte('date', startDate.format('YYYY-MM-DD'))
        .order('date', { ascending: false })

      if (error) throw error
      return data
    }
  })

  const stats = {
    totalIncome: transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0),
    totalExpenses: transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0),
  }

  const exportToExcel = () => {
    const ws = utils.json_to_sheet(transactions.map(t => ({
      التاريخ: dayjs(t.date).format('DD/MM/YYYY'),
      النوع: t.type === 'income' ? 'إيراد' : 'مصروف',
      الوصف: t.description,
      المبلغ: t.amount,
      العملة: t.currency,
    })))
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'التقرير المالي')
    writeFile(wb, `تقرير-مالي-${dayjs().format('YYYY-MM-DD')}.xlsx`)
  }

  const ReportPDF = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>التقرير المالي</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>التاريخ</Text>
              <Text style={styles.tableCell}>النوع</Text>
              <Text style={styles.tableCell}>الوصف</Text>
              <Text style={styles.tableCell}>المبلغ</Text>
            </View>
            {transactions.map((t, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.tableCell}>
                  {dayjs(t.date).format('DD/MM/YYYY')}
                </Text>
                <Text style={styles.tableCell}>
                  {t.type === 'income' ? 'إيراد' : 'مصروف'}
                </Text>
                <Text style={styles.tableCell}>{t.description}</Text>
                <Text style={styles.tableCell}>
                  {t.amount.toLocaleString()} {t.currency}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>إجمالي الإيرادات</Text>
              <Text style={styles.tableCell}>
                {stats.totalIncome.toLocaleString()} {selectedCurrency}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>إجمالي المصروفات</Text>
              <Text style={styles.tableCell}>
                {stats.totalExpenses.toLocaleString()} {selectedCurrency}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>صافي الربح</Text>
              <Text style={styles.tableCell}>
                {(stats.totalIncome - stats.totalExpenses).toLocaleString()} {selectedCurrency}
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">التقارير المالية</h1>
        <div className="flex gap-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="block w-32 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="daily">يومي</option>
            <option value="weekly">أسبوعي</option>
            <option value="monthly">شهري</option>
          </select>
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
      </div>

      {/* الإحصائيات */}
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
            صافي الربح
          </h3>
          <p className={`text-3xl font-bold ${
            stats.totalIncome - stats.totalExpenses >= 0 
              ? 'text-green-600' 
              : 'text-red-600'
          }`}>
            {(stats.totalIncome - stats.totalExpenses).toLocaleString()} {selectedCurrency}
          </p>
        </motion.div>
      </div>

      {/* أزرار التصدير */}
      <div className="flex gap-4">
        <button
          onClick={exportToExcel}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          تصدير إلى Excel
        </button>
        <PDFDownloadLink
          document={<ReportPDF />}
          fileName={`تقرير-مالي-${dayjs().format('YYYY-MM-DD')}.pdf`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          {({ blob, url, loading, error }) =>
            loading ? 'جاري التحضير...' : 'تصدير إلى PDF'
          }
        </PDFDownloadLink>
      </div>

      {/* جدول المعاملات */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                التاريخ
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                النوع
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الوصف
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                المبلغ
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {dayjs(transaction.date).format('DD/MM/YYYY')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {transaction.type === 'income' ? 'إيراد' : 'مصروف'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.description}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                  transaction.type === 'income' 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {transaction.amount.toLocaleString()} {transaction.currency}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
