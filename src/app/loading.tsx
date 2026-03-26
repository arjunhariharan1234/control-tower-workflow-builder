export default function Loading() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f1117' }}>
      {/* Nav bar */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 32px',
          borderBottom: '1px solid #1a1d27',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="animate-pulse" style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#1a1d27' }} />
          <div className="animate-pulse" style={{ width: '120px', height: '16px', borderRadius: '4px', background: '#1a1d27' }} />
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          {[100, 80, 90].map((w, i) => (
            <div key={i} className="animate-pulse" style={{ width: `${w}px`, height: '14px', borderRadius: '4px', background: '#1a1d27' }} />
          ))}
        </div>
      </nav>

      {/* Hero section */}
      <div style={{ padding: '80px 32px', textAlign: 'center' }}>
        <div className="animate-pulse" style={{ width: '480px', maxWidth: '100%', height: '36px', borderRadius: '8px', background: '#1a1d27', margin: '0 auto 16px' }} />
        <div className="animate-pulse" style={{ width: '320px', maxWidth: '100%', height: '16px', borderRadius: '4px', background: '#1a1d27', margin: '0 auto 40px' }} />
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <div className="animate-pulse" style={{ width: '140px', height: '44px', borderRadius: '8px', background: '#1a1d27' }} />
          <div className="animate-pulse" style={{ width: '140px', height: '44px', borderRadius: '8px', background: '#22252f' }} />
        </div>
      </div>

      {/* Feature cards grid */}
      <div style={{ padding: '0 32px 80px', maxWidth: '1024px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                height: '180px',
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
