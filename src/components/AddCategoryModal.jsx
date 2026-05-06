import { useEffect, useMemo, useState } from 'react'
import { Palette, Tag, X } from 'lucide-react'

const CATEGORY_COLORS = [
  { label: 'Rose Blush', value: '#ffd6de' },
  { label: 'Petal Pink', value: '#ffd7e8' },
  { label: 'Soft Mauve', value: '#edd7f7' },
  { label: 'Lilac Mist', value: '#e2dbff' },
  { label: 'Periwinkle', value: '#d9e1ff' },
  { label: 'Powder Blue', value: '#d7e9ff' },
  { label: 'Sky Wash', value: '#d7f1ff' },
  { label: 'Sea Glass', value: '#d5f5f1' },
  { label: 'Mint Leaf', value: '#d4f2df' },
  { label: 'Sage Glow', value: '#ddefd2' },

  { label: 'Peony', value: '#ffc9d6' },
  { label: 'Bubblegum', value: '#ffcce6' },
  { label: 'Lavender Bloom', value: '#e5cdf7' },
  { label: 'Wisteria', value: '#d9d1ff' },
  { label: 'Bluebell', value: '#cfdbff' },
  { label: 'Coastal', value: '#cbe7ff' },
  { label: 'Robin Egg', value: '#c8f0ff' },
  { label: 'Cool Aqua', value: '#c5efe9' },
  { label: 'Mint Cream', value: '#c9efd3' },
  { label: 'Spring Moss', value: '#d4eabd' },

  { label: 'Watermelon', value: '#ffbecd' },
  { label: 'Cotton Candy', value: '#ffc0df' },
  { label: 'Orchid', value: '#dcc2f5' },
  { label: 'Iris', value: '#cec8ff' },
  { label: 'Cornflower', value: '#c3d4ff' },
  { label: 'Rain', value: '#bfdfff' },
  { label: 'Ice Blue', value: '#bcf0ff' },
  { label: 'Aquamarine', value: '#b9ece3' },
  { label: 'Clover', value: '#bde7ca' },
  { label: 'Pear', value: '#cee3a7' },

  { label: 'Coral Bloom', value: '#ffb4c4' },
  { label: 'Flamingo', value: '#ffb7d8' },
  { label: 'Amethyst Haze', value: '#d4b8ef' },
  { label: 'Violet Mist', value: '#c4bfff' },
  { label: 'Hydrangea', value: '#b8cdff' },
  { label: 'Lagoon', value: '#b3dbff' },
  { label: 'Glacier', value: '#afe9ff' },
  { label: 'Jade Tint', value: '#afe7da' },
  { label: 'Pistachio', value: '#b5e0bf' },
  { label: 'Citrus Leaf', value: '#c4db98' },
]

const PRIORITY_OPTIONS = [
  { label: 'High', value: 1 },
  { label: 'Medium', value: 2 },
  { label: 'Low', value: 3 },
]

export default function AddCategoryModal({ open = false, onClose, onAddCategory }) {
  const [categoryName, setCategoryName] = useState('')
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0].value)
  const [priority, setPriority] = useState(2)
  const isSubmitDisabled = useMemo(() => !categoryName.trim(), [categoryName])

  useEffect(() => {
    if (!open) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  function resetForm() {
    setCategoryName('')
    setSelectedColor(CATEGORY_COLORS[0].value)
  }

  function handleClose() {
    resetForm()
    onClose?.()
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (isSubmitDisabled) return

    onAddCategory?.({
      id: `cat-${Date.now()}`,
      name: categoryName.trim(),
      color: selectedColor,
      priority,
    })

    resetForm()
    onClose?.()
  }

  if (!open) return null

  return (
    <div
      className="add-category-modal-backdrop"
      role="presentation"
      onClick={handleClose}
    >
      <section
        className="add-category-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-category-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="add-category-modal-header">
          <div>
            <p className="add-category-modal-kicker">Planner</p>
            <h2 id="add-category-modal-title" className="add-category-modal-title">Add New Category</h2>
            <p className="add-category-modal-subtitle">Create a category with a color that is easy to spot across the planner.</p>
          </div>
          <button
            type="button"
            className="add-category-modal-close"
            onClick={handleClose}
            aria-label="Close add category modal"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form className="add-category-modal-form" onSubmit={handleSubmit}>
          <label className="add-category-modal-field">
            <span className="add-category-modal-label">Category Name</span>
            <div className="add-category-modal-input-wrap">
              <Tag size={16} aria-hidden="true" className="add-category-modal-leading-icon" />
              <input
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                placeholder="Reading, Chores, Design, or Commute"
                className="add-category-modal-input add-category-modal-input-has-icon"
              />
            </div>
          </label>

          <div className="add-category-modal-field">
            <span className="add-category-modal-label">Choose Color</span>
            <div className="add-category-modal-colors-header">
              <div className="add-category-modal-colors-header-copy">
                <Palette size={16} aria-hidden="true" />
                <span>Soft tones arranged by hue</span>
              </div>
              <div className="add-category-modal-selection">
                <span
                  className="add-category-modal-selection-swatch"
                  style={{ backgroundColor: selectedColor }}
                  aria-hidden="true"
                />
                <span>
                  {CATEGORY_COLORS.find((color) => color.value === selectedColor)?.label || 'Selected color'}
                </span>
              </div>
            </div>

            <div className="add-category-modal-colors-grid">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`add-category-modal-color-button${selectedColor === color.value ? ' is-selected' : ''}`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setSelectedColor(color.value)}
                  aria-label={`Select ${color.label}`}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <div className="add-category-modal-field">
  <span className="add-category-modal-label">Priority</span>

            <div className="add-category-modal-priority-row">
              {PRIORITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`add-task-modal-priority-button${priority === option.value ? ' is-selected' : ''}`}
                  onClick={() => setPriority(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="add-category-modal-actions">
            <button
              type="button"
              className="add-category-modal-action add-category-modal-action-secondary"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="add-category-modal-action add-category-modal-action-primary"
              disabled={isSubmitDisabled}
            >
              Add Category
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
