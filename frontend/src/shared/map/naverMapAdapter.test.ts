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

  beforeEach(() => {
    markerInstances = []
    markerMock = vi.fn(function MarkerCtor() {
      const instance = createMarkerInstance()
      markerInstances.push(instance)
      return instance
    })
    addListenerMock = vi.fn()
    mapMock = vi.fn(function MapCtor() {
      return {}
    })

    vi.stubGlobal('naver', {
      maps: {
        Map: mapMock,
        Marker: markerMock,
        LatLng: vi.fn(function LatLngCtor(lat: number, lng: number) {
          return { lat, lng }
        }),
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
