import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Clock3, Repeat2, Tag, X } from 'lucide-react'
import { Task, Category } from '../types/task.js'

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatDueDate(value) {
  if (!value) return ''

  const [yearText, monthText, dayText] = value.split('-')
  const year = Number.parseInt(yearText, 10)
  const month = Number.parseInt(monthText, 10)
  const day = Number.parseInt(dayText, 10)

  if ([year, month, day].some((part) => Number.isNaN(part))) return ''
  return `${month}/${day}`
}

function formatClockTime(value) {
  if (!value) return ''

  const [hourText, minuteText] = value.split(':')
  const hour = Number.parseInt(hourText, 10)
  const minute = Number.parseInt(minuteText, 10)

  if (Number.isNaN(hour) || Number.isNaN(minute)) return ''

  const normalizedHour = hour % 12 || 12
  const suffix = hour >= 12 ? 'PM' : 'AM'
  return `${normalizedHour}:${String(minute).padStart(2, '0')} ${suffix}`
}

export default function AddTaskModal({ open = false, onClose, categories = [], onAddTask }) {
  const [taskName, setTaskName] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [selectedDays, setSelectedDays] = useState([])

  const isSubmitDisabled = useMemo(
    () => !taskName.trim() || !category || !date,
    [category, date, taskName]
  )

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
    setTaskName('')
    setCategory('')
    setDate('')
    setStartTime('')
    setEndTime('')
    setSelectedDays([])
  }

  function toggleDay(day) {
    setSelectedDays((currentDays) =>
      currentDays.includes(day)
        ? currentDays.filter((currentDay) => currentDay !== day)
        : [...currentDays, day]
    )
  }

  function handleClose() {
    resetForm()
    onClose?.()
  }

  async function handleSubmit(event) {
      event.preventDefault()
      if (isSubmitDisabled) return

      try {
        const token = localStorage.getItem('token')

        const selectedCategory = categories.find(c => c.name === category)
        if (!selectedCategory) return

        const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
        const recurrenceDayNumbers = selectedDays.map(d => dayMap[d])

        const dueDate = date ? `${date}T23:59:00` : ""
        const startTimestamp = date && startTime ? `${date}T${startTime}:00` : ""
        const endTimestamp = date && endTime ? `${date}T${endTime}:00` : ""

        const res = await fetch('http://localhost:8000/api/tasks', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            category_id: selectedCategory.id,
            title: taskName.trim(),
            description: "",
            due_date: dueDate,
            start_time: startTimestamp,
            end_time: endTimestamp,
            is_recurring: selectedDays.length > 0,
            recurrence_days: recurrenceDayNumbers,
          }),
        })

        if (!res.ok) {
          console.error('Failed to create task')
          return
        }

        window.location.reload()
      } catch {
        console.error('Could not reach server')
      }
    }
      
  if (!open) return null

  return (
    <div
      className="add-task-modal-backdrop"
      role="presentation"
      onClick={handleClose}
    >
      <section
        className="add-task-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-task-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="add-task-modal-header">
          <div>
            <p className="add-task-modal-kicker">Planner</p>
            <h2 id="add-task-modal-title" className="add-task-modal-title">Add New Task</h2>
            <p className="add-task-modal-subtitle">Create a task that shows up across your weekly view.</p>
          </div>
          <button
            type="button"
            className="add-task-modal-close"
            onClick={handleClose}
            aria-label="Close add task modal"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form className="add-task-modal-form" onSubmit={handleSubmit}>
          <label className="add-task-modal-field">
            <span className="add-task-modal-label">Task Name</span>
            <div className="add-task-modal-input-wrap">
              <input
                value={taskName}
                onChange={(event) => setTaskName(event.target.value)}
                placeholder="Finish problem set or morning run"
                className="add-task-modal-input"
              />
            </div>
          </label>

          <div className="add-task-modal-grid">
            <label className="add-task-modal-field">
              <span className="add-task-modal-label">Category</span>
              <div className="add-task-modal-select-wrap">
                <Tag size={16} aria-hidden="true" className="add-task-modal-leading-icon" />
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="add-task-modal-select"
                >
                  <option value="">Select category</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <label className="add-task-modal-field">
              <span className="add-task-modal-label">Due Date</span>
              <div className="add-task-modal-input-wrap">
                <CalendarDays size={16} aria-hidden="true" className="add-task-modal-leading-icon" />
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="add-task-modal-input add-task-modal-input-has-icon"
                />
              </div>
            </label>
          </div>

          <div className="add-task-modal-grid">
            <label className="add-task-modal-field">
              <span className="add-task-modal-label">Start Time</span>
              <div className="add-task-modal-input-wrap">
                <Clock3 size={16} aria-hidden="true" className="add-task-modal-leading-icon" />
                <input
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  className="add-task-modal-input add-task-modal-input-has-icon"
                />
              </div>
            </label>

            <label className="add-task-modal-field">
              <span className="add-task-modal-label">End Time</span>
              <div className="add-task-modal-input-wrap">
                <Clock3 size={16} aria-hidden="true" className="add-task-modal-leading-icon" />
                <input
                  type="time"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  className="add-task-modal-input add-task-modal-input-has-icon"
                />
              </div>
            </label>
          </div>

          <div className="add-task-modal-field">
            <span className="add-task-modal-label">Recurring Days</span>
            <div className="add-task-modal-days-header">
              <Repeat2 size={16} aria-hidden="true" />
              <span>Optional weekly repeat</span>
            </div>
            <div className="add-task-modal-days">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day}
                  type="button"
                  className={`add-task-modal-day${selectedDays.includes(day) ? ' is-selected' : ''}`}
                  onClick={() => toggleDay(day)}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="add-task-modal-actions">
            <button
              type="button"
              className="add-task-modal-action add-task-modal-action-secondary"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="add-task-modal-action add-task-modal-action-primary"
              disabled={isSubmitDisabled}
            >
              Add Task
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
