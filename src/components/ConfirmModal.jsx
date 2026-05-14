// ── ConfirmModal.jsx ──────────────────────────────────────────────────────────
// Reusable animated confirm/alert modal. Replaces window.confirm and window.alert.
// Usage:
//   <ConfirmModal
//     isOpen={modalOpen}
//     icon="⏹"
//     iconColor="#ef4444"
//     title="Stop Charging?"
//     message="No refund will be issued for the remaining session time."
//     confirmLabel="Yes, Stop"
//     confirmColor="#ef4444"
//     cancelLabel="Cancel"
//     onConfirm={() => { ... }}
//     onCancel={() => setModalOpen(false)}
//   />

import { useEffect } from 'react'

export default function ConfirmModal({
  isOpen,
  icon,
  iconColor,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmColor = 'var(--accent)',
  cancelLabel  = 'Cancel',
  onConfirm,
  onCancel,
  // If true, only shows a single "OK" button (no cancel)
  alertOnly = false,
}) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onCancel?.() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    // Backdrop
    <div style={S.backdrop} onClick={onCancel}>
      {/* Modal card — stop propagation so clicking inside doesn't close */}
      <div style={S.modal} onClick={e => e.stopPropagation()}>

        {/* Icon circle */}
        {icon && (
          <div style={{
            ...S.iconCircle,
            backgroundColor: iconColor
              ? `${iconColor}22`
              : 'var(--accent-glow)',
            border: `1.5px solid ${iconColor || 'var(--accent)'}33`,
          }}>
            <span style={{ fontSize: '1.5rem' }}>{icon}</span>
          </div>
        )}

        {/* Title */}
        <h2 style={S.title}>{title}</h2>

        {/* Message */}
        {message && <p style={S.message}>{message}</p>}

        {/* Buttons */}
        <div style={S.btnRow}>
          {!alertOnly && (
            <button style={S.cancelBtn} onClick={onCancel}>
              {cancelLabel}
            </button>
          )}
          <button
            style={{
              ...S.confirmBtn,
              backgroundColor: confirmColor,
              color: confirmColor === 'var(--accent)' ? '#000' : '#fff',
              flex: alertOnly ? 1 : undefined,
            }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>

      </div>
    </div>
  )
}

const S = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.15s ease',
  },
  modal: {
    backgroundColor: 'var(--bg-panel)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '32px 28px 24px',
    width: '100%',
    maxWidth: '380px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    animation: 'slideUp 0.2s ease',
  },
  iconCircle: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '4px',
  },
  title: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    textAlign: 'center',
  },
  message: {
    margin: 0,
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    lineHeight: 1.6,
  },
  btnRow: {
    display: 'flex',
    gap: '10px',
    width: '100%',
    marginTop: '8px',
  },
  cancelBtn: {
    flex: 1,
    padding: '11px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  confirmBtn: {
    flex: 1,
    padding: '11px',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
}