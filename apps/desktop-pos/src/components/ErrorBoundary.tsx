import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@repo/ui/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full flex-col items-center justify-center space-y-4 p-8 text-center bg-red-50">
          <h2 className="text-xl font-bold text-red-600">Something went wrong</h2>
          <p className="text-sm text-gray-600 max-w-md bg-white p-4 rounded border border-red-100 font-mono">
            {this.state.error?.message}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
          >
            Reload App
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
