import { useEffect, useRef, useState } from 'react'
import { Bold, BookOpen, CheckCircle, Italic, List, ListOrdered, Loader2, Plus, Quote, Save } from 'lucide-react'
import { mythApi } from '../../services/app.service'
import { EmptyState, ErrorState } from '../../components/shared/DataStates'

const EMPTY = {
  title: '',
  category: 'HEALTH',
  myth_statement: '',
  truth_statement: '',
  source: '',
  is_published: true,
}

const CATEGORIES = ['HEALTH', 'PROCEDURAL', 'ELIGIBILITY', 'RELIGIOUS', 'CULTURAL']

export default function MythEditor() {
  const [articles, setArticles] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const editorRef = useRef(null)

  useEffect(() => {
    let mounted = true
    const timer = setTimeout(() => {
      mythApi.list()
        .then(data => { if (mounted) setArticles(data) })
        .catch(err => { if (mounted) setError(err.message) })
        .finally(() => { if (mounted) setLoading(false) })
    }, 0)
    return () => { mounted = false; clearTimeout(timer) }
  }, [])

  useEffect(() => {
    if (form.truth_statement === '' && editorRef.current?.innerHTML) {
      editorRef.current.innerHTML = ''
    }
  }, [form.truth_statement])

  const set = (key, value) => {
    setForm(current => ({ ...current, [key]: value }))
    setMessage('')
    setError('')
  }

  const syncEditor = () => {
    setForm(current => ({ ...current, truth_statement: editorRef.current?.innerHTML || '' }))
    setMessage('')
    setError('')
  }

  const format = (command, value = null) => {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
    syncEditor()
  }

  const save = async () => {
    if (!form.title || !form.myth_statement || !form.truth_statement) return
    setSaving(true)
    try {
      const created = await mythApi.create(form)
      setArticles(current => [created, ...current])
      setForm(EMPTY)
      setMessage('Myth guide published. It is now available on the public education page.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const insert = text => {
    editorRef.current?.focus()
    document.execCommand('insertHTML', false, `<p><strong>${text}</strong>&nbsp;</p>`)
    syncEditor()
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-warm-950 dark:text-white">Myth Guides</h1>
        <p className="mt-1 text-sm text-neutral-500">Write short, clear myth-busting content donors can trust.</p>
      </div>
      {error && <ErrorState message={error} />}
      {message && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</p>}

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border border-warm-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900 lg:col-span-3">
          <div className="mb-5 flex items-center gap-2">
            <Plus size={18} className="text-blood-600" />
            <h2 className="font-display font-bold text-warm-950 dark:text-white">New myth guide</h2>
          </div>
          <div className="space-y-4">
            <input className="input" placeholder="Title, e.g. Does blood donation make you weak?" value={form.title} onChange={e => set('title', e.target.value)} />
            <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(item => <option key={item} value={item}>{item.toLowerCase()}</option>)}
            </select>
            <textarea className="input min-h-24" placeholder="The myth people believe..." value={form.myth_statement} onChange={e => set('myth_statement', e.target.value)} />
            <div className="rounded-2xl border border-warm-200 dark:border-white/10">
              <div className="flex flex-wrap gap-2 border-b border-warm-100 p-2 dark:border-white/10">
                {[
                  ['bold', Bold, 'Bold'],
                  ['italic', Italic, 'Italic'],
                  ['insertUnorderedList', List, 'Bullets'],
                  ['insertOrderedList', ListOrdered, 'Numbered'],
                  ['formatBlock', Quote, 'Quote', 'blockquote'],
                ].map(([command, Icon, label]) => (
                  <button key={command} type="button" onClick={() => format(command, label === 'Quote' ? 'blockquote' : null)} className="rounded-lg bg-warm-100 p-2 text-warm-700 hover:bg-warm-200" title={label}>
                    <Icon size={14} />
                  </button>
                ))}
                <span className="mx-1 h-8 w-px bg-warm-100" />
                <button type="button" onClick={() => insert('Key fact:')} className="rounded-lg bg-warm-100 px-3 py-1 text-xs font-semibold text-warm-700 hover:bg-warm-200">Key fact</button>
                <button type="button" onClick={() => insert('What this means for donors:')} className="rounded-lg bg-warm-100 px-3 py-1 text-xs font-semibold text-warm-700 hover:bg-warm-200">Donor note</button>
                <button type="button" onClick={() => insert('Safety reminder:')} className="rounded-lg bg-warm-100 px-3 py-1 text-xs font-semibold text-warm-700 hover:bg-warm-200">Safety</button>
              </div>
              <div
                ref={editorRef}
                contentEditable
                className="min-h-44 w-full overflow-y-auto rounded-b-2xl bg-white px-4 py-3 text-sm text-warm-950 outline-none empty:before:text-warm-400 empty:before:content-['The_friendly,_medically_accurate_answer...'] dark:bg-neutral-900 dark:text-white"
                onInput={syncEditor}
              />
            </div>
            <input className="input" placeholder="Source, e.g. WHO Blood Safety Guidelines" value={form.source} onChange={e => set('source', e.target.value)} />
            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-600 dark:text-neutral-300">
              <input type="checkbox" checked={form.is_published} onChange={e => set('is_published', e.target.checked)} />
              Publish immediately
            </label>
            <button onClick={save} disabled={saving || !form.title || !form.myth_statement || !form.truth_statement} className="btn-primary w-full">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save myth guide
            </button>
          </div>
        </section>

        <section className="space-y-3 lg:col-span-2">
          {loading ? <div className="rounded-2xl bg-white p-5 dark:bg-neutral-900"><Loader2 className="animate-spin text-neutral-400" /></div> : articles.length === 0 ? (
            <EmptyState icon={BookOpen} title="No myth guides yet" description="Create the first public education guide from the form." />
          ) : articles.map(article => (
            <article key={article.id} className="rounded-2xl border border-warm-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-neutral-900">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="font-display text-sm font-bold text-warm-950 dark:text-white">{article.title}</h3>
                {article.is_published && <CheckCircle size={15} className="text-emerald-500" />}
              </div>
              <p className="text-xs text-neutral-500">{article.category} · {article.source || 'No source added'}</p>
            </article>
          ))}
        </section>
      </div>
    </div>
  )
}
