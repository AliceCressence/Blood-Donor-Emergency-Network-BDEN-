import { useEffect, useState } from 'react'
import { ImagePlus, Loader2, Save } from 'lucide-react'
import { adApi } from '../../services/app.service'
import { EmptyState, ErrorState } from '../../components/shared/DataStates'

const EMPTY = { title: '', image_url: '', alt_text: '', is_active: true }

export default function BannerAds() {
  const [banners, setBanners] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = () => {
    setLoading(true)
    adApi.listDonorBanners()
      .then(setBanners)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const timer = setTimeout(load, 0)
    return () => clearTimeout(timer)
  }, [])

  const set = (key, value) => {
    setForm(current => ({ ...current, [key]: value }))
    setMessage('')
    setError('')
  }

  const save = async () => {
    if (!form.title || !form.image_url) return
    setSaving(true)
    try {
      const created = await adApi.createDonorBanner(form)
      setBanners(current => [created, ...current.map(item => form.is_active ? { ...item, is_active: false } : item)])
      setForm(EMPTY)
      setMessage('Banner saved. Donor dashboards will show the active image.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const activate = async banner => {
    try {
      const updated = await adApi.updateDonorBanner(banner.id, { is_active: !banner.is_active })
      setBanners(current => current.map(item => item.id === updated.id ? updated : updated.is_active ? { ...item, is_active: false } : item))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-warm-950 dark:text-white">Donor Banner Ads</h1>
        <p className="mt-1 text-sm text-neutral-500">Add a 16:9 landscape image shown quietly inside donor dashboards.</p>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}
      {message && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</p>}

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="rounded-2xl border border-warm-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900 lg:col-span-2">
          <div className="mb-5 flex items-center gap-2">
            <ImagePlus size={18} className="text-blood-600" />
            <h2 className="font-display font-bold text-warm-950 dark:text-white">New banner</h2>
          </div>
          <div className="space-y-4">
            <input className="input" placeholder="Internal title" value={form.title} onChange={e => set('title', e.target.value)} />
            <input className="input" placeholder="Image URL" value={form.image_url} onChange={e => set('image_url', e.target.value)} />
            <input className="input" placeholder="Alt text" value={form.alt_text} onChange={e => set('alt_text', e.target.value)} />
            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-600 dark:text-neutral-300">
              <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} />
              Make active now
            </label>
            {form.image_url && (
              <div className="aspect-video overflow-hidden rounded-2xl border border-warm-200 bg-warm-50">
                <img src={form.image_url} alt={form.alt_text || form.title} className="h-full w-full object-cover" />
              </div>
            )}
            <button onClick={save} disabled={saving || !form.title || !form.image_url} className="btn-primary w-full">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save banner
            </button>
          </div>
        </div>

        <div className="space-y-3 lg:col-span-3">
          {loading ? (
            <div className="rounded-2xl bg-white p-5 dark:bg-neutral-900"><Loader2 className="animate-spin text-neutral-400" /></div>
          ) : banners.length === 0 ? (
            <EmptyState icon={ImagePlus} title="No donor banners yet" description="Add a landscape image URL and it will appear here." />
          ) : banners.map(banner => (
            <article key={banner.id} className="grid gap-4 rounded-2xl border border-warm-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:grid-cols-[180px_1fr]">
              <div className="aspect-video overflow-hidden rounded-xl bg-warm-100">
                <img src={banner.image_url} alt={banner.alt_text || banner.title} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-sm font-bold text-warm-950 dark:text-white">{banner.title}</h3>
                    <p className="mt-1 max-w-full break-all text-xs leading-relaxed text-neutral-500 sm:line-clamp-2">{banner.image_url}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${banner.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-warm-100 text-warm-500'}`}>
                    {banner.is_active ? 'Active' : 'Paused'}
                  </span>
                </div>
                <button onClick={() => activate(banner)} className="rounded-xl border border-warm-200 px-3 py-2 text-xs font-semibold text-warm-700 hover:bg-warm-50">
                  {banner.is_active ? 'Pause' : 'Make active'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
