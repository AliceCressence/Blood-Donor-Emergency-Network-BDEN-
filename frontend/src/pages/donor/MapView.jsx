import { useEffect, useMemo, useRef, useState } from 'react'
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { AlertTriangle, Building2, CalendarDays, ChevronLeft, ChevronRight, LayoutList, LocateFixed, Map, MapPin, Navigation, X } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { campaignApi, donorApi, requestApi } from '../../services/app.service'

const YAOUNDE_CENTER = [3.8667, 11.5167]
const FILTERS = [
  { id: 'all', label: 'All', icon: MapPin, activeClass: 'bg-neutral-800 text-white' },
  { id: 'emergency', label: 'Urgent needs', icon: AlertTriangle, activeClass: 'bg-red-600 text-white' },
  { id: 'campaign', label: 'Campaigns', icon: CalendarDays, activeClass: 'bg-blue-600 text-white' },
  { id: 'facility', label: 'Screening centers', icon: Building2, activeClass: 'bg-emerald-600 text-white' },
]

function markerIcon(type) {
  const color = { emergency: '#dc2626', campaign: '#2563eb', facility: '#059669', user: '#2563eb' }[type] || '#111827'
  const glyph = { emergency: '!', campaign: 'C', facility: '+', user: '•' }[type] || ''
  return L.divIcon({
    className: '',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -18],
    html: `<div style="width:38px;height:38px;border-radius:19px;background:${color};box-shadow:0 14px 28px rgba(15,23,42,.22), inset 0 0 0 4px rgba(255,255,255,.92);display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:18px;">${glyph}</div>`,
  })
}

function FlyTo({ position, trigger }) {
  const map = useMap()
  useEffect(() => {
    if (trigger && position) map.flyTo(position, 15, { duration: 1.1 })
  }, [trigger, position, map])
  return null
}

function MapWatcher({ home, onDistanceChange }) {
  const map = useMap()
  useEffect(() => {
    const update = () => {
      const center = map.getCenter()
      onDistanceChange(home ? center.distanceTo(L.latLng(home[0], home[1])) : 0)
    }
    update()
    map.on('moveend zoomend', update)
    return () => {
      map.off('moveend zoomend', update)
    }
  }, [map, home, onDistanceChange])
  return null
}

function LocationCard({ loc, selected, onClick }) {
  const colors = {
    emergency: selected ? 'border-red-300 bg-red-50' : 'bg-white/90 border-white/60',
    campaign: selected ? 'border-blue-300 bg-blue-50' : 'bg-white/90 border-white/60',
    facility: selected ? 'border-emerald-300 bg-emerald-50' : 'bg-white/90 border-white/60',
  }
  return (
    <button onClick={onClick} className={`shrink-0 w-56 rounded-2xl border p-3 text-left transition-all duration-200 backdrop-blur-sm shadow-md hover:bg-white ${colors[loc.type]}`}>
      <div className="flex items-start gap-2">
        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${loc.type === 'emergency' ? 'bg-red-500' : loc.type === 'campaign' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-neutral-800 leading-snug truncate">{loc.name}</p>
          <p className="text-[10px] text-neutral-400 mt-0.5">{loc.city || loc.distance || 'Nearby'}</p>
          {loc.type === 'emergency' ? (
            <div className="flex items-center gap-1 mt-1.5">
              <span className="font-mono text-[10px] font-black text-red-600">{loc.bloodType}</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">{loc.urgency?.toUpperCase()}</span>
            </div>
          ) : loc.type === 'campaign' ? (
            <p className="text-[10px] text-blue-700 font-medium mt-1 truncate">{loc.city || 'Donation campaign'} · {loc.when}</p>
          ) : (
            <p className="text-[10px] text-emerald-700 font-medium mt-1 truncate">{loc.address || 'Blood screening center'}</p>
          )}
        </div>
      </div>
    </button>
  )
}

function DetailDrawer({ item, onClose }) {
  if (!item) return null
  const isEmergency = item.type === 'emergency'
  const isCampaign = item.type === 'campaign'
  return (
    <div className="fixed inset-0 z-[1300] flex justify-end">
      <button className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} aria-label="Close details" />
      <aside className="relative m-3 flex w-full max-w-md flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-warm-100 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-warm-400">{isEmergency ? 'Emergency request' : isCampaign ? 'Donation campaign' : 'Screening center'}</p>
            <h2 className="font-display text-lg font-bold text-warm-950">{item.name}</h2>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-warm-400 hover:bg-warm-100 hover:text-warm-700"><X size={18} /></button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {isEmergency && (
            <>
              <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                <p className="font-mono text-2xl font-black text-red-700">{item.bloodType}</p>
                <p className="text-sm font-semibold text-red-700">{item.unitsNeeded} unit{item.unitsNeeded > 1 ? 's' : ''} needed · {item.urgency}</p>
              </div>
              <p className="text-sm leading-relaxed text-warm-600">{item.notes || 'This hospital has an active blood request and may need compatible donors soon.'}</p>
            </>
          )}
          {isCampaign && (
            <>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-700">{item.when}</p>
                <p className="mt-1 text-xs text-blue-600">{item.targetDonors || 'Open'} target donors · {item.interestedCount || 0} interested</p>
              </div>
              <p className="text-sm leading-relaxed text-warm-600">{item.description || 'A public donation campaign approved by the BDEN admin team.'}</p>
              {item.incentives && <p className="rounded-xl bg-warm-50 p-3 text-xs font-medium text-warm-600">{item.incentives}</p>}
            </>
          )}
          {!isEmergency && !isCampaign && (
            <p className="text-sm leading-relaxed text-warm-600">{item.address || item.city || 'A screening center available to donors.'}</p>
          )}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-warm-50 p-3"><span className="text-warm-400">City</span><p className="font-semibold text-warm-900">{item.city || 'Nearby'}</p></div>
            <div className="rounded-xl bg-warm-50 p-3"><span className="text-warm-400">Location</span><p className="font-semibold text-warm-900">{item.address || 'See marker'}</p></div>
          </div>
        </div>
      </aside>
    </div>
  )
}

function ListNeedCard({ loc, onClick }) {
  const styles = {
    emergency: {
      badge: 'bg-red-50 text-red-700 border-red-100',
      icon: AlertTriangle,
      iconClass: 'bg-red-50 text-red-600 border-red-100',
      eyebrow: 'Emergency request',
    },
    campaign: {
      badge: 'bg-blue-50 text-blue-700 border-blue-100',
      icon: CalendarDays,
      iconClass: 'bg-blue-50 text-blue-600 border-blue-100',
      eyebrow: 'Donation campaign',
    },
    facility: {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      icon: Building2,
      iconClass: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      eyebrow: 'Screening center',
    },
  }[loc.type]
  const Icon = styles.icon
  return (
    <button onClick={onClick} className="group w-full rounded-2xl border border-warm-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blood-200 hover:shadow-md">
      <div className="flex gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${styles.iconClass}`}>
          <Icon size={19} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wide text-warm-400">{styles.eyebrow}</span>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${styles.badge}`}>
              {loc.type === 'emergency' ? loc.urgency : loc.type === 'campaign' ? loc.when : 'Available'}
            </span>
          </div>
          <p className="truncate font-display text-base font-bold text-warm-950 group-hover:text-blood-700">{loc.name}</p>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-warm-500">
            {loc.type === 'emergency'
              ? `${loc.bloodType} blood needed, ${loc.unitsNeeded} unit${loc.unitsNeeded > 1 ? 's' : ''}. ${loc.notes || 'Tap for details.'}`
              : loc.type === 'campaign'
                ? loc.description || 'Approved donation campaign. Tap to learn more.'
                : loc.address || loc.city || 'Tap to see screening center details.'}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-warm-400">
            <span className="inline-flex items-center gap-1"><MapPin size={12} /> {loc.city || 'Nearby'}</span>
            {loc.address && <span className="truncate">· {loc.address}</span>}
          </div>
        </div>
      </div>
    </button>
  )
}

export default function MapView() {
  const { collapsed = false } = useOutletContext() || {}
  const [filter, setFilter] = useState('all')
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('bden_nearby_view') || 'map')
  const [selected, setSelected] = useState(null)
  const [requests, setRequests] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [centers, setCenters] = useState([])
  const [userLocation, setUserLocation] = useState(null)
  const [flyHome, setFlyHome] = useState(0)
  const [distanceFromHome, setDistanceFromHome] = useState(0)
  const scrollRef = useRef(null)

  useEffect(() => {
    requestApi.list({ status: 'ACTIVE' }).then(setRequests).catch(() => setRequests([]))
    campaignApi.list().then(setCampaigns).catch(() => setCampaigns([]))
    donorApi.getScreeningCenters().then(setCenters).catch(() => setCenters([]))
    navigator.geolocation?.getCurrentPosition(
      pos => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => setUserLocation(YAOUNDE_CENTER),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }, [])

  useEffect(() => {
    localStorage.setItem('bden_nearby_view', viewMode)
  }, [viewMode])

  const locations = useMemo(() => {
    const emergency = requests.map((r, index) => {
      const offset = ((index % 7) - 3) * 0.006
      const row = (Math.floor(index / 7) % 5 - 2) * 0.005
      return { ...r, type: 'emergency', name: r.hospital, position: [Number(r.latitude) || 3.8667 + offset, Number(r.longitude) || 11.5167 + row] }
    })
    const campaignItems = campaigns.map(c => ({
      ...c,
      type: 'campaign',
      name: c.title,
      position: [Number(c.latitude), Number(c.longitude)],
      when: new Date(c.startDate) <= new Date() && new Date(c.endDate) >= new Date() ? 'Happening now' : new Date(c.startDate).toLocaleDateString(),
    })).filter(c => Number.isFinite(c.position[0]) && Number.isFinite(c.position[1]))
    const facility = centers.filter(c => c.latitude && c.longitude).map(c => ({ ...c, type: 'facility', name: c.name, position: [c.latitude, c.longitude] }))
    return [...emergency, ...campaignItems, ...facility]
  }, [requests, campaigns, centers])

  const visible = filter === 'all' ? locations : locations.filter(l => l.type === filter)
  const home = userLocation || YAOUNDE_CENTER

  const scrollCards = dir => scrollRef.current?.scrollBy({ left: dir * 240, behavior: 'smooth' })
  const grouped = {
    emergency: visible.filter(item => item.type === 'emergency'),
    campaign: visible.filter(item => item.type === 'campaign'),
    facility: visible.filter(item => item.type === 'facility'),
  }

  if (viewMode === 'list') {
    return (
      <>
        <div className={`min-h-screen bg-warm-50 px-4 py-5 transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${collapsed ? 'lg:pl-[104px]' : 'lg:pl-[292px]'}`}>
          <div className="mx-auto max-w-5xl space-y-5">
            <div className="rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-xl backdrop-blur-xl">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="font-display text-2xl font-bold text-warm-950">Nearby Needs</h1>
                  <p className="mt-1 text-sm text-warm-500">A lighter view of requests, campaigns, and centers near you.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {FILTERS.map(f => {
                    const Icon = f.icon
                    return <button key={f.id} onClick={() => setFilter(f.id)} className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${filter === f.id ? f.activeClass : 'bg-warm-50 text-neutral-600 hover:bg-neutral-100'}`}><Icon size={12} />{f.label}</button>
                  })}
                  <span className="hidden h-7 w-px bg-warm-100 sm:block" />
                  <button onClick={() => setViewMode('map')} className="flex items-center gap-1.5 rounded-xl bg-warm-50 px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"><Map size={12} />Map</button>
                  <button className="flex items-center gap-1.5 rounded-xl bg-blood-600 px-3 py-2 text-xs font-semibold text-white"><LayoutList size={12} />List</button>
                </div>
              </div>
            </div>

            {visible.length === 0 ? (
              <div className="rounded-[24px] border border-warm-200 bg-white p-8 text-center shadow-sm">
                <Navigation size={28} className="mx-auto mb-3 text-warm-300" />
                <p className="font-display text-lg font-bold text-warm-950">Nothing nearby right now</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-warm-500">When a hospital posts a need, campaign, or screening center in this area, it will appear here.</p>
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-3">
                {[
                  ['emergency', 'Urgent requests', AlertTriangle],
                  ['campaign', 'Donation campaigns', CalendarDays],
                  ['facility', 'Screening centers', Building2],
                ].map(([key, title, Icon]) => (
                  <section key={key} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="flex items-center gap-2 font-display text-sm font-bold text-warm-900"><Icon size={16} /> {title}</h2>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-warm-500 shadow-sm">{grouped[key].length}</span>
                    </div>
                    {grouped[key].length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-warm-200 bg-white/70 p-5 text-sm text-warm-400">Nothing in this group yet.</div>
                    ) : (
                      <div className="space-y-3">
                        {grouped[key].map(loc => <ListNeedCard key={`${loc.type}-list-${loc.id}`} loc={loc} onClick={() => setSelected(loc)} />)}
                      </div>
                    )}
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>
        <DetailDrawer item={selected} onClose={() => setSelected(null)} />
      </>
    )
  }

  const content = (
    <div className="relative w-full h-screen overflow-hidden bg-warm-100">
      {viewMode === 'map' ? (
      <MapContainer center={home} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false} className="z-0">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Circle center={home} radius={5000} pathOptions={{ color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.05, weight: 1.5, dashArray: '6 4' }} />

        {userLocation && (
          <Marker position={userLocation} icon={markerIcon('user')}>
            <Popup><div className="text-sm font-semibold text-neutral-900">Your current location</div></Popup>
          </Marker>
        )}

        {viewMode === 'map' && visible.map(loc => (
          <Marker key={`${loc.type}-${loc.id}`} position={loc.position} icon={markerIcon(loc.type)} eventHandlers={{ click: () => setSelected(loc) }}>
            <Popup>
              <div className="min-w-[180px]">
                <p className="font-bold text-sm text-neutral-900 mb-1">{loc.name}</p>
                {loc.type === 'emergency' ? (
                  <>
                    <span className="inline-block bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full mb-2">{loc.bloodType} · {loc.urgency?.toUpperCase()}</span>
                    <p className="text-xs text-neutral-600">{loc.unitsNeeded} unit{loc.unitsNeeded > 1 ? 's' : ''} needed · {loc.postedAgo}</p>
                  </>
                ) : loc.type === 'campaign' ? (
                  <>
                    <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full mb-2">{loc.when}</span>
                    <p className="text-xs text-neutral-600">{loc.city || loc.address || 'Donation campaign'}</p>
                  </>
                ) : (
                  <p className="text-xs text-neutral-600">{loc.address || loc.city}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        <FlyTo position={home} trigger={flyHome} />
        <MapWatcher home={home} onDistanceChange={setDistanceFromHome} />
      </MapContainer>
      ) : (
        <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,#fee2e2,transparent_32%),linear-gradient(135deg,#fff7ed,#f8fafc)]" />
      )}

      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-[900] flex flex-wrap items-center justify-center gap-2 px-3 py-2 bg-white/85 backdrop-blur-xl rounded-2xl shadow-lg border border-white/70">
        {FILTERS.map(f => {
          const Icon = f.icon
          return <button key={f.id} onClick={() => setFilter(f.id)} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${filter === f.id ? f.activeClass : 'text-neutral-600 hover:bg-neutral-100'}`}><Icon size={12} />{f.label}</button>
        })}
        <span className="mx-1 h-6 w-px bg-neutral-200" />
        {[
          { id: 'map', icon: Map, label: 'Map' },
          { id: 'list', icon: LayoutList, label: 'List' },
        ].map(item => {
          const Icon = item.icon
          return <button key={item.id} onClick={() => setViewMode(item.id)} className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${viewMode === item.id ? 'bg-blood-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}><Icon size={12} />{item.label}</button>
        })}
      </div>

      <div className="absolute top-20 right-5 z-[900] bg-white/85 backdrop-blur-xl rounded-2xl shadow border border-white/70 px-3 py-2.5 flex flex-col gap-1.5">
        {[['bg-blue-500', 'You'], ['bg-red-500', 'Urgent need'], ['bg-emerald-500', 'Screening center'], ['bg-red-200 border border-red-300', '5 km radius']].map(([color, label]) => (
          <div key={label} className="flex items-center gap-2"><span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} /><span className="text-[10px] text-neutral-500 font-medium">{label}</span></div>
        ))}
      </div>

      {distanceFromHome > 900 && (
        <button onClick={() => setFlyHome(n => n + 1)} className="absolute right-5 bottom-40 z-[1100] h-11 px-4 bg-white rounded-2xl shadow-lg border border-neutral-200 flex items-center gap-2 text-blood-600 hover:bg-blood-50 transition-colors text-xs font-semibold pointer-events-auto">
          <LocateFixed size={18} /> Back to my location
        </button>
      )}

      <div className={`absolute bottom-5 left-0 right-0 z-[700] transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${collapsed ? 'pl-[100px]' : 'pl-[288px]'}`}>
        {visible.length === 0 ? (
          <div className="mx-auto max-w-xs rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-center shadow-lg backdrop-blur-xl">
            <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-warm-100">
              <Navigation size={17} className="text-warm-500" />
            </div>
            <p className="text-sm font-semibold text-warm-900">Nothing nearby right now</p>
            <p className="mt-0.5 text-xs leading-relaxed text-warm-500">When a hospital posts a need or a center is available in this area, it will show up here.</p>
          </div>
        ) : viewMode === 'map' ? (
          <div className="relative w-full">
            <button onClick={() => scrollCards(-1)} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-7 h-7 bg-white rounded-full shadow-md border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-800"><ChevronLeft size={14} /></button>
            <div ref={scrollRef} className="flex gap-3 overflow-x-auto pl-4 pr-10" style={{ scrollSnapType: 'x mandatory' }}>
              {visible.map(loc => <div key={`${loc.type}-card-${loc.id}`} style={{ scrollSnapAlign: 'start' }}><LocationCard loc={loc} selected={selected?.id === loc.id} onClick={() => setSelected(loc)} /></div>)}
            </div>
            <button onClick={() => scrollCards(1)} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-7 h-7 bg-white rounded-full shadow-md border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-800"><ChevronRight size={14} /></button>
          </div>
        ) : (
          <div className="mx-auto max-h-[58vh] max-w-3xl overflow-y-auto rounded-[24px] border border-white/70 bg-white/95 p-3 shadow-2xl backdrop-blur-xl">
            <div className="grid gap-2 sm:grid-cols-2">
              {visible.map(loc => <LocationCard key={`${loc.type}-list-${loc.id}`} loc={loc} selected={selected?.id === loc.id} onClick={() => setSelected(loc)} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {content}
      <DetailDrawer item={selected} onClose={() => setSelected(null)} />
    </>
  )
}
