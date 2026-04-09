import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OnboardingLayout from '../../components/OnboardingLayout'
import { useOnboarding } from '../../context/OnboardingContext'

const EMOJIS = [
  '😀','😎','🤩','🥳','😺','🐶','🦊','🐼','🦁','🐨',
  '🦝','🐙','🦋','🌸','⭐','🚀','🎨','🎵','🏆','💎',
  '🌈','🔥','⚡','🌴','🎯'
]

export default function Step1Emoji() {
  const navigate = useNavigate()
  const { data, update } = useOnboarding()
  const [selected, setSelected] = useState(data.emoji || '')

  const handleNext = () => {
    if (!selected) return
    update('emoji', selected)
    navigate('/onboarding/2')
  }

  return (
    <OnboardingLayout step={1} title="Pick your profile emoji" backPath="/signup"
      onNext={handleNext} nextDisabled={!selected}>
      <div className="emoji-grid">
        {EMOJIS.map(e => (
          <button
            key={e}
            className={`emoji-btn ${selected === e ? 'selected' : ''}`}
            onClick={() => setSelected(e)}
            aria-label={e}
          >
            {e}
          </button>
        ))}
      </div>

      {selected && (
        <div className="emoji-preview">
          <span>{selected}</span>
          <p>Your profile emoji</p>
        </div>
      )}

    </OnboardingLayout>
  )
}
