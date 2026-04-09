import { useNavigate } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import Brand from './Brand'

const STEP_LABELS = ['Profile', 'Categories', 'Priority', 'Friends', 'Privacy']
const TOTAL = STEP_LABELS.length - 1  // 4 gaps between 5 steps

const getGiraffeStyle = (step) => {
  if (step === 1) return { left: '0%',   transform: 'translateX(0)' }
  if (step === 5) return { left: '100%', transform: 'translateX(-100%)' }
  return { left: `${((step - 1) / TOTAL) * 100}%`, transform: 'translateX(-50%)' }
}

export default function OnboardingLayout({
  step, title, backPath,
  onNext, nextLabel = 'Next →', nextDisabled = false,
  children
}) {
  const navigate = useNavigate()
  const fillWidth = step === 1 ? '0%' : `${((step - 1) / TOTAL) * 100}%`

  return (
    <div className="onboarding-wrapper">
      <Brand />
      <ThemeToggle />
      <div className="onboarding-card">

        <h2 className="onboarding-title">{title}</h2>

        {children}

        {/* Back / Next row */}
        <div className="ob-nav-row">
          {backPath
            ? <button className="ob-back-btn" onClick={() => navigate(backPath)}>← Back</button>
            : <span />
          }
          <button className="ob-next-btn" onClick={onNext} disabled={nextDisabled}>
            {nextLabel}
          </button>
        </div>

        {/* Progress bar */}
        <div className="progress-section">
          <div className="giraffe-track">
            <div className="giraffe-fill" style={{ width: fillWidth }} />
            <div className="giraffe-emoji" style={getGiraffeStyle(step)}>🦒</div>
            <div className="step-dots">
              {STEP_LABELS.map((_, i) => (
                <div key={i} className={`step-dot ${i < step ? 'done' : ''}`} />
              ))}
            </div>
          </div>
          <div className="step-labels">
            {STEP_LABELS.map((label, i) => (
              <span key={i} className={`step-label ${i + 1 === step ? 'active' : ''}`}>
                {label}
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
