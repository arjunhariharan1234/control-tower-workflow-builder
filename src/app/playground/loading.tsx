export default function PlaygroundLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f1117' }}>
      {/* Toolbar */}
      <div
        style={{
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '0 16px',
          borderBottom: '1px solid #1a1d27',
          background: '#13151d',
        }}
      >
        {[32, 32, 32, 1, 80, 80, 1, 32, 32].map((w, i) =>
          w === 1 ? (
            <div key={i} style={{ width: '1px', height: '24px', background: '#2a2d3a', margin: '0 4px' }} />
          ) : (
            <div
              key={i}
              className="animate-pulse"
              style={{
                width: `${w}px`,
                height: '28px',
                borderRadius: '6px',
                background: '#1a1d27',
              }}
            />
          )
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Node library sidebar */}
        <div
          style={{
            width: '240px',
            borderRight: '1px solid #1a1d27',
            padding: '16px',
            background: '#13151d',
          }}
        >
          <div className="animate-pulse" style={{ width: '100%', height: '36px', borderRadius: '8px', background: '#1a1d27', marginBottom: '16px' }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                height: '32px',
                borderRadius: '8px',
                background: '#1a1d27',
                marginBottom: '8px',
              }}
            />
          ))}
        </div>

        {/* Canvas area */}
        <div
          style={{
            flex: 1,
            backgroundImage: 'radial-gradient(circle, #2a2d3a 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Bottom panel bar */}
      <div
        style={{
          height: '36px',
          borderTop: '1px solid #1a1d27',
          background: '#13151d',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
        }}
      >
        <div className="animate-pulse" style={{ width: '80px', height: '14px', borderRadius: '4px', background: '#1a1d27' }} />
      </div>
    </div>
  );
}
