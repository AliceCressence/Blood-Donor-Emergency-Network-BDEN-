// src/pages/donor/MapView.jsx
import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Droplets, Filter, Navigation, Clock, AlertTriangle } from 'lucide-react'

// Fix Leaflet default icon issue with Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Custom icons
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

// Yaoundé coordinates
const YAOUNDE_CENTER = [3.8667, 11.5167]

const MOCK_LOCATIONS = [
  {
    id: 1,
    type: 'emergency',
    name: 'Hôpital Central de Yaoundé',
    position: [3.8714, 11.5220],
    bloodType: 'O−',
    urgency: 'critical',
    unitsNeeded: 3,
    distance: '2.1 km',
    postedAgo: '12 min ago',
  },
  {
    id: 2,
    type: 'emergency',
    name: 'Clinique de la Cité Verte',
    position: [3.8800, 11.5050],
    bloodType: 'O−',
    urgency: 'high',
    unitsNeeded: 2,
    distance: '5.4 km',
    postedAgo: '1 hr ago',
  },
  {
    id: 3,
    type: 'campaign',
    name: 'CHU de Yaoundé — Blood Drive',
    position: [3.8620, 11.5090],
    date: 'June 14, 2025',
    slots: 12,
    distance: '3.8 km',
  },
  {
    id: 4,
    type: 'campaign',
    name: 'Mvog-Mbi Community Center',
    position: [3.8550, 11.5300],
    date: 'June 20, 2025',
    slots: 8,
    distance: '4.2 km',
  },
  {
    id: 5,
    type: 'facility',
    name: 'Polyclinique Chanas',
    position: [3.8750, 11.5350],
    services: 'Transfusion, Emergency',
    distance: '3.1 km',
  },
]

const FILTER_OPTIONS = [
  { id: 'all', label: 'All', color: 'bg-neutral-700' },
  { id: 'emergency', label: 'Emergencies', color: 'bg-red-600' },
  { id: 'campaign', label: 'Campaigns', color: 'bg-blue-600' },
  { id: 'facility', label: 'Facilities', color: 'bg-emerald-600' },
]

function UrgencyBadge({ level }) {
  const s = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
  }
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s[level] || s.high}`}>{level?.toUpperCase()}</span>
}

export default function MapView() {
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  const visible = filter === 'all' ? MOCK_LOCATIONS : MOCK_LOCATIONS.filter(l => l.type === filter)

  const getIcon = (type) => {
    if (type === 'emergency') return redIcon
    if (type === 'campaign') return blueIcon
    return greenIcon
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">Map View</h1>
          <p className="text-neutral-500 text-sm mt-1">Emergency requests and donation campaigns near Yaoundé</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-500 bg-white border border-neutral-200 rounded-xl px-3 py-2">
          <Navigation size={14} className="text-blood-500" />
          Yaoundé, Centre
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.id}
            onClick={() => setFilter(opt.id)}
            className={`
              flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all
              ${filter === opt.id
                ? `${opt.color} text-white border-transparent`
                : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
              }
            `}
          >
            {opt.id !== 'all' && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />}
            {opt.label}
          </button>
        ))}
      </div>

      {/* Map + sidebar layout */}
      <div className="grid lg:grid-cols-3 gap-4 h-[500px]">
        {/* Map */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-neutral-200 shadow-sm">
          <MapContainer
            center={YAOUNDE_CENTER}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Donor radius */}
            <Circle
              center={YAOUNDE_CENTER}
              radius={5000}
              pathOptions={{ color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.05, weight: 1, dashArray: '6 4' }}
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
          </MapContainer>
        </div>

        {/* Sidebar list */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-neutral-100 flex items-center gap-2">
            <Filter size={14} className="text-neutral-400" />
            <span className="text-sm font-semibold text-neutral-700">{visible.length} locations</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-neutral-100">
            {visible.map(loc => (
              <button
                key={loc.id}
                onClick={() => setSelected(loc)}
                className={`w-full text-left px-4 py-3 hover:bg-neutral-50 transition-colors ${selected?.id === loc.id ? 'bg-blood-50' : ''}`}
              >
                <div className="flex items-start gap-2">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    loc.type === 'emergency' ? 'bg-red-500' :
                    loc.type === 'campaign' ? 'bg-blue-500' : 'bg-emerald-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-neutral-800 leading-snug truncate">{loc.name}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">{loc.distance}</p>
                    {loc.type === 'emergency' && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="font-mono text-[10px] font-bold text-red-600">{loc.bloodType}</span>
                        <UrgencyBadge level={loc.urgency} />
                      </div>
                    )}
                    {loc.type === 'campaign' && (
                      <p className="text-[10px] text-blue-600 mt-0.5">{loc.date}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-neutral-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Emergency request</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Donation campaign</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Medical facility</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-200 border border-red-300 inline-block" /> Your 5 km radius</span>
      </div>
    </div>
  )
}
