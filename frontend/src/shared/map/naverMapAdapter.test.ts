import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NaverMapAdapter } from './naverMapAdapter'

function createMarkerInstance() {
  return { setMap: vi.fn() }
}

describe('NaverMapAdapter', () => {
  let markerInstances: ReturnType<typeof createMarkerInstance>[]
  let markerMock: ReturnType<typeof vi.fn>
  let addListenerMock: ReturnType<typeof vi.fn>
  let mapMock: ReturnType<typeof vi.fn>
  let mapInstance: { setCenter: ReturnType<typeof vi.fn>; setZoom: ReturnType<typeof vi.fn>; fitBounds: ReturnType<typeof vi.fn> }
  let latLngBoundsMock: ReturnType<typeof vi.fn>
  let boundsExtendMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    markerInstances = []
    markerMock = vi.fn(function MarkerCtor() {
      const instance = createMarkerInstance()
      markerInstances.push(instance)
      return instance
    })
    addListenerMock = vi.fn()
    mapInstance = { setCenter: vi.fn(), setZoom: vi.fn(), fitBounds: vi.fn() }
    mapMock = vi.fn(function MapCtor() {
      return mapInstance
    })
    boundsExtendMock = vi.fn()
    latLngBoundsMock = vi.fn(function LatLngBoundsCtor() {
      return { extend: boundsExtendMock }
    })

    vi.stubGlobal('naver', {
      maps: {
        Map: mapMock,
        Marker: markerMock,
        LatLng: vi.fn(function LatLngCtor(lat: number, lng: number) {
          return { lat, lng }
        }),
        LatLngBounds: latLngBoundsMock,
        Event: { addListener: addListenerMock },
      },
    })
  })

  it('init은 컨테이너와 옵션 객체로 Map을 생성한다', () => {
    const adapter = new NaverMapAdapter()
    const container = document.createElement('div')

    adapter.init(container)

    expect(mapMock).toHaveBeenCalledTimes(1)
    expect(mapMock).toHaveBeenCalledWith(container, expect.any(Object))
  })

  it('setMarkers는 포인트마다 Marker를 생성하고 클릭 리스너를 등록한다', () => {
    const adapter = new NaverMapAdapter()
    const container = document.createElement('div')
    adapter.init(container)

    const onMarkerClick = vi.fn()
    const points = [
      { id: 1, lat: 37.5, lng: 127.0 },
      { id: 2, lat: 37.6, lng: 127.1 },
    ]

    adapter.setMarkers(points, onMarkerClick)

    expect(markerMock).toHaveBeenCalledTimes(2)
    expect(addListenerMock).toHaveBeenCalledTimes(2)

    addListenerMock.mock.calls.forEach((call, index) => {
      const [markerArg, eventName, callback] = call
      expect(markerArg).toBe(markerInstances[index])
      expect(eventName).toBe('click')
      callback()
      expect(onMarkerClick).toHaveBeenCalledWith(points[index].id)
    })

    expect(onMarkerClick).toHaveBeenCalledTimes(2)
  })

  it('setMarkers를 두 번 호출하면 첫 배치의 마커가 정리된다', () => {
    const adapter = new NaverMapAdapter()
    const container = document.createElement('div')
    adapter.init(container)

    adapter.setMarkers([{ id: 1, lat: 37.5, lng: 127.0 }], vi.fn())
    const firstBatchMarker = markerInstances[0]

    adapter.setMarkers([{ id: 2, lat: 37.6, lng: 127.1 }], vi.fn())

    expect(firstBatchMarker.setMap).toHaveBeenCalledWith(null)
    expect(markerInstances).toHaveLength(2)
    expect(markerInstances[1].setMap).not.toHaveBeenCalled()
  })

  it('fitBounds는 points가 0개면 아무것도 호출하지 않는다', () => {
    const adapter = new NaverMapAdapter()
    const container = document.createElement('div')
    adapter.init(container)

    adapter.fitBounds([])

    expect(mapInstance.fitBounds).not.toHaveBeenCalled()
    expect(mapInstance.setCenter).not.toHaveBeenCalled()
    expect(latLngBoundsMock).not.toHaveBeenCalled()
  })

  it('fitBounds는 points가 1개면 setCenter와 setZoom을 호출한다', () => {
    const adapter = new NaverMapAdapter()
    const container = document.createElement('div')
    adapter.init(container)

    adapter.fitBounds([{ id: 1, lat: 37.5, lng: 127.0 }])

    expect(mapInstance.setCenter).toHaveBeenCalledWith({ lat: 37.5, lng: 127.0 })
    expect(mapInstance.setZoom).toHaveBeenCalledTimes(1)
    expect(mapInstance.fitBounds).not.toHaveBeenCalled()
  })

  it('fitBounds는 points가 여러 개면 LatLngBounds를 확장해 map.fitBounds를 호출한다', () => {
    const adapter = new NaverMapAdapter()
    const container = document.createElement('div')
    adapter.init(container)

    const points = [
      { id: 1, lat: 37.5, lng: 127.0 },
      { id: 2, lat: 37.6, lng: 127.1 },
    ]

    adapter.fitBounds(points)

    expect(latLngBoundsMock).toHaveBeenCalledTimes(1)
    expect(boundsExtendMock).toHaveBeenCalledTimes(1)
    expect(boundsExtendMock).toHaveBeenCalledWith({ lat: 37.6, lng: 127.1 })
    expect(mapInstance.fitBounds).toHaveBeenCalledTimes(1)
  })

  it('destroy는 현재 모든 마커를 정리한다', () => {
    const adapter = new NaverMapAdapter()
    const container = document.createElement('div')
    adapter.init(container)

    adapter.setMarkers(
      [
        { id: 1, lat: 37.5, lng: 127.0 },
        { id: 2, lat: 37.6, lng: 127.1 },
      ],
      vi.fn(),
    )

    adapter.destroy()

    markerInstances.forEach((marker) => {
      expect(marker.setMap).toHaveBeenCalledWith(null)
    })
  })
})
