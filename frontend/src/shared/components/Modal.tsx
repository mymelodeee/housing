import type { ReactNode } from 'react'
import './Modal.css'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  onConfirm?: () => void
  confirmLabel?: string
  cancelLabel?: string
  children: ReactNode
}

export function Modal({ open, title, onClose, onConfirm, confirmLabel = '확인', cancelLabel = '닫기', children }: ModalProps) {
  if (!open) return null

  return (
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <h2 className="modal-title">{title}</h2>
        <div className="modal-body">{children}</div>
        <div className="modal-actions">
          <button type="button" className="modal-button" onClick={onClose}>{cancelLabel}</button>
          {onConfirm && (
            <button type="button" className="modal-button modal-button--confirm" onClick={onConfirm}>{confirmLabel}</button>
          )}
        </div>
      </div>
    </div>
  )
}
