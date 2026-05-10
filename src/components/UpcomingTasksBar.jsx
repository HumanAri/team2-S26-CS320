
import { AlignEndHorizontal, CalendarDays, Clock3 } from 'lucide-react';
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

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

function parseDateValue(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const isoDateMatch = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateMatch) {
    return new Date(
      Number.parseInt(isoDateMatch[1], 10),
      Number.parseInt(isoDateMatch[2], 10) - 1,
      Number.parseInt(isoDateMatch[3], 10)
    );
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatShortDate(value) {
  const date = parseDateValue(value);
  return date ? `${date.getMonth() + 1}/${date.getDate()}` : '';
}

function isDueWithinNextWeek(value) {
  const dueDate = parseDateValue(value);
  if (!dueDate) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const oneWeekOut = new Date(today);
  oneWeekOut.setDate(today.getDate() + 7);
  oneWeekOut.setHours(23, 59, 59, 999);

  return dueDate >= today && dueDate <= oneWeekOut;
}

export default function UpcomingTasksBar({ tasks = [], categories = [], onTaskClick }) {
  const sortedTasks = tasks
    .flatMap((task) => {
      const recurrenceOccurrences = task.recurrence_occurrences || [];

      if (recurrenceOccurrences.length === 0) {
        return [{ task, occurrence: null, dueDate: task.due_date, completed: task.completed }];
      }

      return recurrenceOccurrences
        .filter((occurrence) => occurrence.status !== 'deleted')
        .map((occurrence) => ({
          task,
          occurrence,
          dueDate: occurrence.occurrence_date,
          completed: occurrence.status === 'complete',
        }));
    })
    .filter(item => !item.completed) // only show upcoming (incomplete) tasks
    .filter(item => isDueWithinNextWeek(item.dueDate))
    .sort((a, b) => {
      const aDueDate = parseDateValue(a.dueDate);
      const bDueDate = parseDateValue(b.dueDate);

      if (aDueDate && bDueDate && aDueDate - bDueDate !== 0) return aDueDate - bDueDate;
      if (!aDueDate && bDueDate) return 1;
      if (aDueDate && !bDueDate) return -1;

      // sort by start time (earliest first)
      if (!a.task.start_time) return 1;
      if (!b.task.start_time) return -1;

      const startDiff = a.task.start_time - b.task.start_time;
      if (startDiff !== 0) return startDiff;

      // tie-breaker: category priority (1 = high, 3 = low)
      const aPriority = a.task.my_category(categories)?.priority ?? 999;
      const bPriority = b.task.my_category(categories)?.priority ?? 999;

      return aPriority - bPriority;
    });

  return (
    <section className="upcoming-tasks-bar">
      <div className="upcoming-tasks-header">
        <h2 className="upcoming-tasks-title">Upcoming Tasks</h2>
      </div>

      <div className="upcoming-tasks-list">
        
        {sortedTasks.map(({ task, occurrence, dueDate, completed }) => {
          if (task.id === "skeleton") {
            const borderColor = "#d3d3d3";
            const backgroundColor = lightenHexColor(borderColor, 0.8);
            return (<button
              key={task.id + crypto.randomUUID()}
              type="button"
              className={"upcoming-task-card is-complete"}
              style={{ borderColor , backgroundColor }}
              onClick={() => {}}
            >

              <Skeleton height={25} />
              
              <Skeleton count={1} />


            </button>);
          } else {
          const category = task.my_category(categories);
          const borderColor = category?.color || '#cfd5de';
          const backgroundColor = lightenHexColor(borderColor, completed ? 0.9 : 0.8);
          const priority = category?.priority ?? 'N/A';
          return (
            <button
              key={occurrence ? `${task.id}-${occurrence.occurrence_date}` : task.id}
              type="button"
              className={`upcoming-task-card${completed ? ' is-complete' : ''}`}
              style={{ borderColor, backgroundColor }}
              onClick={() => onTaskClick?.(task, occurrence)}
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
                  <span>{formatShortDate(dueDate) || 'No due date'}</span>
                </div>
                <div className="upcoming-task-detail">
                  <Clock3 size={15} aria-hidden="true" />
                  <span>{task.start_time_string() || 'No start time'}</span>
                </div>
              </div>
            </button>
          );
          }
          
        })}

        {sortedTasks.length === 0 && <p className="upcoming-tasks-empty">No upcoming tasks yet.</p>}
      </div>
    </section>
  );
}
