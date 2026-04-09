import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OnboardingLayout from '../../components/OnboardingLayout'
import { useOnboarding } from '../../context/OnboardingContext'

const TOGGLES = [
  { key: 'share_goals',   label: 'Share goals with friends',   desc: 'Friends can see the tasks you set for yourself' },
  { key: 'share_results', label: 'Share results with friends', desc: 'Friends can see your completed tasks and progress' },
  { key: 'share_other',   label: 'Other',                      desc: 'Share miscellaneous activity with friends' },
  { key: 'share_all',     label: 'Share all',                  desc: 'Turn everything on at once' },
]

export default function Step5Privacy() {
  const navigate = useNavigate()
  const { data, update } = useOnboarding()
  const [privacy, setPrivacy] = useState(data.privacy)

  const toggle = (key) => {
    if (key === 'share_all') {
      const next = !privacy.share_all
      setPrivacy({ share_goals: next, share_results: next, share_other: next, share_all: next })
    } else {
      const next = { ...privacy, [key]: !privacy[key] }
      next.share_all = next.share_goals && next.share_results && next.share_other
      setPrivacy(next)
    }
  }

  const handleDone = () => {
    update('privacy', privacy)
    // TODO: send full onboarding payload to backend, then navigate to dashboard
    navigate('/')
  }

  const handleSkip = () => navigate('/')

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
