import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ComparisonSetListScreen } from './ComparisonSetListScreen'
import { useComparisonSets } from '../hooks/useComparisonSets'
import type { ComparisonSetSummary } from '../types'

vi.mock('../hooks/useComparisonSets')

const mockedUseComparisonSets = vi.mocked(useComparisonSets)

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={['/comparison-sets']}>
      <Routes>
        <Route path="/comparison-sets" element={<ComparisonSetListScreen />} />
        <Route path="/comparison-sets/:id" element={<p>비교셋 상세 화면</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ComparisonSetListScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('로딩 중이면 불러오는 중... 을 표시한다', () => {
    mockedUseComparisonSets.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as unknown as ReturnType<typeof useComparisonSets>)

    renderScreen()

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument()
  })

  it('에러이면 role=alert 를 표시한다', () => {
    mockedUseComparisonSets.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as unknown as ReturnType<typeof useComparisonSets>)

    renderScreen()

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('목록이 0건이면 안내 문구를 표시한다', () => {
    mockedUseComparisonSets.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useComparisonSets>)

    renderScreen()

    expect(screen.getByText('생성된 비교셋이 없습니다.')).toBeInTheDocument()
  })

  it('목록을 카드로 렌더링하고 클릭 시 상세 화면으로 이동한다', async () => {
    const user = userEvent.setup()
    const data: ComparisonSetSummary[] = [
      {
        id: 7,
        targetType: 'complex',
        createdAt: '2026-01-01T00:00:00.000Z',
        itemCount: 3,
        itemNames: ['단지A', '단지B', '단지C'],
      },
    ]
    mockedUseComparisonSets.mockReturnValue({
      data,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useComparisonSets>)

    renderScreen()

    expect(screen.getByText('단지 비교')).toBeInTheDocument()
    expect(screen.getByText('3개')).toBeInTheDocument()
    expect(screen.getByText('단지A, 단지B, 단지C')).toBeInTheDocument()

    await user.click(screen.getByText('단지 비교'))

    expect(screen.getByText('비교셋 상세 화면')).toBeInTheDocument()
  })
})
