export default function ChatLoading() {
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0f1117' }}>
      {/* Left panel — chat */}
      <div
        style={{
          width: '40%',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #1a1d27',
          padding: '24px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div className="animate-pulse" style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#1a1d27' }} />
          <div className="animate-pulse" style={{ width: '140px', height: '16px', borderRadius: '4px', background: '#1a1d27' }} />
        </div>

        {/* Suggestion cards */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map((i) => (
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

        {/* Chat input */}
        <div
          className="animate-pulse"
          style={{
            height: '48px',
            borderRadius: '12px',
            background: '#1a1d27',
            border: '1px solid #2a2d3a',
            marginTop: '16px',
          }}
        />
      </div>

      {/* Right panel — canvas */}
      <div
        style={{
          flex: 1,
          background: '#0f1117',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage:
            'radial-gradient(circle, #2a2d3a 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div className="animate-pulse" style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#1a1d27', margin: '0 auto 12px' }} />
          <div className="animate-pulse" style={{ width: '120px', height: '12px', borderRadius: '4px', background: '#1a1d27', margin: '0 auto' }} />
        </div>
      </div>
    </div>
  );
}
