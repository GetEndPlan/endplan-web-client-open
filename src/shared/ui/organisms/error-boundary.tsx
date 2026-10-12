import { Component, type ErrorInfo, type ReactNode } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
  fallback?: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <h2 className="typo-heading-section text-slate-900 dark:text-slate-100">
            Something went wrong
          </h2>
          <p className="typo-body-sm text-slate-500 dark:text-slate-400">
            An unexpected error occurred. Please refresh the page and try again.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-ep-primary px-4 py-2 typo-body-sm text-white transition hover:bg-ep-primary-accent dark:bg-ep-primary dark:hover:bg-ep-primary"
          >
            Refresh page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
