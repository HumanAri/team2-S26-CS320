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
  return (
    <section className="upcoming-tasks-bar">
      <div className="upcoming-tasks-header">
        <h2 className="upcoming-tasks-title">Upcoming Tasks</h2>
      </div>

      <div className="upcoming-tasks-list">
        {tasks.map((task) => {
          const category = categories.find((item) => item.name === task.category);
          const borderColor = category?.color || '#cfd5de';
          const backgroundColor = lightenHexColor(borderColor);

          return (
            <button
              key={task.id}
              type="button"
              className="upcoming-task-card"
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
                    <p className="upcoming-task-name">{task.name}</p>
                    <p className="upcoming-task-category-name">{category?.name || task.category || 'Uncategorized'}</p>
                  </div>
                </div>

                <span className="upcoming-task-priority-badge" aria-label={`Priority ${category?.priority ?? 'N/A'}`}>
                  {category?.priority ?? 'N/A'}
                </span>
              </div>

              <div className="upcoming-task-bottom">
                <div className="upcoming-task-detail">
                  <CalendarDays size={15} aria-hidden="true" />
                  <span>{task.dueDate || 'No due date'}</span>
                </div>
                <div className="upcoming-task-detail">
                  <Clock3 size={15} aria-hidden="true" />
                  <span>{task.startTime || 'No start time'}</span>
                </div>
              </div>
            </button>
          );
        })}

        {tasks.length === 0 && <p className="upcoming-tasks-empty">No upcoming tasks yet.</p>}
      </div>
    </section>
  );
}
