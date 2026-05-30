import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, CheckCircle, Clock, Droplets, MapPin } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { requestApi } from '../../services/app.service'
import { CardShimmer, ConfirmModal, ErrorState } from '../../components/shared/DataStates'

export default function RequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [responded, setResponded] = useState(false)

  useEffect(() => {
    requestApi.detail(id)
      .then(setRequest)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const respond = async () => {
    setConfirm(false)
    try {
      await requestApi.respond(id, { donor_id: user.id, status: 'ACCEPTED' })
      setResponded(true)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-semibold text-warm-500 hover:text-warm-900">
        <ArrowLeft size={16} /> Back
      </button>

      {loading && <CardShimmer rows={8} />}
      {error && <ErrorState message={error} />}
      {request && (
        <div className="bg-white rounded-2xl border border-warm-200 shadow-card overflow-hidden">
          <div className="p-6 border-b border-warm-100 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-12 h-12 rounded-xl bg-blood-50 border border-blood-200 flex items-center justify-center font-mono font-black text-blood-700">{request.bloodType}</span>
                <span className="badge-emergency">{request.urgency.toUpperCase()}</span>
              </div>
              <h1 className="font-display text-2xl font-bold text-warm-950">{request.hospital}</h1>
              <p className="text-sm text-warm-500 mt-1">{request.notes || 'Emergency blood request'}</p>
            </div>
            <AlertTriangle className="text-blood-600" />
          </div>
          <div className="grid sm:grid-cols-3 gap-4 p-6">
            <div className="rounded-2xl bg-warm-50 p-4"><Droplets size={16} className="text-blood-600 mb-2" /><p className="text-xs text-warm-500">Units needed</p><p className="font-bold text-warm-950">{request.unitsNeeded}</p></div>
            <div className="rounded-2xl bg-warm-50 p-4"><MapPin size={16} className="text-blue-600 mb-2" /><p className="text-xs text-warm-500">City</p><p className="font-bold text-warm-950">{request.city || 'Nearby'}</p></div>
            <div className="rounded-2xl bg-warm-50 p-4"><Clock size={16} className="text-amber-600 mb-2" /><p className="text-xs text-warm-500">Posted</p><p className="font-bold text-warm-950">{request.postedAgo}</p></div>
          </div>
          <div className="p-6 pt-0">
            {responded ? (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3 text-sm font-semibold text-emerald-700">
                <CheckCircle size={18} /> Your response has been sent.
              </div>
            ) : (
              <button onClick={() => setConfirm(true)} className="btn-primary w-full py-3">
                <CheckCircle size={16} /> I can help with this request
              </button>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirm}
        title="Respond to this request?"
        description="The hospital will see that you are willing to help. Only continue if you can be contacted soon and feel well enough to donate."
        confirmLabel="Send response"
        onCancel={() => setConfirm(false)}
        onConfirm={respond}
      />
    </div>
  )
}
