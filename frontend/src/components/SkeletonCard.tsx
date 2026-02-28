interface SkeletonCardProps {
  lines?: number;
  height?: string;
}

export function SkeletonCard({ lines = 3, height = '120px' }: SkeletonCardProps) {
  return (
    <div className="card" style={{ minHeight: height }}>
      <div className="skeleton-pulse" style={{ height: '1.2rem', width: '60%', borderRadius: '4px', marginBottom: '0.75rem' }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton-pulse"
          style={{
            height: '0.85rem',
            width: i === lines - 1 ? '45%' : '100%',
            borderRadius: '4px',
            marginBottom: '0.5rem',
          }}
        />
      ))}
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
      <div className="skeleton-pulse" style={{ width: '2rem', height: '2rem', borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton-pulse" style={{ height: '0.85rem', width: '50%', borderRadius: '4px', marginBottom: '0.4rem' }} />
        <div className="skeleton-pulse" style={{ height: '0.75rem', width: '30%', borderRadius: '4px' }} />
      </div>
    </div>
  );
}
