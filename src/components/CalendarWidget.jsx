
import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react'

/** @typedef {import('../types/task').Task} Task */
/** @typedef {import('../types/task').Category} Category */

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const START_HOUR = 0
const END_HOUR = 23
const SLOT_HEIGHT = 72
const HOUR_ROWS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => START_HOUR + index)

function parseDateValue(dateValue) {
  if (!dateValue) return null
  if (dateValue instanceof Date) {
    return Number.isNaN(dateValue.getTime()) ? null : dateValue
  }

  const parsedDate = new Date(dateValue)
  if (!Number.isNaN(parsedDate.getTime())) return parsedDate

  const [monthText, dayText] = String(dateValue).split('/')
  const month = Number.parseInt(monthText, 10)
  const day = Number.parseInt(dayText, 10)

  if (Number.isNaN(month) || Number.isNaN(day)) return null

  const date = new Date()
  date.setFullYear(date.getFullYear(), month - 1, day)
  date.setHours(0, 0, 0, 0)
  return date
}

function parseTimeToMinutes(timeValue) {
  if (!timeValue) return null

  const dateValue = parseDateValue(timeValue)
  if (dateValue) return dateValue.getHours() * 60 + dateValue.getMinutes()

  const normalized = String(timeValue).trim().toUpperCase()
  const match = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/)
  if (!match) return null

  let hour = Number.parseInt(match[1], 10)
  const minutes = Number.parseInt(match[2], 10)
  const meridiem = match[3]

  if (Number.isNaN(hour) || Number.isNaN(minutes)) return null

  if (meridiem === 'AM' && hour === 12) hour = 0
  if (meridiem === 'PM' && hour !== 12) hour += 12

  return hour * 60 + minutes
}

function formatHourLabel(hour) {
  if (hour === 0) return '12 AM'
  if (hour === 12) return '12 PM'
  if (hour > 12) return `${hour - 12} PM`
  return `${hour} AM`
}

function formatMinutesLabel(totalMinutes) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440
  const hour24 = Math.floor(normalized / 60)
  const minutes = normalized % 60
  const hour12 = hour24 % 12 || 12
  const meridiem = hour24 >= 12 ? 'PM' : 'AM'
  return `${hour12}:${String(minutes).padStart(2, '0')} ${meridiem}`
}

function getWeekStart(today) {
  const weekStart = new Date(today)
  weekStart.setHours(0, 0, 0, 0)
  weekStart.setDate(today.getDate() - today.getDay())
  return weekStart
}

function addDays(date, daysToAdd) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + daysToAdd)
  return nextDate
}

function sameDay(left, right) {
  if (!left || !right) return false

  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

function isTaskOnRecurringDay(task, dayIndex) {
  const recurringDays = task.recurring_days || task.recurringDays
  if (!Array.isArray(recurringDays) || recurringDays.length === 0) return false

  const dayAliases = new Set([
    dayIndex,
    String(dayIndex),
    WEEK_DAYS[dayIndex],
    WEEK_DAYS[dayIndex].toLowerCase(),
    ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex],
    ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayIndex],
  ])

  return recurringDays.some((value) => dayAliases.has(value) || dayAliases.has(String(value).trim()))
}

function getTaskDurationMinutes(task) {
  const startMinutes = parseTimeToMinutes(task.start_time || task.startTime)
  const endMinutes = parseTimeToMinutes(task.end_time || task.endTime)

  if (startMinutes === null) return 60
  if (endMinutes !== null && endMinutes > startMinutes) return endMinutes - startMinutes
  return 60
}

function getTaskCategory(task, categories) {
  if (typeof task.my_category === 'function') return task.my_category(categories)

  return categories.find(
    (category) =>
      category.id === task.category_id ||
      category.id === task.categoryId ||
      category.name === task.category
  )
}

export default function CalendarWidget({ tasks = [], categories = [], onTaskClick }) {
  const scrollContainerRef = useRef(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const today = useMemo(() => {
    const now = new Date()
    now.setSeconds(0, 0)
    return now
  }, [])

  const currentWeekStart = useMemo(() => getWeekStart(today), [today])
  const weekStart = useMemo(
    () => addDays(currentWeekStart, weekOffset * 7),
    [currentWeekStart, weekOffset]
  )
  const isCurrentWeek = weekOffset === 0
  const days = useMemo(
    () => WEEK_DAYS.map((label, index) => {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + index)
      return { label, date, isToday: isCurrentWeek && sameDay(date, today) }
    }),
    [isCurrentWeek, today, weekStart]
  )

  const scheduledTasks = useMemo(
      () =>
        tasks.flatMap((task) => {
          const category = getTaskCategory(task, categories)
          const startMinutes = parseTimeToMinutes(task.start_time || task.startTime)
          if (startMinutes === null) return []

          const durationMinutes = getTaskDurationMinutes(task)
          const endMinutes = startMinutes + durationMinutes
          const dueDate = parseDateValue(task.due_date || task.dueDate)

          const recurringDays = task.recurring_days || task.recurringDays
          const isRecurring = Array.isArray(recurringDays) && recurringDays.length > 0

          // if recurring, create an entry for every matching day in the week
          if (isRecurring) {
            return days
              .map((day, index) => {
                if (!isTaskOnRecurringDay(task, index)) return null
                return {
                  task,
                  category,
                  dayIndex: index,
                  startMinutes,
                  endMinutes,
                  durationMinutes,
                }
              })
              .filter(Boolean)
          }

          // non-recurring: place on the due date
          const dayIndexFromDate = dueDate ? days.findIndex((day) => sameDay(day.date, dueDate)) : -1
          if (dayIndexFromDate < 0) return []

          return [{
            task,
            category,
            dayIndex: dayIndexFromDate,
            startMinutes,
            endMinutes,
            durationMinutes,
          }]
        }),
      [categories, days, tasks]
    )

  const currentTimePosition = useMemo(() => {
    if (!isCurrentWeek) return null

    const dayIndex = today.getDay()
    const minutes = today.getHours() * 60 + today.getMinutes()

    return {
      dayIndex,
      topOffset: ((minutes - START_HOUR * 60) / 60) * SLOT_HEIGHT,
    }
  }, [isCurrentWeek, today])

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer || !currentTimePosition) return

    const targetScrollTop = currentTimePosition.topOffset - scrollContainer.clientHeight / 2
    scrollContainer.scrollTop = Math.max(targetScrollTop, 0)
  }, [currentTimePosition])

  const weekRangeLabel = `${days[0].date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })} - ${days[6].date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })}`

  return (
    <section className="calendar-widget">
      <div className="calendar-widget-header">
        <div>
          <h2 className="calendar-widget-title">Weekly Calendar</h2>
          <p className="calendar-widget-subtitle">{weekRangeLabel}</p>
        </div>
        <div className="calendar-widget-nav">
          <button
            type="button"
            className="calendar-widget-nav-button"
            onClick={() => setWeekOffset((value) => value - 1)}
            aria-label="Show previous week"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="calendar-widget-nav-button"
            onClick={() => setWeekOffset((value) => value + 1)}
            aria-label="Show next week"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="calendar-widget-board">
        <div ref={scrollContainerRef} className="calendar-widget-scroll">
          <div className="calendar-widget-grid">
            <div className="calendar-widget-header-row">
              <div className="calendar-widget-corner">
                <CalendarDays size={16} aria-hidden="true" />
                <span>{isCurrentWeek ? 'This Week' : 'Selected Week'}</span>
              </div>
              {days.map((day) => (
                <div
                  key={day.label}
                  className={`calendar-widget-day-header${day.isToday ? ' is-today' : ''}`}
                >
                  <span className="calendar-widget-day-name">{day.label}</span>
                  <span className="calendar-widget-day-date">
                    {day.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>

            <div className="calendar-widget-body">
              <div className="calendar-widget-time-column">
                {HOUR_ROWS.map((hour) => (
                  <div key={hour} className="calendar-widget-time-cell">
                    {formatHourLabel(hour)}
                  </div>
                ))}
              </div>

              <div className="calendar-widget-days">
                {days.map((day, dayIndex) => (
                  <div
                    key={day.label}
                    className={`calendar-widget-day-column${day.isToday ? ' is-today' : ''}`}
                  >
                    {HOUR_ROWS.map((hour) => (
                      <div key={`${day.label}-${hour}`} className="calendar-widget-hour-slot" />
                    ))}

                    {scheduledTasks
                      .filter((scheduledTask) => scheduledTask.dayIndex === dayIndex)
                      .map((scheduledTask) => {
                        const { task, category, startMinutes, endMinutes, durationMinutes } = scheduledTask
                        const accentColor = category?.color || '#cfd5de'
                        const top = ((startMinutes - START_HOUR * 60) / 60) * SLOT_HEIGHT
                        const maxEndMinutes = (END_HOUR + 1) * 60
                        const clampedDuration = Math.min(durationMinutes, maxEndMinutes - startMinutes)
                        const height = Math.max((clampedDuration / 60) * SLOT_HEIGHT - 6, 48)

                        return (
                          <button
                            key={task.id}
                            type="button"
                            className={`calendar-widget-task${task.completed ? ' is-complete' : ''}`}
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              borderColor: accentColor,
                              backgroundColor: `color-mix(in srgb, ${accentColor} 18%, var(--card-bg) 82%)`,
                            }}
                            onClick={() => onTaskClick?.(task)}
                          >
                            <div
                              className="calendar-widget-task-accent"
                              style={{ backgroundColor: accentColor }}
                              aria-hidden="true"
                            />
                            <div className="calendar-widget-task-body">
                              <p className="calendar-widget-task-name">{task.title || task.name}</p>
                              <p className="calendar-widget-task-category">
                                {category?.name || task.category || 'Uncategorized'}
                              </p>
                              <div className="calendar-widget-task-time">
                                <Clock3 size={13} aria-hidden="true" />
                                <span>
                                  {formatMinutesLabel(startMinutes)}
                                  {' - '}
                                  {formatMinutesLabel(endMinutes)}
                                </span>
                              </div>
                            </div>
                          </button>
                        )
                      })}

                    {currentTimePosition && currentTimePosition.dayIndex === dayIndex && (
                      <div
                        className="calendar-widget-now-line"
                        style={{ top: `${currentTimePosition.topOffset}px` }}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {scheduledTasks.length === 0 && (
          <p className="calendar-widget-empty">Add a task with a start time to see it on the calendar.</p>
        )}
      </div>
    </section>
  )
}
