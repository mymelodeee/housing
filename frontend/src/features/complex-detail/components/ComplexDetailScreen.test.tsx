import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { ComplexDetailScreen } from './ComplexDetailScreen'
import { useComplex } from '../hooks/useComplex'

vi.mock('../hooks/useComplex', () => ({ useComplex: vi.fn() }))
vi.mock('./ComplexDetailTabs', () => ({
  ComplexDetailTabs: () => <div data-testid="tabs-stub" />,
}))

const mockedUseComplex = vi.mocked(useComplex)

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location-probe">{location.pathname}{location.search}</output>
}

describe('ComplexDetailScreen', () => {
  it('← 목록으로 클릭 시 이전 검색 화면(쿼리 포함)으로 브라우저 back 이동한다', async () => {
    mockedUseComplex.mockReturnValue({ data: undefined, isLoading: true, isError: false } as ReturnType<
      typeof useComplex
    >)
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/?city=%EC%9A%A9%EC%9D%B8%EC%8B%9C&mode=transactions', '/complexes/7']} initialIndex={1}>
        <LocationProbe />
        <Routes>
          <Route path="/" element={<div data-testid="search-stub" />} />
          <Route path="/complexes/:complexId" element={<ComplexDetailScreen />} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: '← 목록으로' }))

    expect(screen.getByTestId('location-probe')).toHaveTextContent(
      '/?city=%EC%9A%A9%EC%9D%B8%EC%8B%9C&mode=transactions',
    )
  })
})
