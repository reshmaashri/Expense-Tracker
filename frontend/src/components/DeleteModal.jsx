import React from 'react'
import { AlertTriangle, X, Trash2 } from 'lucide-react'

const DeleteModal = ({ isOpen, onClose, onConfirm, expense, loading }) => {
  if (!isOpen || !expense) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4">
          <h3 className="text-lg font-bold text-slate-800">Delete Expense</h3>
          <p className="text-sm text-slate-500 mt-1">
            Are you sure you want to delete this expense? This action cannot be undone.
          </p>

          <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between text-sm">
            <div>
              <p className="font-semibold text-slate-800">{expense.description}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {expense.category} • {expense.date}
              </p>
            </div>
            <span className="font-extrabold text-slate-900 text-base">
              ₹{Number(expense.amount).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(expense.id)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteModal
