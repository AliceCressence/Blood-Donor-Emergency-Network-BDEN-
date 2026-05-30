import { useEffect, useMemo, useRef, useState } from 'react'
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { AlertTriangle, Building2, ChevronLeft, ChevronRight, LocateFixed, MapPin, Navigation } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { donorApi, requestApi } from '../../services/app.service'

const YAOUNDE_CENTER = [3.8667, 11.5167]
const FILTERS = [
  { id: 'all', label: 'All', icon: MapPin, activeClass: 'bg-neutral-800 text-white' },
  { id: 'emergency', label: 'Urgent needs', icon: AlertTriangle, activeClass: 'bg-red-600 text-white' },
  { id: 'facility', label: 'Screening centers', icon: Building2, activeClass: 'bg-emerald-600 text-white' },
]

function markerIcon(type) {
  const color = { emergency: '#dc2626', facility: '#059669', user: '#2563eb' }[type] || '#111827'
  const glyph = { emergency: '!', facility: '+', user: '•' }[type] || ''
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
    facility: selected ? 'border-emerald-300 bg-emerald-50' : 'bg-white/90 border-white/60',
  }
  return (
    <button onClick={onClick} className={`shrink-0 w-56 rounded-2xl border p-3 text-left transition-all duration-200 backdrop-blur-sm shadow-md hover:bg-white ${colors[loc.type]}`}>
      <div className="flex items-start gap-2">
        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${loc.type === 'emergency' ? 'bg-red-500' : 'bg-emerald-500'}`} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-neutral-800 leading-snug truncate">{loc.name}</p>
          <p className="text-[10px] text-neutral-400 mt-0.5">{loc.city || loc.distance || 'Nearby'}</p>
          {loc.type === 'emergency' ? (
            <div className="flex items-center gap-1 mt-1.5">
              <span className="font-mono text-[10px] font-black text-red-600">{loc.bloodType}</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">{loc.urgency?.toUpperCase()}</span>
            </div>
          ) : (
            <p className="text-[10px] text-emerald-700 font-medium mt-1 truncate">{loc.address || 'Blood screening center'}</p>
          )}
        </div>
      </div>
    </button>
  )
}

export default function MapView() {
  const { collapsed = false } = useOutletContext() || {}
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [requests, setRequests] = useState([])
  const [centers, setCenters] = useState([])
  const [userLocation, setUserLocation] = useState(null)
  const [flyHome, setFlyHome] = useState(0)
  const [distanceFromHome, setDistanceFromHome] = useState(0)
  const scrollRef = useRef(null)

  useEffect(() => {
    requestApi.list({ status: 'ACTIVE' }).then(setRequests).catch(() => setRequests([]))
    donorApi.getScreeningCenters().then(setCenters).catch(() => setCenters([]))
    navigator.geolocation?.getCurrentPosition(
      pos => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => setUserLocation(YAOUNDE_CENTER),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }, [])

  const locations = useMemo(() => {
    const emergency = requests.map((r, index) => {
      const offset = ((index % 7) - 3) * 0.006
      const row = (Math.floor(index / 7) % 5 - 2) * 0.005
      return { ...r, type: 'emergency', name: r.hospital, position: [3.8667 + offset, 11.5167 + row] }
    })
    const facility = centers.filter(c => c.latitude && c.longitude).map(c => ({ ...c, type: 'facility', name: c.name, position: [c.latitude, c.longitude] }))
    return [...emergency, ...facility]
  }, [requests, centers])

  const visible = filter === 'all' ? locations : locations.filter(l => l.type === filter)
  const home = userLocation || YAOUNDE_CENTER

  const scrollCards = dir => scrollRef.current?.scrollBy({ left: dir * 240, behavior: 'smooth' })

  return (
    <div className="relative w-full h-screen overflow-hidden bg-warm-100">
      <MapContainer center={home} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false} className="z-0">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Circle center={home} radius={5000} pathOptions={{ color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.05, weight: 1.5, dashArray: '6 4' }} />

        {userLocation && (
          <Marker position={userLocation} icon={markerIcon('user')}>
            <Popup><div className="text-sm font-semibold text-neutral-900">Your current location</div></Popup>
          </Marker>
        )}

        {visible.map(loc => (
          <Marker key={`${loc.type}-${loc.id}`} position={loc.position} icon={markerIcon(loc.type)} eventHandlers={{ click: () => setSelected(loc) }}>
            <Popup>
              <div className="min-w-[180px]">
                <p className="font-bold text-sm text-neutral-900 mb-1">{loc.name}</p>
                {loc.type === 'emergency' ? (
                  <>
                    <span className="inline-block bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full mb-2">{loc.bloodType} · {loc.urgency?.toUpperCase()}</span>
                    <p className="text-xs text-neutral-600">{loc.unitsNeeded} unit{loc.unitsNeeded > 1 ? 's' : ''} needed · {loc.postedAgo}</p>
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

      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-[900] flex items-center gap-2 px-3 py-2 bg-white/85 backdrop-blur-xl rounded-2xl shadow-lg border border-white/70">
        {FILTERS.map(f => {
          const Icon = f.icon
          return <button key={f.id} onClick={() => setFilter(f.id)} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${filter === f.id ? f.activeClass : 'text-neutral-600 hover:bg-neutral-100'}`}><Icon size={12} />{f.label}</button>
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
        ) : (
          <div className="relative w-full">
            <button onClick={() => scrollCards(-1)} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-7 h-7 bg-white rounded-full shadow-md border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-800"><ChevronLeft size={14} /></button>
            <div ref={scrollRef} className="flex gap-3 overflow-x-auto pl-4 pr-10" style={{ scrollSnapType: 'x mandatory' }}>
              {visible.map(loc => <div key={`${loc.type}-card-${loc.id}`} style={{ scrollSnapAlign: 'start' }}><LocationCard loc={loc} selected={selected?.id === loc.id} onClick={() => setSelected(loc)} /></div>)}
            </div>
            <button onClick={() => scrollCards(1)} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-7 h-7 bg-white rounded-full shadow-md border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-800"><ChevronRight size={14} /></button>
          </div>
        )}
      </div>
    </div>
  )
}
