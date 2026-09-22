import React from 'react'
import { Link } from 'react-router-dom'
import { Home, AlertTriangle } from 'lucide-react'

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-black text-slate-800 tracking-tight">404</h1>
      <h2 className="text-lg font-bold text-slate-700 mt-1">Page Not Found</h2>
      <p className="text-sm text-slate-500 mt-1 max-w-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100"
      >
        <Home className="w-4 h-4" />
        Return to Dashboard
      </Link>
    </div>
  )
}

export default NotFound
