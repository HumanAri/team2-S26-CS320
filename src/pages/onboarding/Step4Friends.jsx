import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OnboardingLayout from '../../components/OnboardingLayout'
import { useOnboarding } from '../../context/OnboardingContext'

export default function Step4Friends() {
  const navigate = useNavigate()
  const { data, update } = useOnboarding()
  const [friends, setFriends] = useState(data.friends || [])
  const [input, setInput] = useState('')

  const addFriend = () => {
    const val = input.trim()
    if (!val || friends.includes(val)) return
    setFriends(prev => [...prev, val])
    setInput('')
  }

  const removeFriend = (f) => setFriends(prev => prev.filter(x => x !== f))

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

      <div className="category-input-row">
        <input
          type="text"
          className="ob-input"
          placeholder="Username or email..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addFriend()}
        />
        <button className="ob-add-btn" onClick={addFriend}>Add</button>
      </div>

      <div className="friends-list">
        {friends.map(f => (
          <div key={f} className="friend-row">
            <span className="friend-avatar">{f[0].toUpperCase()}</span>
            <span className="friend-name">{f}</span>
            <button className="chip-remove" onClick={() => removeFriend(f)}>×</button>
          </div>
        ))}
      </div>

    </OnboardingLayout>
  )
}
