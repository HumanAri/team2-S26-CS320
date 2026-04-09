
import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react'

/** @typedef {import('../types/task').Task} Task */
/** @typedef {import('../types/task').Category} Category */

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const START_HOUR = 0
const END_HOUR = 23
const SLOT_HEIGHT = 72
const HOUR_ROWS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => START_HOUR + index)

function parseDueDate(dueDate) {
  if (!dueDate) return null

  const [monthText, dayText] = dueDate.split('/')
  const month = Number.parseInt(monthText, 10)
  const day = Number.parseInt(dayText, 10)

  if (Number.isNaN(month) || Number.isNaN(day)) return null

  const date = new Date()
  date.setFullYear(date.getFullYear(), month - 1, day)
  date.setHours(0, 0, 0, 0)
  return date
}

function parseTimeToMinutes(timeText) {
  if (!timeText) return null

  const normalized = timeText.trim().toUpperCase()
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
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

function isTaskOnRecurringDay(task, dayIndex) {
  if (!Array.isArray(task.recurringDays) || task.recurringDays.length === 0) return false

  const dayAliases = new Set([
    WEEK_DAYS[dayIndex],
    WEEK_DAYS[dayIndex].toLowerCase(),
    ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex],
    ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayIndex],
  ])

  return task.recurringDays.some((value) => dayAliases.has(String(value).trim()))
}

function getTaskDurationMinutes(task) {
  const startMinutes = parseTimeToMinutes(task.startTime)
  const endMinutes = parseTimeToMinutes(task.endTime)

  if (startMinutes === null) return 60
  if (endMinutes !== null && endMinutes > startMinutes) return endMinutes - startMinutes
  return 60
}

function getCategoryMap(categories) {
  return new Map(categories.map((category) => [category.name, category]))
}

export default function CalendarWidget({ tasks = [], categories = [] }) {
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

  const categoryMap = useMemo(() => getCategoryMap(categories), [categories])

  const scheduledTasks = useMemo(
    () =>
      tasks
        .map((task) => {
          const category = categoryMap.get(task.category)
          const startMinutes = parseTimeToMinutes(task.startTime)
          if (startMinutes === null) return null

          const dueDate = parseDueDate(task.dueDate)
          const dayIndexFromDate = dueDate ? days.findIndex((day) => sameDay(day.date, dueDate)) : -1
          const dayIndex = dayIndexFromDate >= 0
            ? dayIndexFromDate
            : days.findIndex((day, index) => isTaskOnRecurringDay(task, index))

          if (dayIndex < 0) return null

          const durationMinutes = getTaskDurationMinutes(task)
          return {
            ...task,
            category,
            dayIndex,
            startMinutes,
            endMinutes: startMinutes + durationMinutes,
            durationMinutes,
          }
        })
        .filter(Boolean),
    [categoryMap, days, tasks]
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
                      .filter((task) => task.dayIndex === dayIndex)
                      .map((task) => {
                        const accentColor = task.category?.color || '#cfd5de'
                        const top = ((task.startMinutes - START_HOUR * 60) / 60) * SLOT_HEIGHT
                        const height = Math.max((task.durationMinutes / 60) * SLOT_HEIGHT - 6, 48)

                        return (
                          <article
                            key={task.id}
                            className={`calendar-widget-task${task.completed ? ' is-complete' : ''}`}
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              borderColor: accentColor,
                              backgroundColor: `color-mix(in srgb, ${accentColor} 18%, var(--card-bg) 82%)`,
                            }}
                          >
                            <div
                              className="calendar-widget-task-accent"
                              style={{ backgroundColor: accentColor }}
                              aria-hidden="true"
                            />
                            <div className="calendar-widget-task-body">
                              <p className="calendar-widget-task-name">{task.name}</p>
                              <p className="calendar-widget-task-category">
                                {task.category?.name || task.category || 'Uncategorized'}
                              </p>
                              <div className="calendar-widget-task-time">
                                <Clock3 size={13} aria-hidden="true" />
                                <span>
                                  {formatMinutesLabel(task.startMinutes)}
                                  {' - '}
                                  {formatMinutesLabel(task.endMinutes)}
                                </span>
                              </div>
                            </div>
                          </article>
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
