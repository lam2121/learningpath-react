import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, Home, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/shadcn/component/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Production telemetry / monitoring hook (e.g. Sentry / Datadog)
    if (typeof window !== "undefined") {
      const windowWithTelemetry = window as Window & {
        captureException?: (error: Error, context: unknown) => void;
      };
      if (typeof windowWithTelemetry.captureException === "function") {
        windowWithTelemetry.captureException(error, { extra: errorInfo });
      }
    }

    console.error("[GlobalErrorBoundary] Caught an uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  private toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-background text-foreground">
          <div className="w-full max-w-lg rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl p-6 sm:p-8 shadow-elevation-4 text-center">
            {/* Pulsing Warning Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 ring-8 ring-amber-500/5 animate-pulse">
              <AlertTriangle className="h-8 w-8" />
            </div>

            <h1 className="mt-5 text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-foreground">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              We encountered an unexpected issue while rendering this view. Your progress has been safely saved.
            </p>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={this.handleReset}
                className="w-full sm:w-auto h-11 px-5 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-elevation-2"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
              <Button
                variant="outline"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto h-11 px-5 rounded-xl font-semibold border-border hover:bg-accent"
              >
                <Home className="mr-2 h-4 w-4" />
                Return to Home
              </Button>
            </div>

            {/* Developer Details Accordion */}
            {this.state.error && (
              <div className="mt-6 pt-5 border-t border-border/60 text-left">
                <button
                  type="button"
                  onClick={this.toggleDetails}
                  className="w-full flex items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>Technical Diagnostics</span>
                  {this.state.showDetails ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>

                {this.state.showDetails && (
                  <div className="mt-3 p-3 rounded-xl bg-muted/60 border border-border text-[11px] font-mono text-muted-foreground overflow-auto max-h-44 text-left">
                    <p className="font-bold text-destructive">
                      {this.state.error.name}: {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <pre className="mt-2 whitespace-pre-wrap text-[10px] opacity-80">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
