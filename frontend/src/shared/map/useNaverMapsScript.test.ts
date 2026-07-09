import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useNaverMapsScript } from './useNaverMapsScript'

function getInjectedScript() {
  return document.getElementById('naver-maps-sdk') as HTMLScriptElement | null
}

describe('useNaverMapsScript', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    document.querySelectorAll('#naver-maps-sdk').forEach((el) => el.remove())
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('clientId가 없으면 즉시 error를 반환하고 스크립트를 삽입하지 않는다', () => {
    const { result } = renderHook(() => useNaverMapsScript(undefined))

    expect(result.current).toBe('error')
    expect(getInjectedScript()).toBeNull()
  })

  it('clientId가 있으면 loading을 반환하고 올바른 src로 스크립트를 삽입한다', () => {
    const { result } = renderHook(() => useNaverMapsScript('test-client-id'))

    expect(result.current).toBe('loading')

    const script = getInjectedScript()
    expect(script).not.toBeNull()
    expect(script?.src).toContain('ncpKeyId=test-client-id')
  })

  it('load 이벤트 발생 시 window.naver.maps가 있으면 ready가 된다', async () => {
    const { result } = renderHook(() => useNaverMapsScript('test-client-id'))

    vi.stubGlobal('naver', { maps: {} })
    const script = getInjectedScript()
    act(() => {
      script?.dispatchEvent(new Event('load'))
    })

    await waitFor(() => expect(result.current).toBe('ready'))
  })

  it('load 이벤트 발생 시 window.naver.maps가 없으면 error가 된다', async () => {
    const { result } = renderHook(() => useNaverMapsScript('test-client-id'))

    const script = getInjectedScript()
    act(() => {
      script?.dispatchEvent(new Event('load'))
    })

    await waitFor(() => expect(result.current).toBe('error'))
  })

  it('스크립트의 error 이벤트 발생 시 error가 된다', async () => {
    const { result } = renderHook(() => useNaverMapsScript('test-client-id'))

    const script = getInjectedScript()
    act(() => {
      script?.dispatchEvent(new Event('error'))
    })

    await waitFor(() => expect(result.current).toBe('error'))
  })

  it('10초 안에 load/error가 없고 naver.maps도 나타나지 않으면 error가 된다', () => {
    vi.useFakeTimers()

    const { result } = renderHook(() => useNaverMapsScript('test-client-id'))

    expect(result.current).toBe('loading')

    act(() => {
      vi.advanceTimersByTime(10000)
    })

    expect(result.current).toBe('error')
  })

  it('동일한 clientId로 두 번 렌더링해도 스크립트는 하나만 삽입된다', () => {
    renderHook(() => useNaverMapsScript('test-client-id'))
    renderHook(() => useNaverMapsScript('test-client-id'))

    expect(document.querySelectorAll('#naver-maps-sdk')).toHaveLength(1)
  })
})
