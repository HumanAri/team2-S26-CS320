import { useState } from 'react'
import Brand from '../components/Brand'
import ThemeToggle from '../components/ThemeToggle'
import FriendsWidget from '../components/FriendsWidget'
import UpcomingTasksBar from '../components/UpcomingTasksBar'
import CalendarWidget from '../components/CalendarWidget'
import { Plus, FolderPlus } from 'lucide-react'

/** @typedef {import('../types/task').Task} Task */
/** @typedef {import('../types/task').Category} Category */

export default function HomePage() {

  const [categories, setCategories] = useState([
    { id: "cat-1", name: "CS 230", color: "#b7e4ee", priority: 1 },
    { id: "cat-2", name: "Gym", color: "#f6de95", priority: 1 },
    { id: "cat-3", name: "Work", color: "#f2c6de", priority: 2 },
    { id: "cat-4", name: "Personal", color: "#cfe7c2", priority: 3 },
    { id: "cat-5", name: "Study Group", color: "#d7d1ff", priority: 2 },
    { id: "cat-6", name: "Errands", color: "#ffd7b8", priority: 3 },
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
    },
    {
      id: "3",
      name: "Team standup",
      category: "Work",
      dueDate: "3/30",
      startTime: "9:00 AM",
      endTime: "9:30 AM",
      recurringDays: ["Monday"],
      completed: false
    },
    {
      id: "4",
      name: "Database homework",
      category: "CS 230",
      dueDate: "3/31",
      startTime: "11:00 AM",
      endTime: "12:30 PM",
      recurringDays: [],
      completed: false
    },
    {
      id: "5",
      name: "Pick up groceries",
      category: "Errands",
      dueDate: "4/1",
      startTime: "5:30 PM",
      endTime: "6:30 PM",
      recurringDays: [],
      completed: false
    },
    {
      id: "6",
      name: "Study group review",
      category: "Study Group",
      dueDate: "4/2",
      startTime: "6:00 PM",
      endTime: "7:30 PM",
      recurringDays: ["Thursday"],
      completed: false
    },
    {
      id: "7",
      name: "Meal prep",
      category: "Personal",
      dueDate: "4/2",
      startTime: "7:30 PM",
      endTime: "8:30 PM",
      recurringDays: [],
      completed: false
    },
    {
      id: "8",
      name: "Frontend polish pass",
      category: "Work",
      dueDate: "4/3",
      startTime: "1:00 PM",
      endTime: "3:00 PM",
      recurringDays: [],
      completed: false
    },
    {
      id: "9",
      name: "Upper body workout",
      category: "Gym",
      dueDate: "4/4",
      startTime: "4:00 PM",
      endTime: "5:00 PM",
      recurringDays: ["Friday"],
      completed: false
    },
    {
      id: "10",
      name: "Read chapter 7",
      category: "CS 230",
      dueDate: "4/4",
      startTime: "8:00 PM",
      endTime: "9:00 PM",
      recurringDays: [],
      completed: true
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
        <div className="home-calendar-section">
          <CalendarWidget tasks={tasks} categories={categories} />
        </div>
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
