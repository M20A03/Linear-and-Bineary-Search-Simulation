import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[CRITICAL RUNTIME ERROR]:', {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleNavigateHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={errorStyles.container}>
          <div className="glass-panel" style={errorStyles.card}>
            <div style={errorStyles.iconWrapper}>
              <AlertTriangle size={44} color="var(--error-color)" />
            </div>
            <h2 style={errorStyles.title}>Mission System Anomaly</h2>
            <p style={errorStyles.message}>
              A runtime anomaly was intercepted. System telemetry is intact.
            </p>
            {this.state.error && (
              <pre style={errorStyles.stackTrace}>
                <code>{this.state.error.toString()}</code>
              </pre>
            )}
            <div style={errorStyles.buttonGroup}>
              <button onClick={this.handleReset} className="btn-primary touch-target" style={errorStyles.primaryBtn}>
                <RefreshCw size={16} style={{ marginRight: 8 }} /> Reboot Simulation
              </button>
              <button onClick={this.handleNavigateHome} className="btn-primary touch-target" style={errorStyles.secondaryBtn}>
                <Home size={16} style={{ marginRight: 8 }} /> Return to Base
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const errorStyles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '20px',
    backgroundColor: 'var(--bg-primary)',
  },
  card: {
    maxWidth: '520px',
    width: '100%',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  iconWrapper: {
    marginBottom: '16px',
    padding: '12px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 0, 60, 0.1)',
  },
  title: {
    fontSize: '1.4rem',
    color: 'var(--error-color)',
    marginBottom: '10px',
  },
  message: {
    fontSize: '0.95rem',
    color: 'var(--text-primary)',
    marginBottom: '16px',
  },
  stackTrace: {
    width: '100%',
    textAlign: 'left',
    padding: '12px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    overflowX: 'auto',
    fontSize: '0.8rem',
    color: 'var(--accent-primary)',
    marginBottom: '20px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primaryBtn: {
    backgroundColor: 'var(--accent-primary)',
    color: 'var(--bg-primary)',
    display: 'inline-flex',
    alignItems: 'center',
  },
  secondaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
  },
};

export default ErrorBoundary;
