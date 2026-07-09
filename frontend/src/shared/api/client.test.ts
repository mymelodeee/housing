import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiClient, ApiError } from './client'

describe('apiClient', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('응답이 ok이면 JSON 바디를 반환한다', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ foo: 'bar' }),
    } as Response)

    const result = await apiClient<{ foo: string }>('/api/test')

    expect(result).toEqual({ foo: 'bar' })
  })

  it('응답이 204이면 undefined를 반환한다', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      status: 204,
    } as Response)

    const result = await apiClient('/api/test')

    expect(result).toBeUndefined()
  })

  it('응답이 실패이고 JSON 바디에 message가 있으면 ApiError.message는 해당 message이다', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 409,
      statusText: 'Conflict',
      text: () => Promise.resolve(JSON.stringify({ message: '중복입니다' })),
    } as Response)

    await expect(apiClient('/api/test')).rejects.toMatchObject({
      status: 409,
      message: '중복입니다',
    })

    try {
      await apiClient('/api/test')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
    }
  })

  it('응답이 실패이고 바디가 JSON이 아니면 원본 텍스트로 fallback한다', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: () => Promise.resolve('서버 오류 발생'),
    } as Response)

    await expect(apiClient('/api/test')).rejects.toMatchObject({
      status: 500,
      message: '서버 오류 발생',
    })
  })

  it('응답이 실패이고 바디가 비어있으면 statusText로 fallback한다', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: () => Promise.resolve(''),
    } as Response)

    await expect(apiClient('/api/test')).rejects.toMatchObject({
      status: 500,
      message: 'Internal Server Error',
    })
  })
})
