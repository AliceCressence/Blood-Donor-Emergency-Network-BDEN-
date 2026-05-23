// src/pages/donor/NearbyMap.jsx
import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Building2, Award, Calendar, Users, Droplets } from 'lucide-react'

// Fix Leaflet default marker icon broken by Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom red marker for campaigns
const campaignIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
})

// Custom teal marker for screening centers
const screeningIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
})

// Yaoundé center
const USER_LOCATION = [3.8480, 11.5021]

const CAMPAIGNS = [
  {
    id: 1, name: 'CHU de Yaoundé — May Drive',
    position: [3.8665, 11.5167],
    types: ['O+', 'A+'], date: 'May 20, 2026',
    benefit: 'Free malaria screening',
    target: 120, current: 74,
  },
  {
    id: 2, name: 'Hôpital Central',
    position: [3.8600, 11.5100],
    types: ['B+', 'AB+'], date: 'May 15, 2026',
    benefit: 'Priority consultation access',
    target: 60, current: 18,
  },
  {
    id: 3, name: 'Fondation Chantal Biya',
    position: [3.8750, 11.5050],
    types: ['A−', 'O−'], date: 'May 25, 2026',
    benefit: 'BDEN loyalty card',
    target: 80, current: 55,
  },
]

const SCREENING_CENTERS = [
  { id: 1, name: 'Centre Pasteur du Cameroun', position: [3.8530, 11.5080], hours: 'Mon–Fri, 7am–3pm' },
  { id: 2, name: 'Laboratoire de Référence',   position: [3.8420, 11.4990], hours: 'Mon–Sat, 8am–5pm' },
]

export default function NearbyMap() {
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedCampaign, setSelectedCampaign] = useState(null)

  const filters = [
    { key: 'all',       label: 'All',              color: 'bg-warm-950 text-white' },
    { key: 'campaigns', label: 'Campaigns',         color: 'bg-blood-600 text-white' },
    { key: 'screening', label: 'Screening centers', color: 'bg-teal-600 text-white'  },
  ]

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-warm-950">Nearby map</h1>
        <p className="text-warm-500 text-sm mt-1">
          Donation campaigns and blood typing centers near Yaoundé
        </p>
      </div>

      {/* Legend + filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {filters.map(f => (
            <button key={f.key} onClick={() => setActiveFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${activeFilter === f.key ? f.color : 'bg-white border border-warm-200 text-warm-600 hover:bg-warm-50'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 text-xs text-warm-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blood-500" /> Campaign
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-teal-500" /> Screening center
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-400 opacity-40 border-2 border-blue-500" /> Your radius
          </span>
        </div>
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-warm-200 shadow-card"
           style={{ height: '460px' }}>
        <MapContainer
          center={USER_LOCATION}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          />

          {/* User location radius (10km) */}
          <Circle
            center={USER_LOCATION}
            radius={5000}
            pathOptions={{ color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.06, weight: 1.5, dashArray: '6' }}
          />

          {/* User position marker */}
          <Marker position={USER_LOCATION}>
            <Popup>
              <div className="text-sm font-semibold text-warm-900">📍 Your location</div>
              <div className="text-xs text-warm-500">Yaoundé area</div>
            </Popup>
          </Marker>

          {/* Campaign markers */}
          {(activeFilter === 'all' || activeFilter === 'campaigns') &&
            CAMPAIGNS.map(c => (
              <Marker key={c.id} position={c.position} icon={campaignIcon}
                eventHandlers={{ click: () => setSelectedCampaign(c) }}>
                <Popup>
                  <div style={{ minWidth: '200px' }}>
                    <p className="font-semibold text-sm text-warm-900 mb-1">{c.name}</p>
                    <div className="flex gap-1 flex-wrap mb-2">
                      {c.types.map(t => (
                        <span key={t} className="px-1.5 py-0.5 rounded text-xs font-mono font-bold
                                                  bg-red-50 text-red-700 border border-red-200">
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">📅 {c.date}</p>
                    <p className="text-xs text-green-600 mt-1">🎁 {c.benefit}</p>
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full">
                      <div className="h-full bg-red-500 rounded-full"
                        style={{ width: `${Math.round((c.current / c.target) * 100)}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{c.current}/{c.target} donors</p>
                  </div>
                </Popup>
              </Marker>
            ))
          }

          {/* Screening center markers */}
          {(activeFilter === 'all' || activeFilter === 'screening') &&
            SCREENING_CENTERS.map(s => (
              <Marker key={s.id} position={s.position} icon={screeningIcon}>
                <Popup>
                  <div style={{ minWidth: '180px' }}>
                    <p className="font-semibold text-sm text-warm-900 mb-1">🔬 {s.name}</p>
                    <p className="text-xs text-gray-500">🕐 {s.hours}</p>
                    <p className="text-xs text-teal-600 mt-1">Blood typing available</p>
                  </div>
                </Popup>
              </Marker>
            ))
          }
        </MapContainer>
      </div>

      {/* Campaign cards below map */}
      {(activeFilter === 'all' || activeFilter === 'campaigns') && (
        <div>
          <h2 className="font-display font-semibold text-warm-900 mb-4">
            Campaigns in your area
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CAMPAIGNS.map(c => {
              const pct = Math.round((c.current / c.target) * 100)
              return (
                <div key={c.id}
                  onClick={() => setSelectedCampaign(c)}
                  className={`bg-white rounded-2xl border shadow-card p-5 cursor-pointer
                               hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200
                               ${selectedCampaign?.id === c.id ? 'border-blood-400' : 'border-warm-200'}`}>
                  <div className="flex items-start gap-2 mb-3">
                    <Building2 size={14} className="text-warm-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-semibold text-warm-900 leading-tight">{c.name}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {c.types.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded-lg bg-blood-50 border border-blood-100
                                               text-xs font-mono font-bold text-blood-700">{t}</span>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-warm-400 mb-1.5">
                    <span>{c.current} donors</span>
                    <span>Goal: {c.target}</span>
                  </div>
                  <div className="h-1.5 bg-warm-100 rounded-full mb-3">
                    <div className="h-full rounded-full bg-blood-500"
                      style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-teal-600">
                      <Award size={10} /> {c.benefit}
                    </span>
                    <span className="flex items-center gap-1 text-warm-400">
                      <Calendar size={10} /> {c.date}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
