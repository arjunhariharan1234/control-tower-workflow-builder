import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f1117',
        padding: '24px',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1
          style={{
            fontSize: '96px',
            fontWeight: 700,
            color: '#FFBE07',
            margin: '0 0 8px',
            lineHeight: 1,
          }}
        >
          404
        </h1>
        <p
          style={{
            fontSize: '18px',
            color: '#f0f0f5',
            margin: '0 0 8px',
            fontWeight: 500,
          }}
        >
          This page doesn&apos;t exist
        </p>
        <p
          style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: '0 0 32px',
          }}
        >
          The page you&apos;re looking for may have been moved or removed.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: 500,
            borderRadius: '8px',
            background: '#FFBE07',
            color: '#000',
            textDecoration: 'none',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Control Tower
        </Link>
      </div>
    </div>
  );
}
