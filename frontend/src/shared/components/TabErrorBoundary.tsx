import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface TabErrorBoundaryProps {
  fallback?: ReactNode
  children: ReactNode
}

interface TabErrorBoundaryState {
  hasError: boolean
}

export class TabErrorBoundary extends Component<TabErrorBoundaryProps, TabErrorBoundaryState> {
  state: TabErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): TabErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[ERROR] TabErrorBoundary caught an error', error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <p role="alert">일시적인 오류가 발생했습니다.</p>
    }
    return this.props.children
  }
}
