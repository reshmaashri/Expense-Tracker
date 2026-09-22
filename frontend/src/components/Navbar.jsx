import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Wallet, LogOut, User as UserIcon, Menu } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile Menu Toggle & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-slate-800 tracking-tight hidden sm:inline">
                Expense<span className="text-indigo-600">Tracker</span>
              </span>
            </Link>
          </div>

          {/* Right: User Profile & Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 rounded-full hover:bg-slate-100 transition-colors focus:outline-hidden"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-xs border border-indigo-200">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden md:block text-left pr-1">
                    <p className="text-xs font-semibold text-slate-700 leading-tight">{user.name}</p>
                    <p className="text-[10px] text-slate-400 leading-tight">{user.email}</p>
                  </div>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3.5 py-2 border-b border-slate-100">
                      <p className="text-xs font-medium text-slate-400">Signed in as</p>
                      <p className="text-xs font-bold text-slate-800 truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                    >
                      <UserIcon className="w-4 h-4" />
                      My Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
