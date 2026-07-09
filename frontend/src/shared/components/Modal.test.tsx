import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from './Modal'

describe('Modal', () => {
  it('open이 false이면 아무것도 렌더링하지 않는다', () => {
    render(
      <Modal open={false} title="제목" onClose={vi.fn()}>
        내용
      </Modal>,
    )

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('open이 true이면 aria-label, 제목, children이 렌더링된다', () => {
    render(
      <Modal open title="확인 다이얼로그" onClose={vi.fn()}>
        본문 내용입니다
      </Modal>,
    )

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-label', '확인 다이얼로그')
    expect(screen.getByText('확인 다이얼로그')).toBeInTheDocument()
    expect(screen.getByText('본문 내용입니다')).toBeInTheDocument()
  })

  it('취소 버튼(기본 라벨 닫기) 클릭 시 onClose가 호출된다', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <Modal open title="제목" onClose={onClose}>
        내용
      </Modal>,
    )

    await user.click(screen.getByRole('button', { name: '닫기' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('onConfirm이 제공되지 않으면 확인 버튼이 렌더링되지 않는다', () => {
    render(
      <Modal open title="제목" onClose={vi.fn()}>
        내용
      </Modal>,
    )

    expect(screen.queryByRole('button', { name: '확인' })).toBeNull()
  })

  it('onConfirm이 제공되면 확인 버튼이 렌더링되고 클릭 시 onConfirm이 호출된다', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()

    render(
      <Modal open title="제목" onClose={vi.fn()} onConfirm={onConfirm}>
        내용
      </Modal>,
    )

    const confirmButton = screen.getByRole('button', { name: '확인' })
    expect(confirmButton).toBeInTheDocument()

    await user.click(confirmButton)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('커스텀 confirmLabel과 cancelLabel이 적용된다', () => {
    render(
      <Modal
        open
        title="제목"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        confirmLabel="삭제"
        cancelLabel="취소"
      >
        내용
      </Modal>,
    )

    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '확인' })).toBeNull()
    expect(screen.queryByRole('button', { name: '닫기' })).toBeNull()
  })
})
