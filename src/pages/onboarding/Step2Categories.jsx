import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OnboardingLayout from '../../components/OnboardingLayout'
import ColorWheel from '../../components/ColorWheel'
import { useOnboarding } from '../../context/OnboardingContext'

const randomHex = () => {
  const hue = Math.floor(Math.random() * 360)
  const s = 65, l = 55, sn = s / 100, ln = l / 100
  const a = sn * Math.min(ln, 1 - ln)
  const f = n => {
    const k = (n + hue / 30) % 12
    const c = ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * c).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

export default function Step2Categories() {
  const navigate = useNavigate()
  const { data, update } = useOnboarding()
  const [categories, setCategories] = useState(data.categories || [])
  const [input, setInput]   = useState('')
  const [color, setColor]   = useState(randomHex)

  const addCategory = () => {
    const name = input.trim()
    if (!name || categories.find(c => c.name.toLowerCase() === name.toLowerCase())) return
    setCategories(prev => [...prev, { name, color }])
    setInput('')
    setColor(randomHex())
  }

  const removeCategory = (name) =>
    setCategories(prev => prev.filter(c => c.name !== name))

  const handleNext = () => {
    if (categories.length === 0) return
    update('categories', categories)
    update('priority', categories.map(c => c.name))
    navigate('/onboarding/3')
  }

  return (
    <OnboardingLayout step={2} title="Add your categories" backPath="/onboarding/1"
      onNext={handleNext} nextDisabled={categories.length === 0}>
      <p className="ob-subtitle">Pick a color from the wheel, then name your category.</p>

      <ColorWheel color={color} onChange={setColor} />

      <div className="category-input-row">
        <div className="chip-dot" style={{ background: color, width: 18, height: 18, flexShrink: 0, borderRadius: '50%' }} />
        <input
          type="text"
          className="ob-input"
          placeholder="e.g. Work, Fitness, Study..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCategory()}
        />
        <button className="ob-add-btn" onClick={addCategory}>Add</button>
      </div>

      <div className="category-chips">
        {categories.map(c => (
          <div key={c.name} className="category-chip" style={{ borderColor: c.color }}>
            <span className="chip-dot" style={{ background: c.color }} />
            <span className="chip-name">{c.name}</span>
            <button className="chip-remove" onClick={() => removeCategory(c.name)}>×</button>
          </div>
        ))}
      </div>

    </OnboardingLayout>
  )
}
