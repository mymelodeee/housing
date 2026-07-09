import type { ReactNode } from 'react'
import './Badge.css'

type BadgeVariant = 'default' | 'needs-confirmation'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
}

export function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span className="badge" data-variant={variant}>
      {children}
    </span>
  )
}
