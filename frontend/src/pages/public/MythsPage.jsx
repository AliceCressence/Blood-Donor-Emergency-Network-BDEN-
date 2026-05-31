import { useEffect, useState } from 'react'
import { BookOpen, CheckCircle, Filter, Loader2, XCircle } from 'lucide-react'
import { mythApi } from '../../services/app.service'
import { EmptyState, ErrorState } from '../../components/shared/DataStates'

const CATEGORIES = ['', 'HEALTH', 'PROCEDURAL', 'ELIGIBILITY', 'RELIGIOUS', 'CULTURAL']

export default function MythsPage() {
  const [articles, setArticles] = useState([])
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    const timer = setTimeout(() => {
      setLoading(true)
      mythApi.list({ category: category || undefined })
        .then(data => { if (mounted) { setArticles(data); setError('') } })
        .catch(err => { if (mounted) setError(err.message) })
        .finally(() => { if (mounted) setLoading(false) })
    }, 0)
    return () => { mounted = false; clearTimeout(timer) }
  }, [category])

  return (
    <div className="bg-warm-950 text-white">
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-teal-400">Blood donation facts</p>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Clear answers for common fears</h1>
          <p className="mx-auto mt-4 max-w-2xl text-warm-400">Myths can keep willing donors away. These short guides explain what is true in plain language.</p>
        </div>
      </section>

      <main className="mx-auto max-w-5xl space-y-8 px-4 pb-16">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-warm-800 bg-warm-900/60 p-3">
          <Filter size={16} className="text-warm-500" />
          {CATEGORIES.map(item => (
            <button key={item || 'all'} onClick={() => setCategory(item)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${category === item ? 'bg-teal-500 text-warm-950' : 'bg-white/5 text-warm-300 hover:bg-white/10'}`}>
              {item ? item.toLowerCase().replace('_', ' ') : 'all'}
            </button>
          ))}
        </div>

        {error && <ErrorState message={error} />}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-warm-400"><Loader2 className="mr-2 animate-spin" /> Loading facts...</div>
        ) : articles.length === 0 ? (
          <EmptyState icon={BookOpen} title="No articles here yet" description="Published myth guides will appear here once the team adds them." />
        ) : (
          <div className="grid gap-5">
            {articles.map(article => (
              <article key={article.id} className="rounded-2xl border border-warm-800 bg-warm-900/60 p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="font-display text-xl font-bold text-white">{article.title}</h2>
                  <span className="rounded-full bg-teal-500/10 px-2.5 py-1 text-xs font-semibold text-teal-300">{article.category}</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-blood-800/60 bg-blood-950/30 p-4">
                    <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blood-300"><XCircle size={14} /> Myth</p>
                    <p className="text-sm leading-relaxed text-warm-300">{article.myth_statement}</p>
                  </div>
                  <div className="rounded-xl border border-teal-800/60 bg-teal-950/30 p-4">
                    <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-teal-300"><CheckCircle size={14} /> Fact</p>
                    <p className="text-sm leading-relaxed text-warm-300">{article.truth_statement}</p>
                  </div>
                </div>
                {article.source && <p className="mt-3 text-xs text-warm-600">Source: {article.source}</p>}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
