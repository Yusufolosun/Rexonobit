import { useToast } from '../context/ToastContext';
import { getNetwork } from '../lib/network';

const TYPE_COLOR: Record<string, string> = {
  success: 'var(--color-success)',
  error:   'var(--color-error)',
  warning: 'var(--color-warning)',
  info:    'var(--color-accent)',
};

const TYPE_ICON: Record<string, string> = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();
  const network = getNetwork().isMainnet() ? 'mainnet' : 'testnet';

  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxWidth: '360px',
        width: '100%',
      }}
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          role="alert"
          style={{
            background: 'var(--color-surface)',
            border: `1px solid ${TYPE_COLOR[toast.type]}`,
            borderRadius: 'var(--radius)',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.6rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            animation: 'fadeInUp 0.2s ease-out',
          }}
        >
          <span style={{ color: TYPE_COLOR[toast.type], fontWeight: 700, fontSize: '1rem', lineHeight: 1.4, flexShrink: 0 }}>
            {TYPE_ICON[toast.type]}
          </span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text)', lineHeight: 1.4 }}>{toast.message}</p>
            {toast.txId && (
              <a
                href={`https://explorer.stacks.co/txid/${toast.txId}?chain=${network}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '0.75rem', color: TYPE_COLOR[toast.type], display: 'block', marginTop: '0.25rem' }}
              >
                View on Explorer →
              </a>
            )}
          </div>
          <button
            aria-label="Dismiss notification"
            onClick={() => removeToast(toast.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              fontSize: '1rem',
              lineHeight: 1,
              padding: '0',
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
