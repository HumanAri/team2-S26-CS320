import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OnboardingLayout from '../../components/OnboardingLayout'
import { useOnboarding } from '../../context/OnboardingContext'

const TOGGLES = [
  { key: 'share_goals',   label: 'Share goals with friends',   desc: 'Friends can see the tasks you set for yourself' },
  { key: 'share_results', label: 'Share results with friends', desc: 'Friends can see your completed tasks and progress' },
  { key: 'share_wrapped',   label: 'Wrapped Only',                      desc: 'Share wrapped with friends' },
  { key: 'share_all',     label: 'Share all',                  desc: 'Turn everything on at once' },
]

export default function Step5Privacy() {
  const navigate = useNavigate()
  const { data, update } = useOnboarding()
  const [privacy, setPrivacy] = useState(data.privacy)

  const toggle = (key) => {
    if (key === 'share_all') {
      const next = !privacy.share_all
      setPrivacy({ share_goals: next, share_results: next, share_wrapped: next, share_all: next })
    } else {
      const next = { ...privacy, [key]: !privacy[key] }
      next.share_all = next.share_goals && next.share_results && next.share_wrapped
      setPrivacy(next)
    }
  }

  const handleDone = async () => {
    //Changed handleDone to update the DB with the new semester, categories, friendships, etc.
    update('privacy', privacy)

    const token = localStorage.getItem('token')
    const semester_id = localStorage.getItem('semester_id')
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }

    const priorities = data.priority.map((name, idx) => {
      const category = data.categories.find(c => c.name === name)
      return {name: category.name, color: category.color, priority: idx + 1}
    })

    const promise_array = [
      fetch('http://localhost:8000/api/users/pfp', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ pfp: data.emoji })
      }),
      fetch('http://localhost:8000/api/categories', {
        method: 'POST',
        headers,
        body: JSON.stringify({ categories: priorities, semester_id })
      }),
      fetch('http://localhost:8000/api/users/privacy', {
        method: 'PATCH',
        headers,
        body: JSON.stringify(privacy)
      }),
    ]

    //IF the user wants to add friends immediately:
    if (data.friends && data.friends.length > 0){
        promise_array.push(
            fetch('http://localhost:8000/api/friends/requests', {
                method: 'POST',
                headers,
                body: JSON.stringify({ friends: data.friends.map(f => f.email) })
            }),
        )
    }

    await Promise.all(promise_array)
    navigate('/home')
  }

  const handleSkip = () => navigate('/home')

  return (
    <OnboardingLayout
      step={5}
      title="Privacy settings"
      backPath="/onboarding/4"
      onNext={handleDone}
      nextLabel="Done 🎉"
    >
      <button className="skip-btn" onClick={handleSkip}>Skip</button>

      <p className="ob-subtitle">All off by default — turn on what you're comfortable sharing.</p>

      <div className="privacy-list">
        {TOGGLES.map(({ key, label, desc }) => (
          <div key={key} className={`privacy-row ${key === 'share_all' ? 'share-all-row' : ''}`}>
            <div className="privacy-text">
              <span className="privacy-label">{label}</span>
              <span className="privacy-desc">{desc}</span>
            </div>
            <button
              className={`toggle-switch ${privacy[key] ? 'on' : ''}`}
              onClick={() => toggle(key)}
              aria-label={label}
            >
              <span className="toggle-thumb" />
            </button>
          </div>
        ))}
      </div>
    </OnboardingLayout>
  )
}
