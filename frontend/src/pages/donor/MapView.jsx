// src/pages/donor/MapView.jsx
import { useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Droplets, Navigation, AlertTriangle, Calendar, Building2, ChevronLeft, ChevronRight } from 'lucide-react'

// Fix Leaflet default icon issue with Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const redIcon = new L.Icon({
  iconUrl:    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl:  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize:   [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
})
const blueIcon = new L.Icon({
  iconUrl:    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl:  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize:   [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
})
const greenIcon = new L.Icon({
  iconUrl:    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl:  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize:   [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
})

const YAOUNDE_CENTER = [3.8667, 11.5167]

const MOCK_LOCATIONS = [
  { id: 1, type: 'emergency', name: 'Hôpital Central de Yaoundé',    position: [3.8714, 11.5220], bloodType: 'O⁻', urgency: 'critical', unitsNeeded: 3, distance: '2.1 km', postedAgo: '12 min ago' },
  { id: 2, type: 'emergency', name: 'Clinique de la Cité Verte',     position: [3.8800, 11.5050], bloodType: 'O⁻', urgency: 'high',     unitsNeeded: 2, distance: '5.4 km', postedAgo: '1 hr ago'   },
  { id: 3, type: 'campaign',  name: 'CHU de Yaoundé — Blood Drive',  position: [3.8620, 11.5090], date: 'June 14, 2025', slots: 12,     distance: '3.8 km' },
  { id: 4, type: 'campaign',  name: 'Mvog-Mbi Community Center',     position: [3.8550, 11.5300], date: 'June 20, 2025', slots: 8,      distance: '4.2 km' },
  { id: 5, type: 'facility',  name: 'Polyclinique Chanas',           position: [3.8750, 11.5350], services: 'Transfusion, Emergency',   distance: '3.1 km' },
]

const FILTERS = [
  { id: 'all',       label: 'All',         icon: MapPin,        activeClass: 'bg-neutral-800 text-white'   },
  { id: 'emergency', label: 'Emergencies', icon: AlertTriangle, activeClass: 'bg-red-600 text-white'       },
  { id: 'campaign',  label: 'Campaigns',   icon: Calendar,      activeClass: 'bg-blue-600 text-white'      },
  { id: 'facility',  label: 'Facilities',  icon: Building2,     activeClass: 'bg-emerald-600 text-white'   },
]

const LEGEND = [
  { color: 'bg-red-500',     label: 'Emergency'  },
  { color: 'bg-blue-500',    label: 'Campaign'   },
  { color: 'bg-emerald-500', label: 'Facility'   },
  { color: 'bg-red-200 border border-red-300', label: '5 km radius' },
]

function getIcon(type) {
  if (type === 'emergency') return redIcon
  if (type === 'campaign')  return blueIcon
  return greenIcon
}

// Imperative map controller — flies to a position
function FlyTo({ position, trigger }) {
  const map = useMap()
  if (trigger && position) map.flyTo(position, 15, { duration: 1.2 })
  return null
}

// Mini location card shown in the bottom overlay strip
function LocationCard({ loc, selected, onClick }) {
  const typeColor = {
    emergency: 'border-red-300 bg-red-50',
    campaign:  'border-blue-300 bg-blue-50',
    facility:  'border-emerald-300 bg-emerald-50',
  }
  const dotColor = {
    emergency: 'bg-red-500',
    campaign:  'bg-blue-500',
    facility:  'bg-emerald-500',
  }
  return (
    <button
      onClick={onClick}
      className={`
        shrink-0 w-52 rounded-2xl border p-3 text-left transition-all duration-150 cursor-pointer
        ${selected ? typeColor[loc.type] : 'bg-white/90 border-white/60 hover:bg-white'}
        backdrop-blur-sm shadow-md
      `}
    >
      <div className="flex items-start gap-2">
        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dotColor[loc.type]}`} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-neutral-800 leading-snug truncate">{loc.name}</p>
          <p className="text-[10px] text-neutral-400 mt-0.5">{loc.distance} away</p>
          {loc.type === 'emergency' && (
            <div className="flex items-center gap-1 mt-1.5">
              <span className="font-mono text-[10px] font-black text-red-600">{loc.bloodType}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                loc.urgency === 'critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {loc.urgency?.toUpperCase()}
              </span>
            </div>
          )}
          {loc.type === 'campaign' && (
            <p className="text-[10px] text-blue-600 font-medium mt-1">{loc.date}</p>
          )}
          {loc.type === 'facility' && (
            <p className="text-[10px] text-neutral-500 mt-1 truncate">{loc.services}</p>
          )}
        </div>
      </div>
    </button>
  )
}

export default function MapView() {
  const [filter,   setFilter]   = useState('all')
  const [selected, setSelected] = useState(null)
  const [flyHome,  setFlyHome]  = useState(0) // increment to trigger fly
  const scrollRef = useRef(null)

  const visible = filter === 'all'
    ? MOCK_LOCATIONS
    : MOCK_LOCATIONS.filter(l => l.type === filter)

  const scrollCards = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 220, behavior: 'smooth' })
    }
  }

  return (
    // Full-page container — must fill the parent which is the <main> inside DonorLayout
    <div className="relative w-full rounded-2xl overflow-hidden" style={{ height: 'calc(100vh - 96px)' }}>

      {/* ── Full-page map ──────────────────────────────────────────────── */}
      <MapContainer
        center={YAOUNDE_CENTER}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Donor radius circle */}
        <Circle
          center={YAOUNDE_CENTER}
          radius={5000}
          pathOptions={{
            color: '#dc2626', fillColor: '#dc2626',
            fillOpacity: 0.05, weight: 1.5, dashArray: '6 4',
          }}
        />

        {/* Markers */}
        {visible.map(loc => (
          <Marker
            key={loc.id}
            position={loc.position}
            icon={getIcon(loc.type)}
            eventHandlers={{ click: () => setSelected(loc) }}
          >
            <Popup>
              <div className="min-w-[180px]">
                <p className="font-bold text-sm text-neutral-900 mb-1">{loc.name}</p>
                {loc.type === 'emergency' && (
                  <>
                    <span className="inline-block bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full mb-2">
                      {loc.bloodType} · {loc.urgency?.toUpperCase()}
                    </span>
                    <p className="text-xs text-neutral-600">{loc.unitsNeeded} units needed · {loc.postedAgo}</p>
                  </>
                )}
                {loc.type === 'campaign' && (
                  <p className="text-xs text-neutral-600">{loc.date} · {loc.slots} slots</p>
                )}
                {loc.type === 'facility' && (
                  <p className="text-xs text-neutral-600">{loc.services}</p>
                )}
                <p className="text-xs text-neutral-400 mt-1">{loc.distance} away</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Fly-to-home controller */}
        <FlyTo position={YAOUNDE_CENTER} trigger={flyHome > 0} />
      </MapContainer>

      {/* ── TOP overlay: filter pills ──────────────────────────────────── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/60">
        {FILTERS.map(f => {
          const Icon = f.icon
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`
                flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all
                ${filter === f.id ? f.activeClass : 'text-neutral-600 hover:bg-neutral-100'}
              `}
            >
              <Icon size={12} />
              {f.label}
            </button>
          )
        })}
      </div>

      {/* ── TOP-RIGHT: location count badge ───────────────────────────── */}
      <div className="absolute top-4 right-4 z-[400] bg-white/80 backdrop-blur-md rounded-xl px-3 py-1.5 shadow border border-white/60">
        <p className="text-xs font-semibold text-neutral-600">{visible.length} locations</p>
      </div>

      {/* ── RIGHT: zoom controls (custom, since we disabled default) ───── */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[400] flex flex-col gap-1">
        {/* Leaflet's built-in zoom is disabled; these are decorative placeholders.
            For real zoom, re-enable zoomControl on MapContainer and position it here. */}
      </div>

      {/* ── RIGHT-BOTTOM: "My location" button ────────────────────────── */}
      <div className="absolute bottom-44 right-4 z-[400]">
        <button
          onClick={() => setFlyHome(n => n + 1)}
          className="w-10 h-10 bg-white rounded-xl shadow-lg border border-neutral-200 flex items-center justify-center text-blood-600 hover:bg-blood-50 transition-colors"
          title="Back to my location"
        >
          <Navigation size={18} />
        </button>
      </div>

      {/* ── BOTTOM-LEFT: legend ───────────────────────────────────────── */}
      <div className="absolute bottom-4 left-4 z-[400]">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow border border-white/60 px-3 py-2.5 flex flex-col gap-1.5">
          {LEGEND.map(l => (
            <div key={l.label} className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${l.color}`} />
              <span className="text-[10px] text-neutral-500 font-medium">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── BOTTOM overlay: scrollable location cards ─────────────────── */}
      <div className="absolute bottom-4 left-0 right-0 z-[400] px-4">
        <div className="relative">
          {/* Left scroll arrow */}
          <button
            onClick={() => scrollCards(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-7 h-7 bg-white rounded-full shadow-md border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-800 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>

          {/* Cards strip */}
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide pl-4 pr-4"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {visible.map(loc => (
              <div key={loc.id} style={{ scrollSnapAlign: 'start' }}>
                <LocationCard
                  loc={loc}
                  selected={selected?.id === loc.id}
                  onClick={() => setSelected(loc)}
                />
              </div>
            ))}
          </div>

          {/* Right scroll arrow */}
          <button
            onClick={() => scrollCards(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-7 h-7 bg-white rounded-full shadow-md border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-800 transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}