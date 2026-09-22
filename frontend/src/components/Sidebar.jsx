import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Receipt,
  PlusCircle,
  PieChart,
  User,
  X,
  ShieldCheck,
} from 'lucide-react'

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Expenses', path: '/expenses', icon: Receipt },
  { name: 'Add Expense', path: '/expenses/new', icon: PlusCircle },
  { name: 'Analytics', path: '/analytics', icon: PieChart },
  { name: 'Profile', path: '/profile', icon: User },
]

const Sidebar = ({ open, onClose }) => {
  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header with close button */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 lg:hidden">
          <span className="font-bold text-slate-800 tracking-tight">Navigation</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Main Menu
          </p>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 shadow-xs border border-indigo-100/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            )
          })}
        </div>

        {/* Footer info banner */}
        <div className="p-4 m-4 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-bold">Cloud Connected</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            FastAPI + MongoDB Atlas Mini-Project
          </p>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
