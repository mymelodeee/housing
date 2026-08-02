import { useEffect, useRef } from 'react'
import { useNaverMapsScript } from './useNaverMapsScript'
import { NaverMapAdapter } from './naverMapAdapter'
import type { MapPoint } from './mapAdapter'
import './MapView.css'

interface MapViewProps {
  listings: MapPoint[]
  onMarkerClick: (id: MapPoint['id']) => void
}

export function MapView({ listings, onMarkerClick }: MapViewProps) {
  const status = useNaverMapsScript(import.meta.env.VITE_NAVER_MAP_CLIENT_ID)
  const containerRef = useRef<HTMLDivElement>(null)
  const adapterRef = useRef<NaverMapAdapter | null>(null)
  const hasFitBoundsRef = useRef(false)

  useEffect(() => {
    if (status !== 'ready' || !containerRef.current) return

    const adapter = new NaverMapAdapter()
    adapter.init(containerRef.current)
    adapterRef.current = adapter
    hasFitBoundsRef.current = false

    return () => {
      adapter.destroy()
      adapterRef.current = null
    }
  }, [status])

  useEffect(() => {
    if (status !== 'ready' || !adapterRef.current) return
    adapterRef.current.setMarkers(listings, onMarkerClick)

    if (!hasFitBoundsRef.current && listings.length > 0) {
      adapterRef.current.fitBounds(listings)
      hasFitBoundsRef.current = true
    }
  }, [status, listings, onMarkerClick])

  if (status === 'error') {
    return <div className="map-view-fallback">지도를 불러올 수 없습니다.</div>
  }

  if (status === 'loading') {
    return <div className="map-view-fallback">지도를 불러오는 중입니다...</div>
  }

  return <div ref={containerRef} className="map-view" />
}
