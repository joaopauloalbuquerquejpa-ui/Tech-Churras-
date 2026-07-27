'use client'
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const eventIcon = L.divIcon({
  html: '<div style="width:14px;height:14px;background:#3b82f6;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.6)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  className: '',
})

const grillmasterIcon = L.divIcon({
  html: '<div style="width:16px;height:16px;background:#c23616;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.6)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  className: '',
})

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function MapFit({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length === 0) return
    if (positions.length === 1) { map.setView(positions[0], 14); return }
    map.fitBounds(positions.map(p => [p[0], p[1]]) as any, { padding: [40, 40] })
  }, [positions.map(p => p.join()).join('|')])
  return null
}

interface Props {
  eventAddress: string
  grillmasterLat?: number | null
  grillmasterLng?: number | null
}

export default function OrderMap({ eventAddress, grillmasterLat, grillmasterLng }: Props) {
  const [eventPos, setEventPos] = useState<[number, number] | null>(null)
  const [geocodeError, setGeocodeError] = useState(false)

  useEffect(() => {
    if (!eventAddress) return
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(eventAddress)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'pt-BR' } }
    )
      .then(r => r.json())
      .then(data => {
        if (data && data[0]) {
          setEventPos([parseFloat(data[0].lat), parseFloat(data[0].lon)])
        } else {
          setGeocodeError(true)
        }
      })
      .catch(() => setGeocodeError(true))
  }, [eventAddress])

  const gmPos: [number, number] | null =
    grillmasterLat != null && grillmasterLng != null
      ? [grillmasterLat, grillmasterLng]
      : null

  const positions: [number, number][] = [
    ...(eventPos ? [eventPos] : []),
    ...(gmPos ? [gmPos] : []),
  ]

  const distance =
    eventPos && gmPos
      ? haversineKm(eventPos[0], eventPos[1], gmPos[0], gmPos[1])
      : null

  const defaultCenter: [number, number] = eventPos ?? gmPos ?? [-15.77972, -47.92972]

  if (geocodeError && !gmPos) {
    return (
      <div className="bg-gray-800 rounded-xl p-4 text-center text-sm text-gray-400">
        Nao foi possivel obter coordenadas do endereco.
      </div>
    )
  }

  if (!eventPos && !gmPos) {
    return (
      <div className="bg-gray-800 rounded-xl p-4 text-center text-sm text-gray-400 animate-pulse">
        Carregando mapa...
      </div>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden border border-gray-700">
      {distance != null && (() => {
        const etaMin = Math.round(distance * 1.4 / 40 * 60)
        const etaLabel = etaMin < 2 ? 'chegando' : etaMin < 60 ? `~${etaMin} min` : `~${Math.round(etaMin / 60)}h`
        const distLabel = distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`
        return (
          <div className="bg-gray-800 px-4 py-2.5 border-b border-gray-700 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🚗</span>
              <div>
                <p className="text-orange-400 font-bold text-sm leading-none">{etaLabel}</p>
                <p className="text-gray-500 text-xs mt-0.5">{distLabel} do evento</p>
              </div>
            </div>
            <span className="ml-auto flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span> Churrasqueiro
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block ml-2"></span> Evento
            </span>
          </div>
        )
      })()}
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: '280px', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        />
        {eventPos && (
          <Marker position={eventPos} icon={eventIcon}>
            <Popup>Local do evento</Popup>
          </Marker>
        )}
        {gmPos && (
          <Marker position={gmPos} icon={grillmasterIcon}>
            <Popup>Churrasqueiro</Popup>
          </Marker>
        )}
        <MapFit positions={positions} />
      </MapContainer>
    </div>
  )
}
