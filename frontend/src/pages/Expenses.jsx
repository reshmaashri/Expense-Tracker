import React, { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Receipt,
  PlusCircle,
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  AlertCircle,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  CheckCircle2,
} from 'lucide-react'
import api from '../services/api'
import ExpenseModal from '../components/ExpenseModal'
import DeleteModal from '../components/DeleteModal'
import {
  EXPENSE_CATEGORIES,
  CATEGORY_BADGES,
  PAYMENT_BADGES,
} from '../services/categories'

const Expenses = () => {
  const location = useLocation()
  const navigate = useNavigate()

  // Expenses data & pagination state
  const [expenses, setExpenses] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  // Filtering & search state
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [category, setCategory] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')

  // Status states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notification, setNotification] = useState(null)

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [expenseToEdit, setExpenseToEdit] = useState(null)
  const [expenseToDelete, setExpenseToDelete] = useState(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Mobile filters toggle
  const [showFilters, setShowFilters] = useState(false)

  // Auto-open modal if accessed via /expenses/new
  useEffect(() => {
    if (location.pathname === '/expenses/new') {
      setExpenseToEdit(null)
      setIsExpenseModalOpen(true)
    }
  }, [location.pathname])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to page 1 on search change
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch expenses from real FastAPI endpoint
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const params = {
        page,
        limit,
        sort_by: sortBy,
        sort_order: sortOrder,
      }

      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim()
      }
      if (category) {
        params.category = category
      }
      if (startDate) {
        params.start_date = startDate
      }
      if (endDate) {
        params.end_date = endDate
      }

      const res = await api.get('/api/expenses', { params })
      setExpenses(res.data.expenses || [])
      setTotal(res.data.total || 0)
      setTotalPages(res.data.total_pages || 1)
    } catch (err) {
      console.error('Failed to fetch expenses:', err)
      setError('Unable to load expenses. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [page, limit, sortBy, sortOrder, debouncedSearch, category, startDate, endDate])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  // Clear all filters
  const handleClearFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setCategory('')
    setStartDate('')
    setEndDate('')
    setSortBy('date')
    setSortOrder('desc')
    setPage(1)
  }

  const hasActiveFilters = Boolean(
    debouncedSearch || category || startDate || endDate || sortBy !== 'date' || sortOrder !== 'desc'
  )

  // Handle Modal Close
  const handleCloseExpenseModal = () => {
    setIsExpenseModalOpen(false)
    setExpenseToEdit(null)
    if (location.pathname === '/expenses/new') {
      navigate('/expenses', { replace: true })
    }
  }

  // Handle Edit Action
  const handleEditClick = (expense) => {
    setExpenseToEdit(expense)
    setIsExpenseModalOpen(true)
  }

  // Handle Delete Click
  const handleDeleteClick = (expense) => {
    setExpenseToDelete(expense)
    setIsDeleteModalOpen(true)
  }

  // Confirm Delete
  const handleConfirmDelete = async (expenseId) => {
    try {
      setIsDeleting(true)
      await api.delete(`/api/expenses/${expenseId}`)
      setIsDeleteModalOpen(false)
      setExpenseToDelete(null)
      showToast('Expense successfully deleted')
      // If was last item on page and page > 1, go to prev page
      if (expenses.length === 1 && page > 1) {
        setPage((prev) => prev - 1)
      } else {
        fetchExpenses()
      }
    } catch (err) {
      console.error('Delete expense error:', err)
      setError('Failed to delete expense. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Show temporary toast notification
  const showToast = (message) => {
    setNotification(message)
    setTimeout(() => {
      setNotification(null)
    }, 4000)
  }

  // Sort handler
  const handleSortChange = (e) => {
    const value = e.target.value
    if (value === 'date-desc') {
      setSortBy('date')
      setSortOrder('desc')
    } else if (value === 'date-asc') {
      setSortBy('date')
      setSortOrder('asc')
    } else if (value === 'amount-desc') {
      setSortBy('amount')
      setSortOrder('desc')
    } else if (value === 'amount-asc') {
      setSortBy('amount')
      setSortOrder('asc')
    }
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-600 text-white text-sm font-semibold rounded-2xl shadow-xl animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Receipt className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-800">
              Expense Management
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            View, filter, search, and manage all your logged expense transactions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchExpenses}
            title="Refresh List"
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            id="add-expense-btn"
            onClick={() => {
              setExpenseToEdit(null)
              setIsExpenseModalOpen(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-sm hover:shadow transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Expense</span>
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
            onClick={fetchExpenses}
            className="px-3 py-1 rounded-lg bg-rose-100 text-rose-800 text-xs font-semibold hover:bg-rose-200 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by description or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={handleSortChange}
                className="appearance-none pl-8 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
              >
                <option value="date-desc">Date: Newest First</option>
                <option value="date-asc">Date: Oldest First</option>
                <option value="amount-desc">Amount: Highest First</option>
                <option value="amount-asc">Amount: Lowest First</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Mobile Filters Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`md:hidden inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-bold transition-colors ${
                showFilters || hasActiveFilters
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Detailed Filters (Always visible on desktop, toggleable on mobile) */}
        <div
          className={`${
            showFilters ? 'grid' : 'hidden md:grid'
          } grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100 items-end`}
        >
          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value)
                setPage(1)
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
            >
              <option value="">All Categories</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setPage(1)
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setPage(1)
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>

          {/* Actions / Reset */}
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Expense Table / Card Container */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        {/* Table summary stats bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing{' '}
            <span className="font-bold text-slate-800">
              {total === 0 ? 0 : (page - 1) * limit + 1}
            </span>{' '}
            to{' '}
            <span className="font-bold text-slate-800">
              {Math.min(page * limit, total)}
            </span>{' '}
            of <span className="font-bold text-indigo-600">{total}</span> expenses
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">Per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value))
                setPage(1)
              }}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* State: Loading Skeleton */}
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-slate-50 gap-4"
              >
                <div className="flex items-center gap-3 w-full sm:w-1/3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0"></div>
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 bg-slate-200 rounded w-24"></div>
                    <div className="h-2.5 bg-slate-200 rounded w-36"></div>
                  </div>
                </div>
                <div className="h-4 bg-slate-200 rounded w-24 hidden md:block"></div>
                <div className="h-4 bg-slate-200 rounded w-20"></div>
                <div className="h-8 bg-slate-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        ) : expenses.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">Date</th>
                    <th className="py-3.5 px-6">Category</th>
                    <th className="py-3.5 px-6">Description</th>
                    <th className="py-3.5 px-6">Payment Method</th>
                    <th className="py-3.5 px-6 text-right">Amount</th>
                    <th className="py-3.5 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      <td className="py-4 px-6 text-xs text-slate-500 whitespace-nowrap font-medium">
                        {item.date}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            CATEGORY_BADGES[item.category] ||
                            'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          {item.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-800 max-w-sm truncate" title={item.description}>
                        {item.description}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium ${
                            PAYMENT_BADGES[item.payment_method] ||
                            'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.payment_method}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-black text-slate-900 text-right whitespace-nowrap text-base">
                        ₹{Number(item.amount).toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEditClick(item)}
                            title="Edit Expense"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(item)}
                            title="Delete Expense"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
              {expenses.map((item) => (
                <div key={item.id} className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            CATEGORY_BADGES[item.category] ||
                            'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          {item.category}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {item.date}
                        </span>
                      </div>
                      <p className="font-bold text-slate-800 text-sm">{item.description}</p>
                    </div>
                    <span className="text-base font-black text-slate-900 whitespace-nowrap">
                      ₹{Number(item.amount).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium ${
                        PAYMENT_BADGES[item.payment_method] ||
                        'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.payment_method}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditClick(item)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(item)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Empty States */
          <div className="py-16 px-6 text-center">
            {hasActiveFilters ? (
              <div className="max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3">
                  <Filter className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  No matching expenses found
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  We couldn't find any expenses matching your active filter criteria. Try
                  refining your search or reset filters.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            ) : (
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                  <Receipt className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  No expenses recorded yet
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Start tracking your spending by adding your first expense. All your
                  transactions will appear here in real time.
                </p>
                <button
                  onClick={() => {
                    setExpenseToEdit(null)
                    setIsExpenseModalOpen(true)
                  }}
                  className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Your First Expense</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500">
                Page <span className="font-bold text-slate-800">{page}</span> of{' '}
                <span className="font-bold text-slate-800">{totalPages}</span>
              </span>
            </div>

            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page >= totalPages || loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={handleCloseExpenseModal}
        onSaved={() => {
          fetchExpenses()
          showToast(
            expenseToEdit
              ? 'Expense updated successfully!'
              : 'New expense added successfully!'
          )
        }}
        expenseToEdit={expenseToEdit}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setExpenseToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        expense={expenseToDelete}
        loading={isDeleting}
      />
    </div>
  )
}

export default Expenses
