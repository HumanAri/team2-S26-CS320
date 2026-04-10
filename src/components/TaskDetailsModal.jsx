import { useEffect } from 'react'
import { Check, Tag, Trash2, X } from 'lucide-react'

export default function TaskDetailsModal({ open = false, task, onClose, onDelete, onMarkDone }) {
  const categoryLabel = typeof task?.category === 'object'
    ? task.category?.name
    : task?.category

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

  if (!open || !task) return null

  return (
    <div
      className="task-details-modal-backdrop"
      role="presentation"
      onClick={() => onClose?.()}
    >
      <section
        className="task-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-details-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="task-details-modal-header">
          <div>
            <p className="task-details-modal-kicker">Task</p>
            <h2 id="task-details-modal-title" className="task-details-modal-title">{task.name}</h2>
          </div>
          <button
            type="button"
            className="task-details-modal-close"
            onClick={() => onClose?.()}
            aria-label="Close task details modal"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="task-details-modal-card">
          <span className="task-details-modal-label">Category</span>
          <div className="task-details-modal-category">
            <Tag size={16} aria-hidden="true" />
            <span>{categoryLabel || 'Uncategorized'}</span>
          </div>
        </div>

        <div className="task-details-modal-actions">
          <button
            type="button"
            className="task-details-modal-action task-details-modal-action-delete"
            onClick={() => onDelete?.(task)}
          >
            <Trash2 size={16} aria-hidden="true" />
            <span>Delete</span>
          </button>
          <button
            type="button"
            className="task-details-modal-action task-details-modal-action-done"
            onClick={() => onMarkDone?.(task)}
            disabled={Boolean(task.completed)}
          >
            <Check size={16} aria-hidden="true" />
            <span>{task.completed ? 'Completed' : 'Mark Done'}</span>
          </button>
        </div>
      </section>
    </div>
  )
}
