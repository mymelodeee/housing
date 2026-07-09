import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TabErrorBoundary } from './TabErrorBoundary'

function ThrowingChild(): never {
  throw new Error('boom')
}

describe('TabErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('에러가 없으면 children을 정상적으로 렌더링한다', () => {
    render(
      <TabErrorBoundary>
        <div>정상 콘텐츠</div>
      </TabErrorBoundary>,
    )

    expect(screen.getByText('정상 콘텐츠')).toBeInTheDocument()
  })

  it('children에서 에러가 발생하면 기본 fallback을 렌더링한다', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <TabErrorBoundary>
        <ThrowingChild />
      </TabErrorBoundary>,
    )

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('일시적인 오류가 발생했습니다.')
  })

  it('fallback prop이 제공되면 기본 fallback 대신 커스텀 fallback을 렌더링한다', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <TabErrorBoundary fallback={<p>커스텀 오류 화면</p>}>
        <ThrowingChild />
      </TabErrorBoundary>,
    )

    expect(screen.getByText('커스텀 오류 화면')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('한 TabErrorBoundary가 에러를 catch해도 다른 형제 TabErrorBoundary의 정상 콘텐츠는 영향을 받지 않는다', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <div>
        <TabErrorBoundary>
          <ThrowingChild />
        </TabErrorBoundary>
        <TabErrorBoundary>
          <div>다른 탭의 정상 콘텐츠</div>
        </TabErrorBoundary>
      </div>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('일시적인 오류가 발생했습니다.')
    expect(screen.getByText('다른 탭의 정상 콘텐츠')).toBeInTheDocument()
  })
})
