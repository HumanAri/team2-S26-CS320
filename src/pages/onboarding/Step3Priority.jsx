import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OnboardingLayout from '../../components/OnboardingLayout'
import { useOnboarding } from '../../context/OnboardingContext'

export default function Step3Priority() {
  const navigate = useNavigate()
  const { data, update } = useOnboarding()
  const [items, setItems] = useState(
    data.priority.length ? data.priority : data.categories.map(c => c.name)
  )
  const [dragIndex, setDragIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  const getCategoryColor = (name) =>
    data.categories.find(c => c.name === name)?.color ?? '#aaa'

  const handleDragStart = (i) => setDragIndex(i)

  const handleDragOver = (e, i) => {
    e.preventDefault()
    setDragOverIndex(i)
  }

  const handleDrop = (i) => {
    if (dragIndex === null || dragIndex === i) return
    const next = [...items]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(i, 0, moved)
    setItems(next)
    setDragIndex(null)
    setDragOverIndex(null)
  }

  const handleNext = () => {
    update('priority', items)
    navigate('/onboarding/4')
  }

  return (
    <OnboardingLayout step={3} title="Set your priorities" backPath="/onboarding/2"
      onNext={handleNext}>
      <p className="ob-subtitle">Drag and drop your categories in order of importance — top is highest priority.</p>

      <div className="drag-list">
        {items.map((name, i) => (
          <div
            key={name}
            className={`drag-item ${dragOverIndex === i ? 'drag-over' : ''}`}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={() => handleDrop(i)}
            onDragEnd={() => { setDragIndex(null); setDragOverIndex(null) }}
          >
            <span className="drag-handle">⠿</span>
            <span className="drag-rank">#{i + 1}</span>
            <span className="drag-dot" style={{ background: getCategoryColor(name) }} />
            <span className="drag-name">{name}</span>
          </div>
        ))}
      </div>

    </OnboardingLayout>
  )
}
