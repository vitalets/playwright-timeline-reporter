/**
 * Catch rendering errors in the report app and render a shared error panel.
 */
import { Component } from 'react';
import { ReportError } from './error.js';

export class ReportErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      const message = this.state.error.stack ?? this.state.error.message;
      return <ReportError message={message} />;
    }
    return this.props.children;
  }
}
