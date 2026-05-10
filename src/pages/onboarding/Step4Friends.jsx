import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OnboardingLayout from '../../components/OnboardingLayout'
import { useOnboarding } from '../../context/OnboardingContext'

export default function Step4Friends() {
  const navigate = useNavigate()
  const { data, update } = useOnboarding()
  const [friends, setFriends] = useState(data.friends || [])
  const [input, setInput] = useState('')
  const [searchResult, setSearchResult] = useState(null)  // stores the found user
  const [error, setError] = useState('')                   // stores error message
  const [loading, setLoading] = useState(false)            // true while searching

  // look up a user by email in the backend
  const handleSearch = async () => {
    const val = input.trim()
    if (!val) return

    setLoading(true)
    setSearchResult(null)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(
        `http://localhost:8000/api/users/search?email=${encodeURIComponent(val)}`,
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
      setSearchResult(data)
    } catch {
      setError('Could not reach server')
    } finally {
      setLoading(false)
    }
  }

  // add the found user to the friends list
  const addFriend = () => {
    if (!searchResult) return
    const email = searchResult.email

    // don't add duplicates
    if (friends.some(f => f.email === email)) return

    setFriends(prev => [...prev, {
      email: searchResult.email,
      display_name: searchResult.display_name,
      profile_picture: searchResult.profile_picture,
    }])

    // reset the search
    setInput('')
    setSearchResult(null)
    setError('')
  }

  // remove a friend from the list
  const removeFriend = (email) => setFriends(prev => prev.filter(f => f.email !== email))

  // save the friends list and move to the next step
  const handleDone = () => {
    update('friends', friends)
    navigate('/onboarding/5')
  }

  const handleSkip = () => navigate('/onboarding/5')

  return (
    <OnboardingLayout step={4} title="Add friends" backPath="/onboarding/3"
      onNext={handleDone} nextLabel={friends.length > 0 ? 'Done 🎉' : 'Continue without friends'}>
      <button className="skip-btn" onClick={handleSkip}>Skip</button>

      <p className="ob-subtitle">Find teammates or friends to collaborate with on Taskify.</p>

      {/* search input and button */}
      <div className="category-input-row">
        <input
          type="text"
          className="ob-input"
          placeholder="Search by email (e.g. friend@umass.edu)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <button className="ob-add-btn" onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* error message when user is not found */}
      {error && (
        <p className="ob-error" style={{ color: '#e74c3c', fontSize: '0.9rem', marginTop: '0.5rem' }}>
          {error}
        </p>
      )}

      {/* search result — shows the found user with an Add button */}
      {searchResult && !error && (
        <div className="friend-row" style={{ marginTop: '0.5rem', background: '#f2f6fa', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
          <span className="friend-avatar">
            {searchResult.profile_picture || searchResult.email[0].toUpperCase()}
          </span>
          <span className="friend-name">
            {searchResult.display_name || searchResult.email}
          </span>
          <button className="ob-add-btn" onClick={addFriend}>Add</button>
        </div>
      )}

      {/* list of friends the user has added so far */}
      <div className="friends-list">
        {friends.map(f => (
          <div key={f.email} className="friend-row">
            <span className="friend-avatar">
              {f.profile_picture || f.email[0].toUpperCase()}
            </span>
            <span className="friend-name">{f.display_name || f.email}</span>
            <button className="chip-remove" onClick={() => removeFriend(f.email)}>×</button>
          </div>
        ))}
      </div>

    </OnboardingLayout>
  )
}
