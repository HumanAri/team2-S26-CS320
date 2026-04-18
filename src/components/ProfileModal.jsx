import { useEffect } from 'react'
import { LogOut, Mail, Settings, User, X } from 'lucide-react'

export default function ProfileModal({ open = false, onClose }) {
  useEffect(() => {
    if (!open) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="profile-modal-backdrop"
      role="presentation"
      onClick={() => onClose?.()}
    >
      <section
        className="profile-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="profile-modal-header">
          <div>
            <p className="profile-modal-kicker">Account</p>
            <h2 id="profile-modal-title" className="profile-modal-title">Profile</h2>
          </div>
          <button
            type="button"
            className="profile-modal-close"
            onClick={() => onClose?.()}
            aria-label="Close profile modal"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="profile-modal-user-card">
          <div className="profile-modal-avatar" aria-hidden="true">🙂</div>
          <div className="profile-modal-user-copy">
            <p className="profile-modal-name">Alex Student</p>
            <div className="profile-modal-email">
              <Mail size={15} aria-hidden="true" />
              <span>alex.student@example.com</span>
            </div>
          </div>
        </div>

        <div className="profile-modal-actions" aria-label="Profile actions">
          <button type="button" className="profile-modal-action">
            <User size={17} aria-hidden="true" />
            <span>Profile</span>
          </button>
          <button type="button" className="profile-modal-action">
            <Settings size={17} aria-hidden="true" />
            <span>Settings</span>
          </button>
          <button type="button" className="profile-modal-action profile-modal-action-logout">
            <LogOut size={17} aria-hidden="true" />
            <span>Log Out</span>
          </button>
        </div>
      </section>
    </div>
  )
}
