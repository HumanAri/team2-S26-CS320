import Brand from '../components/Brand'
import ThemeToggle from '../components/ThemeToggle'
import { Plus, FolderPlus } from 'lucide-react'

/** @typedef {import('../types/task').Task} Task */
/** @typedef {import('../types/task').CalendarTask} CalendarTask */
/** @typedef {import('../types/task').Category} Category */

export default function HomePage() {
  return (
    <div className="home-page">
      <div className="home-top-bar">
        <Brand/>
        <div className="home-top-bar-buttons">
          <div className="home-pill-placeholder" aria-hidden="true" />
          <button type="button" className="home-pill-button home-pill-button-1">
            <Plus size={18} />
            <span>Add Task</span>
          </button>
          <button type="button" className="home-pill-button home-pill-button-2">
            <FolderPlus size={18} />
            <span>Add Category</span>
          </button>
        </div>
        <ThemeToggle/>
      </div>

      <div className="home-main-row">
        <div className="home-calendar-section"></div>
        <div className="home-friends-section"></div>
      </div>

      <div className="home-upcoming-section"></div>
    </div>
  )
}
