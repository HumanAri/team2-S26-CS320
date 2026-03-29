import { useState } from 'react'
import Brand from '../components/Brand'
import ThemeToggle from '../components/ThemeToggle'
import FriendsWidget from '../components/FriendsWidget'
import UpcomingTasksBar from '../components/UpcomingTasksBar'
import { Plus, FolderPlus } from 'lucide-react'

/** @typedef {import('../types/task').Task} Task */
/** @typedef {import('../types/task').CalendarTask} CalendarTask */
/** @typedef {import('../types/task').Category} Category */

export default function HomePage() {

  const [categories, setCategories] = useState([
    { name: "CS 230", color: "#b7e4ee", priority: 1 },
    { name: "Gym", color: "#f6de95", priority: 1 },
  ])
  
  const [tasks, setTasks] = useState([
    { 
      id: "1", 
      name: "Make Homepage UI", 
      category: "CS 230", 
      dueDate: "3/29", 
      startTime: "2:00 PM",
      endTime: "",
      recurringDays: [],
      completed: false
    },
    { 
      id: "2", 
      name: "LEG DAY!!!", 
      category: "Gym", 
      dueDate: "3/29", 
      startTime: "3:00 PM",
      endTime: "",
      recurringDays: [],
      completed: false
    }
  ])

  const [friends, setFriends] = useState([
    { id: "1", name: "Mike G.", avatar: "👨", tasksCompleted: 4, totalTasks: 9 },
    { id: "2", name: "Ella H.", avatar: "👩", tasksCompleted: 11, totalTasks: 11 },
  ]);

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
        <div className="home-friends-section">
          <FriendsWidget friends={friends} onAddFriendClick={()=>{}} />
        </div>
      </div>

      <div className="home-upcoming-section">
        <UpcomingTasksBar tasks={tasks} categories={categories} onTaskClick={()=>{}} />
      </div>
    </div>
  )
}
