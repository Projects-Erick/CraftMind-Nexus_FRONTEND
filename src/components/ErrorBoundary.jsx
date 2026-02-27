import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('CraftMind Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', background: '#020617', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '24px'
        }}>
          <div style={{
            background: '#0F172A', border: '1px solid #EF4444', borderRadius: '16px',
            padding: '32px', maxWidth: '500px', width: '100%', textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ color: '#EF4444', fontSize: '20px', marginBottom: '8px' }}>
              Algo deu errado
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '24px' }}>
              {this.state.error?.message || 'Erro desconhecido'}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.href = '/login'; }}
              style={{
                background: '#6D28D9', color: 'white', border: 'none',
                borderRadius: '10px', padding: '10px 24px', cursor: 'pointer',
                fontSize: '14px', fontWeight: '600'
              }}
            >
              🔄 Voltar ao Login
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
