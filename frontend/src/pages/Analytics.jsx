import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  Wallet,
  Calendar,
  Award,
  AlertCircle,
  RefreshCw,
  PlusCircle,
  ArrowRight,
  Sparkles,
  Layers,
  ArrowUpRight,
} from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts'
import api from '../services/api'
import { CATEGORY_COLORS, CATEGORY_BADGES } from '../services/categories'

// Tooltips declared outside render to maintain pure rendering lifecycle
const CustomCategoryTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-3.5 rounded-2xl shadow-xl border border-slate-100 text-xs">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: CATEGORY_COLORS[data.category] || '#64748b' }}
          />
          <p className="font-bold text-slate-800 text-sm">{data.category}</p>
        </div>
        <p className="text-indigo-600 font-black text-base">
          ₹{Number(data.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </p>
        <div className="mt-1 flex items-center gap-3 text-slate-400 text-[11px] font-medium">
          <span>{data.count} transaction{data.count !== 1 ? 's' : ''}</span>
          <span>•</span>
          <span className="font-bold text-slate-600">{data.percentage}% of total</span>
        </div>
      </div>
    )
  }
  return null
}

const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-3.5 rounded-2xl shadow-xl border border-slate-100 text-xs">
        <p className="font-bold text-slate-800 text-sm mb-1">{label}</p>
        <p className="text-emerald-600 font-black text-base">
          ₹{Number(payload[0].value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-slate-400 text-[11px] mt-0.5">
          {data.count} transaction{data.count !== 1 ? 's' : ''} recorded
        </p>
      </div>
    )
  }
  return null
}

const CustomLineTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3.5 rounded-2xl shadow-xl border border-slate-100 text-xs">
        <p className="font-bold text-slate-800 text-sm mb-1">{label} Spending</p>
        <p className="text-violet-600 font-black text-base">
          ₹{Number(payload[0].value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-slate-400 text-[11px] mt-0.5 font-medium">
          Monthly expenditure trend
        </p>
      </div>
    )
  }
  return null
}

const Analytics = () => {
  const [summary, setSummary] = useState(null)
  const [categories, setCategories] = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const [sumRes, catRes, monRes] = await Promise.all([
        api.get('/api/analytics/summary'),
        api.get('/api/analytics/category'),
        api.get('/api/analytics/monthly'),
      ])

      setSummary(sumRes.data)
      setCategories(catRes.data.categories || [])
      setMonthlyData(monRes.data.months || [])
    } catch (err) {
      console.error('Failed to load analytics:', err)
      setError('Unable to fetch financial analytics. Please verify server connection and retry.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalyticsData()
  }, [fetchAnalyticsData])

  // Derive metrics
  const totalSpending = summary?.total_expenses || 0
  const highestExpense = summary?.highest_expense || 0
  const transactionCount = summary?.transaction_count || 0
  const topCategory = categories.length > 0 ? categories[0] : null
  const currentMonthSpending = summary?.current_month_expenses || 0

  const hasData = totalSpending > 0 || transactionCount > 0

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-purple-100/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold backdrop-blur-xs mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Financial Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Spending & Expense Analytics
          </h1>
          <p className="text-purple-100 text-xs sm:text-sm mt-1 max-w-xl">
            In-depth category distributions, monthly trajectories, and pattern breakdowns powered by real-time aggregation.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchAnalyticsData}
            title="Refresh Analytics"
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/expenses/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-violet-700 text-sm font-bold shadow-md hover:bg-violet-50 transition-all hover:shadow-lg active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Expense</span>
          </Link>
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
            onClick={fetchAnalyticsData}
            className="px-3 py-1 rounded-lg bg-rose-100 text-rose-800 text-xs font-semibold hover:bg-rose-200 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* 4 Summary Analytics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spending */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Spending
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-slate-800 tracking-tight">
              {loading ? '...' : `₹${Number(totalSpending).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Across {transactionCount} total transaction{transactionCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Top Spending Category */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Top Category
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            {loading ? (
              <p className="text-2xl font-black text-slate-800">...</p>
            ) : topCategory ? (
              <>
                <p className="text-2xl font-black text-amber-600 tracking-tight flex items-center gap-1.5 truncate">
                  {topCategory.category}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  ₹{Number(topCategory.amount).toFixed(2)} ({topCategory.percentage}% of budget)
                </p>
              </>
            ) : (
              <>
                <p className="text-xl font-bold text-slate-400">None yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">No categorized expenses</p>
              </>
            )}
          </div>
        </div>

        {/* Highest Expense */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Highest Expense
            </span>
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-violet-600 tracking-tight">
              {loading ? '...' : `₹${Number(highestExpense).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Largest single transaction</p>
          </div>
        </div>

        {/* Current Month Spending */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              This Month
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-emerald-600 tracking-tight">
              {loading ? '...' : `₹${Number(currentMonthSpending).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts & Visualization Section */}
      {loading ? (
        /* Loading Skeleton */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`bg-white p-6 rounded-3xl border border-slate-100 shadow-xs animate-pulse h-80 flex flex-col justify-between ${
                i === 2 ? 'lg:col-span-2' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="h-5 bg-slate-200 rounded w-36"></div>
                <div className="h-4 bg-slate-200 rounded w-20"></div>
              </div>
              <div className="w-full h-48 bg-slate-100 rounded-2xl"></div>
              <div className="h-4 bg-slate-200 rounded w-48"></div>
            </div>
          ))}
        </div>
      ) : hasData ? (
        <div className="space-y-6">
          {/* Row 1: Pie Chart & Bar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Category Distribution (Pie/Donut Chart) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                      <PieIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-800">
                        Category Distribution
                      </h2>
                      <p className="text-xs text-slate-400">
                        Proportional breakdown of total expenditure
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                    {categories.length} Categories
                  </span>
                </div>

                <div className="h-68 w-full flex items-center justify-center mt-4">
                  {categories.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categories}
                          dataKey="amount"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={95}
                          paddingAngle={3}
                        >
                          {categories.map((entry) => (
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
                    <div className="text-center py-10 text-slate-400 text-xs">
                      No category breakdown available
                    </div>
                  )}
                </div>
              </div>

              {/* Interactive Category Legend Grid */}
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {categories.map((cat) => (
                  <div
                    key={cat.category}
                    className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[cat.category] || '#64748b' }}
                      />
                      <span className="font-bold text-slate-700 truncate">{cat.category}</span>
                    </div>
                    <div className="flex items-baseline justify-between text-[11px]">
                      <span className="font-extrabold text-slate-900">₹{Math.round(cat.amount)}</span>
                      <span className="text-slate-400 font-semibold">{cat.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Monthly Comparison (Bar Chart) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-800">
                        Monthly Spending Comparison
                      </h2>
                      <p className="text-xs text-slate-400">
                        Monthly financial volume comparison
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                    {monthlyData.length} Month{monthlyData.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="h-68 w-full flex items-center justify-center mt-4">
                  {monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlyData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
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
                        <RechartsTooltip content={<CustomBarTooltip />} />
                        <Bar
                          dataKey="amount"
                          fill="#10b981"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      No monthly comparison data available
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Monthly average spending:</span>
                <span className="font-extrabold text-slate-800">
                  ₹
                  {monthlyData.length > 0
                    ? Math.round(totalSpending / monthlyData.length).toLocaleString('en-IN')
                    : 0}
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: Monthly Trend Trajectory (Line Chart) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    Monthly Expenditure Trend
                  </h2>
                  <p className="text-xs text-slate-400">
                    Chronological curve tracking financial velocity and variance over time
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  Expenditure Trajectory
                </span>
              </div>
            </div>

            <div className="h-72 w-full mt-2">
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyData}
                    margin={{ top: 15, right: 20, left: 0, bottom: 5 }}
                  >
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
                    <RechartsTooltip content={<CustomLineTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#6366f1"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 2 }}
                      activeDot={{ r: 7, fill: '#4f46e5', stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No trend data available
                </div>
              )}
            </div>
          </div>

          {/* Detailed Category Table Breakdown */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    Category Breakdown & Share
                  </h2>
                  <p className="text-xs text-slate-400">
                    Comprehensive performance of each expense category
                  </p>
                </div>
              </div>
              <Link
                to="/expenses"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                View Expenses <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">Category</th>
                    <th className="py-3.5 px-6 text-center">Transactions</th>
                    <th className="py-3.5 px-6">Budget Allocation</th>
                    <th className="py-3.5 px-6 text-right">Avg / Txn</th>
                    <th className="py-3.5 px-6 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map((cat) => {
                    const avg = cat.count > 0 ? cat.amount / cat.count : 0
                    return (
                      <tr key={cat.category} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{
                                backgroundColor: CATEGORY_COLORS[cat.category] || '#64748b',
                              }}
                            />
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                CATEGORY_BADGES[cat.category] ||
                                'bg-slate-50 text-slate-700 border-slate-200'
                              }`}
                            >
                              {cat.category}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center text-xs font-bold text-slate-700">
                          {cat.count}
                        </td>
                        <td className="py-4 px-6">
                          <div className="w-full max-w-xs flex items-center gap-2.5">
                            <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${cat.percentage}%`,
                                  backgroundColor:
                                    CATEGORY_COLORS[cat.category] || '#6366f1',
                                }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-700 w-10 text-right">
                              {cat.percentage}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right text-xs font-semibold text-slate-600 whitespace-nowrap">
                          ₹{Number(avg).toFixed(2)}
                        </td>
                        <td className="py-4 px-6 font-extrabold text-slate-900 text-right whitespace-nowrap text-base">
                          ₹{Number(cat.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto mb-4">
            <PieIcon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            No spending data to analyze yet
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto">
            Once you log your daily expenses, our aggregation engine will generate detailed category distributions, monthly comparisons, and trend curves.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/expenses/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold shadow-md transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record Your First Expense</span>
            </Link>
            <Link
              to="/expenses"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              <span>Go to Expenses</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default Analytics
