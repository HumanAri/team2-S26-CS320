/** @typedef {import('../types/task').Task} Task */
/** @typedef {import('../types/task').Category} Category */
import { CalendarDays, Clock3 } from 'lucide-react';

function lightenHexColor(hexColor, amount = 0.8) {
  const normalized = hexColor?.trim();
  if (!normalized || normalized[0] !== '#') return '#f5f6f8';

  const hex = normalized.length === 4
    ? `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`
    : normalized;

  if (hex.length !== 7) return '#f5f6f8';

  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);

  if ([red, green, blue].some((value) => Number.isNaN(value))) return '#f5f6f8';

  const mix = (channel) => Math.round(channel + (255 - channel) * amount);
  return `rgb(${mix(red)}, ${mix(green)}, ${mix(blue)})`;
}

export default function UpcomingTasksBar({ tasks = [], categories = [], onTaskClick }) {
  const sortedTasks = [...tasks]
    .filter(task => !task.completed) // only show upcoming (incomplete) tasks
    .sort((a, b) => {
      // sort by start time (earliest first)
      if (!a.start_time) return 1;
      if (!b.start_time) return -1;

      const startDiff = a.start_time - b.start_time;
      if (startDiff !== 0) return startDiff;

      // tie-breaker: category priority (1 = high, 3 = low)
      const aPriority = a.my_category(categories)?.priority ?? 999;
      const bPriority = b.my_category(categories)?.priority ?? 999;

      return aPriority - bPriority;
    });

  return (
    <section className="upcoming-tasks-bar">
      <div className="upcoming-tasks-header">
        <h2 className="upcoming-tasks-title">Upcoming Tasks</h2>
      </div>

      <div className="upcoming-tasks-list">
        {sortedTasks.map((task) => {
          const category = task.my_category(categories);
          const borderColor = category?.color || '#cfd5de';
          const backgroundColor = lightenHexColor(borderColor, task.completed ? 0.9 : 0.8);
          const priority = category?.priority ?? 'N/A';
          return (
            <button
              key={task.id}
              type="button"
              className={`upcoming-task-card${task.completed ? ' is-complete' : ''}`}
              style={{ borderColor, backgroundColor }}
              onClick={() => onTaskClick?.(task)}
            >
              <div className="upcoming-task-top">
                <div className="upcoming-task-title-wrap">
                  <span
                    className="upcoming-task-category-dot"
                    style={{ backgroundColor: borderColor }}
                    aria-hidden="true"
                  />
                  <div className="upcoming-task-title-copy">
                    <p className="upcoming-task-name">{task.title}</p>
                    <p className="upcoming-task-category-name">{category?.name || 'Uncategorized'}</p>
                  </div>
                </div>

                <span className="upcoming-task-priority-badge" aria-label={`Priority ${priority}`}>
                  {priority}
                </span>
              </div>

              <div className="upcoming-task-bottom">
                <div className="upcoming-task-detail">
                  <CalendarDays size={15} aria-hidden="true" />
                  <span>{task.short_due_date()|| 'No due date'}</span>
                </div>
                <div className="upcoming-task-detail">
                  <Clock3 size={15} aria-hidden="true" />
                  <span>{task.start_time_string() || 'No start time'}</span>
                </div>
              </div>
            </button>
          );
        })}

        {sortedTasks.length === 0 && <p className="upcoming-tasks-empty">No upcoming tasks yet.</p>}
      </div>
    </section>
  );
}
