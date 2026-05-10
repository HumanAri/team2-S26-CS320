import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const DEFAULT_PRIVACY = {
  share_goals: false,
  share_results: false,
  share_other: false,
  share_all: false,
}

const TOGGLES = [
  { key: 'share_goals', label: 'Share goals with friends', desc: 'Friends can see the tasks you set for yourself' },
  { key: 'share_results', label: 'Share results with friends', desc: 'Friends can see your completed tasks and progress' },
  { key: 'share_other', label: 'Other', desc: 'Share miscellaneous activity with friends' },
  { key: 'share_all', label: 'Share all', desc: 'Turn everything on at once' },
]

function getPrivacyFromProfile(profile) {
  return {
    share_goals: Boolean(profile?.share_goals),
    share_results: Boolean(profile?.share_results),
    share_other: Boolean(profile?.share_other),
    share_all: Boolean(profile?.share_all),
  }
}

export default function PrivacySettingsModal({
  open = false,
  onClose,
  profile,
  onSave,
}) {
  const [privacy, setPrivacy] = useState({ ...DEFAULT_PRIVACY, ...getPrivacyFromProfile(profile) })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setPrivacy({ ...DEFAULT_PRIVACY, ...getPrivacyFromProfile(profile) })
      setError('')
      setIsSaving(false)
    }
  }, [profile, open])

  useEffect(() => {
    if (!open) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  if (!open) return null

  const toggle = (key) => {
    if (key === 'share_all') {
      const next = !privacy.share_all
      setPrivacy({
        share_goals: next,
        share_results: next,
        share_other: next,
        share_all: next,
      })
      return
    }

    setPrivacy((currentPrivacy) => {
      const next = { ...currentPrivacy, [key]: !currentPrivacy[key] }
      next.share_all = next.share_goals && next.share_results && next.share_other
      return next
    })
  }

  const handleSave = async () => {
    const token = localStorage.getItem('token')

    if (!token) {
      setError('You need to be logged in to update privacy settings.')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const response = await fetch('http://localhost:8000/api/users/privacy', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(privacy),
      })

      if (!response.ok) {
        let message = 'Could not update privacy settings.'
        try {
          const data = await response.json()
          message = data.detail || message
        } catch {
          // Use the default message if the response body is not JSON.
        }

        setError(message)
        return
      }

      onSave?.(privacy)
      onClose?.()
    } catch {
      setError('Could not connect to server.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="profile-modal-backdrop privacy-settings-backdrop"
      role="presentation"
      onClick={() => onClose?.()}
    >
      <section
        className="profile-modal privacy-settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-settings-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="profile-modal-header">
          <div>
            <p className="profile-modal-kicker">Settings</p>
            <h2 id="privacy-settings-title" className="profile-modal-title">Privacy settings</h2>
          </div>
          <button
            type="button"
            className="profile-modal-close"
            onClick={() => onClose?.()}
            aria-label="Close privacy settings"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <p className="privacy-settings-subtitle">
          All off by default. Turn on what you're comfortable sharing.
        </p>

        <div className="privacy-list">
          {TOGGLES.map(({ key, label, desc }) => (
            <div key={key} className={`privacy-row ${key === 'share_all' ? 'share-all-row' : ''}`}>
              <div className="privacy-text">
                <span className="privacy-label">{label}</span>
                <span className="privacy-desc">{desc}</span>
              </div>
              <button
                type="button"
                className={`toggle-switch ${privacy[key] ? 'on' : ''}`}
                onClick={() => toggle(key)}
                disabled={isSaving}
                aria-pressed={privacy[key]}
                aria-label={label}
              >
                <span className="toggle-thumb" />
              </button>
            </div>
          ))}
        </div>

        {error && <p className="privacy-settings-error" role="alert">{error}</p>}

        <div className="privacy-settings-actions">
          <button
            type="button"
            className="privacy-settings-button"
            onClick={() => onClose?.()}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="privacy-settings-button privacy-settings-button-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Done'}
          </button>
        </div>
      </section>
    </div>
  )
}
