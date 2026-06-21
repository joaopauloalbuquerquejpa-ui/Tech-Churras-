'use client'
import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export interface CityMapItem {
  id: string
  name: string
  latitude?: number | null
  longitude?: number | null
  photoUrl?: string | null
  rating?: number
  href: string
  badge?: string
}

const pinIcon = (emoji: string) => L.divIcon({
  html: `<div style="width:34px;height:34px;background:#f97316;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center">
    <span style="transform:rotate(45deg);font-size:14px;line-height:1">${emoji}</span>
  </div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -36],
  className: '',
})

const gmPin = pinIcon('🔥')
const boutiquePin = pinIcon('🥩')

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  const fitted = useRef(false)
  useEffect(() => {
    if (fitted.current || positions.length === 0) return
    fitted.current = true
    if (positions.length === 1) {
      map.setView(positions[0], 13)
    } else {
      map.fitBounds(positions, { padding: [40, 40], maxZoom: 14 })
    }
  }, [positions.length])
  return null
}

interface Props {
  items: CityMapItem[]
  type?: 'grillmaster' | 'boutique'
  cityName: string
}

export default function CityMap({ items, type = 'grillmaster', cityName }: Props) {
  const withCoords = items.filter(i => i.latitude != null && i.longitude != null)

  if (withCoords.length === 0) return null

  const positions = withCoords.map(i => [i.latitude!, i.longitude!] as [number, number])
  const center = positions[0]
  const icon = type === 'grillmaster' ? gmPin : boutiquePin
  const label = type === 'grillmaster' ? 'churrasqueiro' : 'açougue'

  return (
    <div className="mb-10 rounded-2xl overflow-hidden border border-gray-800 shadow-xl">
      <div className="bg-gray-900 px-4 py-3 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span>{type === 'grillmaster' ? '🔥' : '🥩'}</span>
          <span className="font-semibold text-sm text-white">
            {withCoords.length} {label}{withCoords.length > 1 ? 's' : ''} em {cityName}
          </span>
        </div>
        <span className="text-xs text-gray-500">Clique no pin para ver o perfil</span>
      </div>
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: '340px', width: '100%' }}
        scrollWheelZoom={false}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        />
        {withCoords.map(item => (
          <Marker
            key={item.id}
            position={[item.latitude!, item.longitude!]}
            icon={icon}
          >
            <Popup>
              <div className="text-gray-900 text-sm min-w-[140px]">
                <p className="font-bold">{item.name}</p>
                {item.rating != null && item.rating > 0 && (
                  <p className="text-yellow-600 text-xs mt-0.5">⭐ {item.rating.toFixed(1)}</p>
                )}
                {item.badge && (
                  <p className="text-xs text-green-700 mt-0.5">{item.badge}</p>
                )}
                <a
                  href={item.href}
                  className="mt-2 inline-block text-xs font-semibold text-orange-600 underline"
                >
                  Ver perfil →
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
        <FitBounds positions={positions} />
      </MapContainer>
    </div>
  )
}
