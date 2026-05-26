// src/components/shared/ErrorBoundary.jsx
import { Component } from 'react'
import { Droplets, RefreshCw, Home } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('BDEN Error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-warm-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-blood-50 border-2 border-blood-200
                            flex items-center justify-center mx-auto mb-6">
              <Droplets size={28} className="text-blood-400" />
            </div>
            <h1 className="font-display text-2xl font-bold text-warm-950 mb-2">
              Something went wrong
            </h1>
            <p className="text-warm-500 text-sm mb-8">
              An unexpected error occurred. Your data is safe — please refresh the page or go back home.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                           bg-blood-600 text-white font-semibold text-sm hover:bg-blood-700 transition-colors">
                <RefreshCw size={15} /> Refresh page
              </button>
              <a href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                           bg-white border border-warm-200 text-warm-700 font-semibold text-sm
                           hover:bg-warm-50 transition-colors">
                <Home size={15} /> Go home
              </a>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}