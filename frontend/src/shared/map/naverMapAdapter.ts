import type { MapAdapter, MapPoint } from './mapAdapter'

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }
const DEFAULT_ZOOM = 12

export class NaverMapAdapter implements MapAdapter {
  private map: naver.maps.Map | null = null
  private markers: naver.maps.Marker[] = []

  init(container: HTMLElement, options?: { center?: { lat: number; lng: number }; zoom?: number }): void {
    const center = options?.center ?? DEFAULT_CENTER
    this.map = new naver.maps.Map(container, {
      center: new naver.maps.LatLng(center.lat, center.lng),
      zoom: options?.zoom ?? DEFAULT_ZOOM,
      zoomControl: true,
    })
  }

  setMarkers(points: MapPoint[], onMarkerClick: (id: MapPoint['id']) => void): void {
    if (!this.map) return

    this.markers.forEach((marker) => marker.setMap(null))
    this.markers = points.map((point) => {
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(point.lat, point.lng),
        map: this.map!,
      })
      naver.maps.Event.addListener(marker, 'click', () => onMarkerClick(point.id))
      return marker
    })
  }

  destroy(): void {
    this.markers.forEach((marker) => marker.setMap(null))
    this.markers = []
    this.map = null
  }
}
