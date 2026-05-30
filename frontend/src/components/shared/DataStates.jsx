import { AlertCircle, CheckCircle, HelpCircle, Loader2, X } from 'lucide-react'

export function Shimmer({ className = '' }) {
  return <div className={`shimmer rounded-xl ${className}`} />
}

export function CardShimmer({ rows = 3 }) {
  return (
    <div className="bg-white rounded-2xl border border-warm-200 shadow-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Shimmer className="w-11 h-11 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Shimmer className="h-3 w-2/5" />
          <Shimmer className="h-3 w-3/5" />
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => <Shimmer key={i} className="h-3 w-full" />)}
    </div>
  )
}

export function EmptyState({ icon: Icon = CheckCircle, title, description, action }) {
  return (
    <div className="bg-white rounded-2xl border border-warm-200 shadow-card p-8 text-center transition-all duration-300">
      <div className="w-12 h-12 rounded-2xl bg-warm-100 flex items-center justify-center mx-auto mb-4">
        <Icon size={22} className="text-warm-500" />
      </div>
      <p className="font-display font-semibold text-warm-900">{title}</p>
      {description && <p className="text-sm text-warm-500 max-w-sm mx-auto mt-1">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-sm text-red-700">
      <AlertCircle size={18} className="shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && <button onClick={onRetry} className="font-semibold hover:text-red-900">Retry</button>}
    </div>
  )
}

export function ConfirmModal({ open, title, description, confirmLabel = 'Confirm', danger = false, loading = false, onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center px-4">
      <button className="absolute inset-0 bg-black/35 backdrop-blur-sm" onClick={onCancel} aria-label="Close" />
      <div className="relative w-full max-w-sm rounded-2xl bg-white border border-warm-200 shadow-2xl p-6">
        <button onClick={onCancel} className="absolute top-4 right-4 p-1.5 rounded-lg text-warm-400 hover:bg-warm-100">
          <X size={16} />
        </button>
        <h2 className="font-display text-xl font-bold text-warm-950 pr-8">{title}</h2>
        <p className="text-sm text-warm-500 mt-2 leading-relaxed">{description}</p>
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`btn flex-1 text-white ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blood-600 hover:bg-blood-700'}`}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function InfoTip({ children }) {
  return (
    <span className="relative inline-flex group">
      <HelpCircle size={14} className="text-warm-400 hover:text-warm-700" />
      <span className="pointer-events-none absolute right-0 top-6 z-50 w-56 rounded-xl bg-warm-950 px-3 py-2 text-xs text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
        {children}
      </span>
    </span>
  )
}

export function DashboardSplash({ show }) {
  if (!show) return null
  return (
    <div className="fixed inset-0 z-[1100] bg-white flex items-center justify-center overflow-hidden">
      <div className="blood-splash" />
      <img src="/favicon.svg" alt="BDEN" className="relative z-10 w-20 h-20 rounded-3xl shadow-2xl animate-splash-logo" />
    </div>
  )
}
