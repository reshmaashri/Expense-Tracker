import React from 'react'
import { User, Mail, Calendar, Shield, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const Profile = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const createdDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Active'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-indigo-100">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{user?.name}</h1>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
        </div>

        <div className="py-6 space-y-4">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <User className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-700 w-28">User ID:</span>
            <span className="font-mono text-xs bg-slate-50 px-2 py-1 rounded-md border border-slate-200 text-slate-600">
              {user?.id}
            </span>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-600">
            <Mail className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-700 w-28">Email:</span>
            <span>{user?.email}</span>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-700 w-28">Member Since:</span>
            <span>{createdDate}</span>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-600">
            <Shield className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-700 w-28">Session:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              JWT Authenticated
            </span>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log out of account
          </button>
        </div>
      </div>
    </div>
  )
}

export default Profile
