export default function TriggersLoading() {
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
          <div className="animate-pulse" style={{ width: '70px', height: '14px', borderRadius: '4px', background: '#1a1d27' }} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div className="animate-pulse" style={{ width: '100px', height: '36px', borderRadius: '8px', background: '#1a1d27' }} />
          <div className="animate-pulse" style={{ width: '120px', height: '36px', borderRadius: '8px', background: '#1a1d27' }} />
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[1, 2, 3].map((i) => (
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

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {[80, 90, 100, 70].map((w, i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                width: `${w}px`,
                height: '32px',
                borderRadius: '20px',
                background: '#1a1d27',
              }}
            />
          ))}
        </div>

        {/* Trigger rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                height: '72px',
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
