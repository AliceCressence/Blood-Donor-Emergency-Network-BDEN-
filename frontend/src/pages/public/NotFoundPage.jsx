// src/pages/public/NotFoundPage.jsx
import { Link } from 'react-router-dom'
import { Droplets, ArrowLeft, Heart } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-warm-950 flex items-center justify-center p-6 relative overflow-hidden">

      {/* Background drop */}
      <div className="absolute top-0 right-0 w-96 h-96 opacity-[0.05]">
        <svg viewBox="0 0 200 240" fill="none">
          <path d="M100 10 C100 10 20 100 20 150 A80 80 0 0 0 180 150 C180 100 100 10 100 10Z" fill="#E51111"/>
        </svg>
      </div>

      <div className="relative z-10 text-center max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-12">
          <div className="w-9 h-9 rounded-xl bg-blood-600 flex items-center justify-center">
            <Droplets size={18} className="text-white" />
          </div>
          <span className="font-display font-bold text-xl text-white">
            BD<span className="text-blood-500">EN</span>
          </span>
        </div>

        {/* 404 */}
        <h1 className="font-display text-8xl font-bold text-blood-600 mb-4 leading-none">
          404
        </h1>
        <h2 className="font-display text-2xl font-bold text-white mb-3">
          Page not found
        </h2>
        <p className="text-warm-400 text-base leading-relaxed mb-10">
          The page you're looking for doesn't exist. It may have been moved or the URL might be wrong.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl
                       bg-blood-600 hover:bg-blood-700 text-white font-semibold transition-all
                       hover:-translate-y-0.5">
            <ArrowLeft size={16} /> Back to home
          </Link>
          <Link to="/register"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl
                       bg-white/10 hover:bg-white/15 border border-white/20
                       text-white font-semibold transition-all hover:-translate-y-0.5">
            <Heart size={16} /> Register as donor
          </Link>
        </div>
      </div>
    </div>
  )
}