import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[TheClawPull Error Boundary]', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div style={{
        minHeight: '100vh',
        background: '#0C0C10',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 20, padding: 24,
        fontFamily: "'Lato', sans-serif",
        color: '#F0EDE6',
      }}>
        <style>{'@import url(\'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Lato:wght@400;700&display=swap\')'}</style>
        <div style={{ fontSize: 40 }}>⚠️</div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: '#C9A84C' }}>
          Something went wrong
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(240,237,230,0.4)', textAlign: 'center', maxWidth: 340, lineHeight: 1.6 }}>
          An unexpected error occurred. Your credits and vault are safe — this is a display issue only.
        </p>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'rgba(240,237,230,0.2)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 16px', maxWidth: 400, wordBreak: 'break-all' }}>
          {this.state.error?.message || 'Unknown error'}
        </div>
        <button
          onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/' }}
          style={{ padding: '12px 28px', background: 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.08))', border: '1px solid rgba(201,168,76,0.4)', borderRadius: 10, color: '#C9A84C', fontFamily: "'Lato', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: 2, cursor: 'pointer' }}
        >
          RETURN HOME
        </button>
      </div>
    )
  }
}
