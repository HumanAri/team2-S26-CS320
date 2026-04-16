import { useEffect, useState } from 'react'
import { Mail, Search, UserPlus, X } from 'lucide-react'

export default function AddFriendModal({ open = false, onClose }) {
  const [email, setEmail] = useState('')

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

  function handleClose() {
    setEmail('')
    onClose?.()
  }

  if (!open) return null

  return (
    <div
      className="add-friend-modal-backdrop"
      role="presentation"
      onClick={handleClose}
    >
      <section
        className="add-friend-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-friend-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="add-friend-modal-header">
          <div>
            <p className="add-friend-modal-kicker">Friends</p>
            <h2 id="add-friend-modal-title" className="add-friend-modal-title">Add Friend</h2>
            <p className="add-friend-modal-subtitle">Search for friends by email.</p>
          </div>
          <button
            type="button"
            className="add-friend-modal-close"
            onClick={handleClose}
            aria-label="Close add friend modal"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="add-friend-modal-search">
          <label className="add-friend-modal-field">
            <span className="add-friend-modal-label">Friend Email</span>
            <div className="add-friend-modal-input-wrap">
              <Mail size={16} aria-hidden="true" className="add-friend-modal-leading-icon" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="friend@example.com"
                className="add-friend-modal-input"
              />
            </div>
          </label>
          <button type="button" className="add-friend-modal-search-button">
            <Search size={16} aria-hidden="true" />
            <span>Search</span>
          </button>
        </div>

        <div className="add-friend-modal-results" aria-live="polite">
          <div className="add-friend-modal-empty-icon" aria-hidden="true">
            <UserPlus size={22} />
          </div>
          <div>
            <p className="add-friend-modal-results-title">Search results will appear here.</p>
            <p className="add-friend-modal-results-copy">Enter an email above when friend search is connected.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
