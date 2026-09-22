import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet,
  Calendar,
  Clock,
  Receipt,
  TrendingUp,
  PlusCircle,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  PieChart as PieIcon,
  BarChart3,
} from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import ExpenseModal from '../components/ExpenseModal'
import { CATEGORY_COLORS, CATEGORY_BADGES, PAYMENT_BADGES } from '../services/categories'

// Custom Chart Tooltips declared outside to optimize render lifecycle
const CustomCategoryTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100 text-xs">
        <p className="font-bold text-slate-800">{data.category}</p>
        <p className="text-indigo-600 font-extrabold mt-1">₹{Number(data.amount).toFixed(2)}</p>
        <p className="text-slate-400 text-[10px] mt-0.5">
          {data.count} transactions • {data.percentage}%
        </p>
      </div>
    )
  }
  return null
}

const CustomMonthlyTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100 text-xs">
        <p className="font-bold text-slate-800">{label}</p>
        <p className="text-indigo-600 font-extrabold mt-1">
          ₹{Number(payload[0].value).toFixed(2)}
        </p>
        <p className="text-slate-400 text-[10px] mt-0.5">
          {payload[0].payload.count} transactions
        </p>
      </div>
    )
  }
  return null
}

const Dashboard = () => {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [categoryData, setCategoryData] = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [recentExpenses, setRecentExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const [sumRes, catRes, monRes, expRes] = await Promise.all([
        api.get('/api/analytics/summary'),
        api.get('/api/analytics/category'),
        api.get('/api/analytics/monthly'),
        api.get('/api/expenses?page=1&limit=5&sort_by=date&sort_order=desc'),
      ])

      setSummary(sumRes.data)
      setCategoryData(catRes.data.categories || [])
      setMonthlyData(monRes.data.months || [])
      setRecentExpenses(expRes.data.expenses || [])
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setError('Unable to load dashboard metrics. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      {/* Top Banner with Greeting & Quick Add Button */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-100/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold backdrop-blur-xs mb-2.5">
            Overview Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome back, {user?.name || 'Student'}! 👋
          </h1>
          <p className="text-indigo-100 text-sm mt-1 max-w-xl">
            Track, analyze, and optimize your monthly budget and expenses in real time.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchDashboardData}
            title="Refresh Data"
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            id="quick-add-expense-btn"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-700 text-sm font-bold shadow-md hover:bg-indigo-50 transition-all hover:shadow-lg active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Quick Add Expense</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-between text-rose-700 text-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchDashboardData}
            className="px-3 py-1 rounded-lg bg-rose-100 text-rose-800 text-xs font-semibold hover:bg-rose-200 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* 5 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Spent</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-800 tracking-tight">
              {loading ? '...' : `₹${Number(summary?.total_expenses || 0).toFixed(2)}`}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">All-time expenses</p>
          </div>
        </div>

        {/* Current Month */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">This Month</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-emerald-600 tracking-tight">
              {loading ? '...' : `₹${Number(summary?.current_month_expenses || 0).toFixed(2)}`}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">{currentMonthName}</p>
          </div>
        </div>

        {/* Today's Spending */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Today</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-800 tracking-tight">
              {loading ? '...' : `₹${Number(summary?.today_expenses || 0).toFixed(2)}`}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Today's transactions</p>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Transactions</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-800 tracking-tight">
              {loading ? '...' : summary?.transaction_count || 0}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Total recorded</p>
          </div>
        </div>

        {/* Highest Expense */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Highest</span>
            <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-violet-600 tracking-tight">
              {loading ? '...' : `₹${Number(summary?.highest_expense || 0).toFixed(2)}`}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Max single expense</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <PieIcon className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-800">Spending by Category</h2>
            </div>
            <Link to="/analytics" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View Analytics <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {loading ? (
              <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            ) : categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {categoryData.map((entry) => (
                      <Cell
                        key={entry.category}
                        fill={CATEGORY_COLORS[entry.category] || '#64748b'}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomCategoryTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm font-semibold text-slate-400">No category data yet</p>
                <p className="text-xs text-slate-400 mt-0.5">Add an expense to view breakdown</p>
              </div>
            )}
          </div>

          {/* Category Legend Pills */}
          {categoryData.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
              {categoryData.map((cat) => (
                <div
                  key={cat.category}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[cat.category] || '#64748b' }}
                  ></span>
                  <span className="font-semibold text-slate-700">{cat.category}</span>
                  <span className="text-slate-400">({cat.percentage}%)</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly Trend Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-800">Monthly Spending Trend</h2>
            </div>
            <span className="text-xs font-semibold text-slate-400">Chronological</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {loading ? (
              <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            ) : monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <RechartsTooltip content={<CustomMonthlyTooltip />} />
                  <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm font-semibold text-slate-400">No monthly data yet</p>
                <p className="text-xs text-slate-400 mt-0.5">Start spending to see trends</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Recent Transactions</h2>
          </div>
          <Link
            to="/expenses"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-7 h-7 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-400">Loading recent expenses...</p>
          </div>
        ) : recentExpenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-5">Description</th>
                  <th className="py-3 px-5">Payment Method</th>
                  <th className="py-3 px-5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 text-xs text-slate-500 whitespace-nowrap">
                      {expense.date}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          CATEGORY_BADGES[expense.category] || 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {expense.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-medium text-slate-800 max-w-xs truncate">
                      {expense.description}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${
                          PAYMENT_BADGES[expense.payment_method] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {expense.payment_method}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-extrabold text-slate-900 text-right whitespace-nowrap">
                      ₹{Number(expense.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">No expenses recorded yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Get started by adding your first expense transaction to view insights and charts.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Your First Expense</span>
            </button>
          </div>
        )}
      </div>

      {/* Quick Add Expense Modal */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={fetchDashboardData}
      />
    </div>
  )
}

export default Dashboard
