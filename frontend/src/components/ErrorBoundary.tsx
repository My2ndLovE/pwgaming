import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  level?: 'app' | 'page' | 'component';
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * T068-T070: React Error Boundary with Sentry integration
 * Prevents full app crashes by catching errors at component level
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // T069: Log to Sentry with context
    Sentry.withScope((scope) => {
      scope.setTag('errorBoundary', this.props.level || 'component');
      scope.setContext('errorInfo', {
        componentStack: errorInfo.componentStack,
      });
      Sentry.captureException(error);
    });

    // T070: Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({ error, errorInfo });
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI based on error level
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <h2>
              {this.props.level === 'app'
                ? 'Application Error'
                : this.props.level === 'page'
                ? 'Page Error'
                : 'Component Error'}
            </h2>
            <p>
              {this.props.level === 'app'
                ? 'Something went wrong. Please refresh the page.'
                : 'An error occurred. You can try reloading or continue using other parts of the app.'}
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <pre>{this.state.error.toString()}</pre>
                {this.state.errorInfo && (
                  <pre>{this.state.errorInfo.componentStack}</pre>
                )}
              </details>
            )}
            <button onClick={this.handleReset} className="error-boundary-reset">
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="error-boundary-reload"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// T071: Convenience wrapper with Sentry integration
export const SentryErrorBoundary = Sentry.withErrorBoundary(ErrorBoundary, {
  fallback: (errorData) => (
    <div className="error-boundary-container">
      <div className="error-boundary-content">
        <h2>Unexpected Error</h2>
        <p>An error has been reported. Please try refreshing the page.</p>
        {process.env.NODE_ENV === 'development' && errorData.error && (
          <details className="error-details">
            <summary>Error Details</summary>
            <pre>{errorData.error.toString()}</pre>
          </details>
        )}
        <button onClick={() => errorData.resetError()}>Try Again</button>
        <button onClick={() => window.location.reload()}>Reload Page</button>
      </div>
    </div>
  ),
  showDialog: false,
});
