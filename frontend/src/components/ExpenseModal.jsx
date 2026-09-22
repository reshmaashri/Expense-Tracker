import React, { useState, useEffect } from 'react'
import { X, PlusCircle, Save, AlertCircle, Calendar, Tag, CreditCard, FileText } from 'lucide-react'
import api from '../services/api'

const CATEGORIES = [
  'Food',
  'Transport',
  'Education',
  'Shopping',
  'Entertainment',
  'Bills',
  'Health',
  'Other',
]

const PAYMENT_METHODS = [
  'Cash',
  'UPI',
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'Other',
]

const ExpenseModal = ({ isOpen, onClose, onSaved, expenseToEdit }) => {
  const isEditing = Boolean(expenseToEdit)
  const today = new Date().toISOString().split('T')[0]

  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Food')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(today)
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Populate form if editing
  useEffect(() => {
    if (expenseToEdit) {
      setAmount(expenseToEdit.amount ? String(expenseToEdit.amount) : '')
      setCategory(expenseToEdit.category || 'Food')
      setDescription(expenseToEdit.description || '')
      setDate(expenseToEdit.date || today)
      setPaymentMethod(expenseToEdit.payment_method || 'UPI')
    } else {
      setAmount('')
      setCategory('Food')
      setDescription('')
      setDate(today)
      setPaymentMethod('UPI')
    }
    setError('')
  }, [expenseToEdit, isOpen, today])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Amount must be a positive number greater than 0.')
      return
    }

    if (!description.trim()) {
      setError('Description is required.')
      return
    }

    if (!date) {
      setError('Date is required.')
      return
    }

    const payload = {
      amount: numAmount,
      category,
      description: description.trim(),
      date,
      payment_method: paymentMethod,
    }

    try {
      setLoading(true)
      if (isEditing) {
        await api.put(`/api/expenses/${expenseToEdit.id}`, payload)
      } else {
        await api.post('/api/expenses', payload)
      }
      onSaved()
      onClose()
    } catch (err) {
      console.error('Save expense error:', err)
      const detail = err.response?.data?.detail
      if (typeof detail === 'string') {
        setError(detail)
      } else if (Array.isArray(detail)) {
        setError(detail.map((d) => d.msg).join(', '))
      } else {
        setError('Failed to save expense. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              {isEditing ? <Save className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {isEditing ? 'Edit Expense' : 'Add New Expense'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEditing ? 'Update transaction details' : 'Record a new spending transaction'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-center gap-2 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Category & Payment Method Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <div className="relative">
                <Tag className="absolute inset-y-0 left-0 my-auto ml-3 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors appearance-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Method
              </label>
              <div className="relative">
                <CreditCard className="absolute inset-y-0 left-0 my-auto ml-3 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors appearance-none"
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm} value={pm}>
                      {pm}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute inset-y-0 left-0 my-auto ml-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <div className="relative">
              <FileText className="absolute top-3 left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What was this expense for? (e.g. Lunch with team, monthly bus pass)"
                className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-100 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {isEditing ? <Save className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                  <span>{isEditing ? 'Save Changes' : 'Add Expense'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ExpenseModal
