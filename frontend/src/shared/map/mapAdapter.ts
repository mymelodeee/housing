export interface MapPoint {
  id: string | number
  lat: number
  lng: number
}

export interface MapAdapter {
  init(container: HTMLElement, options?: { center?: { lat: number; lng: number }; zoom?: number }): void
  setMarkers(points: MapPoint[], onMarkerClick: (id: MapPoint['id']) => void): void
  fitBounds(points: MapPoint[]): void
  destroy(): void
}
