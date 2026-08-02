import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MapView } from './MapView'
import { useNaverMapsScript } from './useNaverMapsScript'
import type { MapPoint } from './mapAdapter'

const { initMock, setMarkersMock, destroyMock, fitBoundsMock } = vi.hoisted(() => ({
  initMock: vi.fn(),
  setMarkersMock: vi.fn(),
  destroyMock: vi.fn(),
  fitBoundsMock: vi.fn(),
}))

vi.mock('./naverMapAdapter', () => ({
  NaverMapAdapter: vi.fn().mockImplementation(function NaverMapAdapterCtor() {
    return {
      init: initMock,
      setMarkers: setMarkersMock,
      destroy: destroyMock,
      fitBounds: fitBoundsMock,
    }
  }),
}))

vi.mock('./useNaverMapsScript', () => ({
  useNaverMapsScript: vi.fn(),
}))

const mockedUseNaverMapsScript = vi.mocked(useNaverMapsScript)

describe('MapView', () => {
  beforeEach(() => {
    initMock.mockClear()
    setMarkersMock.mockClear()
    destroyMock.mockClear()
    fitBoundsMock.mockClear()
    mockedUseNaverMapsScript.mockReset()
  })

  it("status가 error이면 '지도를 불러올 수 없습니다.'를 렌더링하고 어댑터와 상호작용하지 않는다", () => {
    mockedUseNaverMapsScript.mockReturnValue('error')

    render(<MapView listings={[]} onMarkerClick={vi.fn()} />)

    expect(screen.getByText('지도를 불러올 수 없습니다.')).toBeInTheDocument()
    expect(initMock).not.toHaveBeenCalled()
    expect(setMarkersMock).not.toHaveBeenCalled()
  })

  it("status가 loading이면 '지도를 불러오는 중입니다...'를 렌더링한다", () => {
    mockedUseNaverMapsScript.mockReturnValue('loading')

    render(<MapView listings={[]} onMarkerClick={vi.fn()} />)

    expect(screen.getByText('지도를 불러오는 중입니다...')).toBeInTheDocument()
  })

  it('status가 ready이면 컨테이너로 어댑터를 초기화하고 마커를 설정하며, 마커 클릭 콜백이 onMarkerClick을 호출한다', () => {
    mockedUseNaverMapsScript.mockReturnValue('ready')
    const onMarkerClick = vi.fn()
    const listings: MapPoint[] = [{ id: 1, lat: 37.5, lng: 127.0 }]

    const { container } = render(<MapView listings={listings} onMarkerClick={onMarkerClick} />)

    const mapContainer = container.querySelector('.map-view')
    expect(mapContainer).not.toBeNull()

    expect(initMock).toHaveBeenCalledTimes(1)
    expect(initMock).toHaveBeenCalledWith(mapContainer)

    expect(setMarkersMock).toHaveBeenCalledTimes(1)
    expect(setMarkersMock).toHaveBeenCalledWith(listings, expect.any(Function))

    const registeredCallback = setMarkersMock.mock.calls[0][1]
    registeredCallback(1)
    expect(onMarkerClick).toHaveBeenCalledWith(1)
  })

  it('listings prop이 변경되면 setMarkers가 다시 호출되지만 init은 재호출되지 않는다', () => {
    mockedUseNaverMapsScript.mockReturnValue('ready')
    const onMarkerClick = vi.fn()
    const initialListings: MapPoint[] = [{ id: 1, lat: 37.5, lng: 127.0 }]
    const updatedListings: MapPoint[] = [
      { id: 1, lat: 37.5, lng: 127.0 },
      { id: 2, lat: 37.6, lng: 127.1 },
    ]

    const { rerender } = render(<MapView listings={initialListings} onMarkerClick={onMarkerClick} />)

    expect(setMarkersMock).toHaveBeenCalledTimes(1)

    rerender(<MapView listings={updatedListings} onMarkerClick={onMarkerClick} />)

    expect(initMock).toHaveBeenCalledTimes(1)
    expect(setMarkersMock).toHaveBeenCalledTimes(2)
    expect(setMarkersMock).toHaveBeenLastCalledWith(updatedListings, expect.any(Function))
  })

  it('listings가 처음 채워지면 fitBounds가 1회 호출된다', () => {
    mockedUseNaverMapsScript.mockReturnValue('ready')
    const listings: MapPoint[] = [{ id: 1, lat: 37.5, lng: 127.0 }]

    render(<MapView listings={listings} onMarkerClick={vi.fn()} />)

    expect(fitBoundsMock).toHaveBeenCalledTimes(1)
    expect(fitBoundsMock).toHaveBeenCalledWith(listings)
  })

  it('listings가 비어있을 때 초기 렌더링되면 fitBounds가 호출되지 않는다', () => {
    mockedUseNaverMapsScript.mockReturnValue('ready')

    render(<MapView listings={[]} onMarkerClick={vi.fn()} />)

    expect(fitBoundsMock).not.toHaveBeenCalled()
  })

  it('최초 fitBounds 이후 listings가 다시 변경되어도 fitBounds가 재호출되지 않는다', () => {
    mockedUseNaverMapsScript.mockReturnValue('ready')
    const onMarkerClick = vi.fn()
    const initialListings: MapPoint[] = [{ id: 1, lat: 37.5, lng: 127.0 }]
    const updatedListings: MapPoint[] = [
      { id: 1, lat: 37.5, lng: 127.0 },
      { id: 2, lat: 37.6, lng: 127.1 },
    ]

    const { rerender } = render(<MapView listings={initialListings} onMarkerClick={onMarkerClick} />)

    expect(fitBoundsMock).toHaveBeenCalledTimes(1)

    rerender(<MapView listings={updatedListings} onMarkerClick={onMarkerClick} />)

    expect(fitBoundsMock).toHaveBeenCalledTimes(1)
  })

  it('listings가 빈 배열로 시작했다가 채워지면 그 시점에 fitBounds가 1회 호출된다', () => {
    mockedUseNaverMapsScript.mockReturnValue('ready')
    const onMarkerClick = vi.fn()
    const filledListings: MapPoint[] = [{ id: 1, lat: 37.5, lng: 127.0 }]

    const { rerender } = render(<MapView listings={[]} onMarkerClick={onMarkerClick} />)

    expect(fitBoundsMock).not.toHaveBeenCalled()

    rerender(<MapView listings={filledListings} onMarkerClick={onMarkerClick} />)

    expect(fitBoundsMock).toHaveBeenCalledTimes(1)
    expect(fitBoundsMock).toHaveBeenCalledWith(filledListings)
  })

  it('status가 ready인 상태로 언마운트되면 adapter.destroy가 호출된다', () => {
    mockedUseNaverMapsScript.mockReturnValue('ready')

    const { unmount } = render(<MapView listings={[]} onMarkerClick={vi.fn()} />)

    unmount()

    expect(destroyMock).toHaveBeenCalledTimes(1)
  })
})
