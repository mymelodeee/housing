import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { AppLayout } from './AppLayout'

function renderLayout(initialPath = '/') {
  const router = createMemoryRouter(
    [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <p>홈 화면</p> },
          { path: '/favorites', element: <p>즐겨찾기 화면</p> },
          { path: '/comparison-sets', element: <p>비교셋 화면</p> },
          { path: '/profile', element: <p>내 정보 화면</p> },
        ],
      },
    ],
    { initialEntries: [initialPath] },
  )
  return render(<RouterProvider router={router} />)
}

describe('AppLayout', () => {
  it('로고와 네비게이션 링크를 렌더링한다', () => {
    renderLayout()

    expect(screen.getByRole('link', { name: 'housing' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: '즐겨찾기' })).toHaveAttribute('href', '/favorites')
    expect(screen.getByRole('link', { name: '비교셋' })).toHaveAttribute('href', '/comparison-sets')
    expect(screen.getByRole('link', { name: '내 정보' })).toHaveAttribute('href', '/profile')
  })

  it('현재 라우트의 자식 화면을 Outlet으로 렌더링한다', () => {
    renderLayout('/favorites')

    expect(screen.getByText('즐겨찾기 화면')).toBeInTheDocument()
  })
})
