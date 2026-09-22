export const CATEGORY_COLORS = {
  Food: '#f59e0b',          // Amber
  Transport: '#0ea5e9',     // Sky Blue
  Education: '#8b5cf6',     // Violet
  Shopping: '#ec4899',      // Pink
  Entertainment: '#6366f1', // Indigo
  Bills: '#10b981',         // Emerald
  Health: '#f43f5e',        // Rose
  Other: '#64748b',         // Slate
}

export const CATEGORY_BADGES = {
  Food: 'bg-amber-50 text-amber-700 border-amber-200/80',
  Transport: 'bg-sky-50 text-sky-700 border-sky-200/80',
  Education: 'bg-violet-50 text-violet-700 border-violet-200/80',
  Shopping: 'bg-pink-50 text-pink-700 border-pink-200/80',
  Entertainment: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
  Bills: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  Health: 'bg-rose-50 text-rose-700 border-rose-200/80',
  Other: 'bg-slate-50 text-slate-700 border-slate-200/80',
}

export const PAYMENT_BADGES = {
  Cash: 'bg-slate-100 text-slate-700',
  UPI: 'bg-emerald-50 text-emerald-700',
  'Credit Card': 'bg-purple-50 text-purple-700',
  'Debit Card': 'bg-blue-50 text-blue-700',
  'Bank Transfer': 'bg-cyan-50 text-cyan-700',
  Other: 'bg-slate-100 text-slate-700',
}

export const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Education',
  'Shopping',
  'Entertainment',
  'Bills',
  'Health',
  'Other',
]

export const PAYMENT_METHODS = [
  'Cash',
  'UPI',
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'Other',
]

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0)
}

