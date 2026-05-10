import { useEffect, useState } from 'react'
import { Check, Mail, Search, UserPlus, X } from 'lucide-react'

export default function AddFriendModal({ open = false, onClose }) {
  const [email, setEmail] = useState('')
  const [result, setResult] = useState(null)    // stores the found user after searching
  const [error, setError] = useState('')         // stores error message if search fails
  const [loading, setLoading] = useState(false)  // true while waiting for search results
  const [sent, setSent] = useState(false)        // true after friend request is sent

  // close the modal when the user presses Escape
  useEffect(() => {
    if (!open) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  // prevent the page behind the modal from scrolling
  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  // reset everything when the modal is closed
  function handleClose() {
    setEmail('')
    setResult(null)
    setError('')
    setSent(false)
    onClose?.()
  }

  // look up a user by email in the backend
  async function handleSearch() {
    if (!email.trim()) return

    setLoading(true)
    setResult(null)
    setError('')
    setSent(false)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(
        `http://localhost:8000/api/users/search?email=${encodeURIComponent(email.trim())}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      // can't add yourself as a friend
      if (res.status === 400) {
        setError("You can't add yourself as a friend")
        return
      }
      

      // no user found with that email
      if (res.status === 404) {
        setError('No user found with that email')
        return
      }

      if (!res.ok) {
        setError('Something went wrong, try again')
        return
      }

      // save the found user so we can display them
      const data = await res.json()
      setResult(data)
    } catch {
      setError('Could not reach server')
    } finally {
      setLoading(false)
    }
  }

  // send a friend request to the user we found
  async function handleSendRequest() {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:8000/api/friends/requests', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ friends: [result.email] }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.pending?.includes(result.email)) {
          setResult((prev) => ({ ...prev, friendship_status: 0 }))
        } else {
          setSent(true)
        }
      } else {
        setError('Failed to send friend request')
      }
    } catch {
      setError('Could not reach server')
    }
  }

  // don't render anything if the modal isn't open
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
        {/* modal header with title and close button */}
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

        {/* email input and search button */}
        <div className="add-friend-modal-search">
          <label className="add-friend-modal-field">
            <span className="add-friend-modal-label">Friend Email</span>
            <div className="add-friend-modal-input-wrap">
              <Mail size={16} aria-hidden="true" className="add-friend-modal-leading-icon" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter') handleSearch() }}
                placeholder="friend@umass.edu"
                className="add-friend-modal-input"
              />
            </div>
          </label>
          <button
            type="button"
            className="add-friend-modal-search-button"
            onClick={handleSearch}
            disabled={loading}
          >
            <Search size={16} aria-hidden="true" />
            <span>{loading ? 'Searching...' : 'Search'}</span>
          </button>
        </div>

        <div className="add-friend-modal-results" aria-live="polite">
          {/* Default state */}
          {!result && !error && (
            <>
              <div className="add-friend-modal-empty-icon" aria-hidden="true">
                <UserPlus size={22} />
              </div>
              <div>
                <p className="add-friend-modal-results-title">Search results will appear here.</p>
                <p className="add-friend-modal-results-copy">Enter an email above to find a friend.</p>
              </div>
            </>
          )}

          {/* User not found or error */}
          {error && (
            <>
              <div className="add-friend-modal-empty-icon" aria-hidden="true">
                <X size={22} />
              </div>
              <div>
                <p className="add-friend-modal-results-title">{error}</p>
                <p className="add-friend-modal-results-copy">Check the email and try again.</p>
              </div>
            </>
          )}

          {/* User found */}
          {result && !error && (
            <div className="add-friend-modal-found">
              <div className="add-friend-modal-found-info">
                {result.profile_picture && (
                  <span className="add-friend-modal-found-avatar">{result.profile_picture}</span>
                )}
                <div>
                  <p className="add-friend-modal-results-title">
                    {result.display_name || result.email}
                  </p>
                  <p className="add-friend-modal-results-copy">{result.email}</p>
                </div>
              </div>
              
              {/* already friends */}
              {result.friendship_status === 1 && (
                <span className="add-friend-modal-sent">
                  <Check size={16} /> Already friends
                </span>
              )}

              {/* request already pending */}
              {result.friendship_status === 0 && (
                <span className="add-friend-modal-sent">
                  <Check size={16} /> Request pending
                </span>
              )}

              {/* no existing relationship — show send button or sent confirmation */}
              {(result.friendship_status === null || result.friendship_status === undefined) && (
                sent ? (
                  <span className="add-friend-modal-sent">
                    <Check size={16} /> Request sent!
                  </span>
                ) : (
                  <button
                    type="button"
                    className="add-friend-modal-send-button"
                    onClick={handleSendRequest}
                  >
                    <UserPlus size={16} />
                    <span>Send Request</span>
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
