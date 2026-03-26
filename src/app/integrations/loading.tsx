export default function IntegrationsLoading() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f1117' }}>
      {/* Nav */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 32px',
          borderBottom: '1px solid #1a1d27',
          background: 'rgba(15,17,23,0.85)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="animate-pulse" style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#1a1d27' }} />
          <div className="animate-pulse" style={{ width: '120px', height: '16px', borderRadius: '4px', background: '#1a1d27' }} />
          <div style={{ width: '1px', height: '16px', background: '#2a2d3a', margin: '0 4px' }} />
          <div className="animate-pulse" style={{ width: '90px', height: '14px', borderRadius: '4px', background: '#1a1d27' }} />
        </div>
        <div className="animate-pulse" style={{ width: '100px', height: '36px', borderRadius: '8px', background: '#1a1d27' }} />
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>
        {/* Search bar */}
        <div className="animate-pulse" style={{ width: '100%', height: '48px', borderRadius: '12px', background: '#1a1d27', marginBottom: '24px' }} />

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                height: '80px',
                borderRadius: '12px',
                background: '#1a1d27',
                border: '1px solid #2a2d3a',
              }}
            />
          ))}
        </div>

        {/* Integration cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                height: '140px',
                borderRadius: '12px',
                background: '#1a1d27',
                border: '1px solid #2a2d3a',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
