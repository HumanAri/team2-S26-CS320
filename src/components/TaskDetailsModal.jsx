import { useEffect } from 'react'
import { Check, Tag, Trash2, X } from 'lucide-react'

export default function TaskDetailsModal({ open = false, task, occurrence = null, categories, onClose, onDelete, onMarkDone }) {

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

  const category = task.my_category(categories)
  const isComplete = occurrence ? occurrence.status === 'complete' : Boolean(task.completed)
  const isRecurring = (task.recurrence_occurrences || []).length > 0

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
            <h2 id="task-details-modal-title" className="task-details-modal-title">{task.title}</h2>
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
            <span>{category?.name || 'Uncategorized'}</span>
          </div>
        </div>

        <div className="task-details-modal-actions">
          <button
            type="button"
            className="task-details-modal-action task-details-modal-action-delete"
            onClick={() => onDelete?.(task, occurrence)}
          >
            <Trash2 size={16} aria-hidden="true" />
            <span>{occurrence ? 'Delete Occurrence' : 'Delete'}</span>
          </button>
          <button
            type="button"
            className="task-details-modal-action task-details-modal-action-done"
            onClick={() => onMarkDone?.(task, occurrence)}
            disabled={isComplete}
          >
            <Check size={16} aria-hidden="true" />
            <span>{isComplete ? 'Completed' : 'Mark Done'}</span>
          </button>
          {isRecurring && (
            <button
              type="button"
              className="task-details-modal-action task-details-modal-action-delete-series"
              onClick={() => onDelete?.(task, null)}
            >
              <Trash2 size={16} aria-hidden="true" />
              <span>Delete Series</span>
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
