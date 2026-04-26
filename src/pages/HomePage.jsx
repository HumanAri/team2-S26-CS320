import { useEffect, useState } from 'react'
import Brand from '../components/Brand'
import FriendsWidget from '../components/FriendsWidget'
import UpcomingTasksBar from '../components/UpcomingTasksBar'
import CalendarWidget from '../components/CalendarWidget'
import AddTaskModal from '../components/AddTaskModal'
import AddCategoryModal from '../components/AddCategoryModal'
import TaskDetailsModal from '../components/TaskDetailsModal'
import ProfileModal from '../components/ProfileModal'
import AddFriendModal from '../components/AddFriendModal'
import { Plus, FolderPlus } from 'lucide-react'

/** @typedef {import('../types/task').Task} Task */
/** @typedef {import('../types/task').Category} Category */

export default function HomePage() {
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false)
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [profile, setProfile] = useState({
    email: '',
    display_name: '',
    first_name: '',
    last_name: '',
    profile_picture: '🙂',
  })

  const [categories, setCategories] = useState([
    { id: "cat-1", name: "CS", color: "#b7e4ee", priority: 1 },
    { id: "cat-2", name: "Gym", color: "#f6de95", priority: 1 },
    { id: "cat-3", name: "Work", color: "#f2c6de", priority: 2 },
    { id: "cat-4", name: "Personal", color: "#cfe7c2", priority: 3 },
    { id: "cat-5", name: "Study Group", color: "#d7d1ff", priority: 2 },
    { id: "cat-6", name: "Errands", color: "#ffd7b8", priority: 3 },
  ])
  
  const [tasks, setTasks] = useState([
    {
      id: "1",
      name: "Weekly planning session",
      category: "Personal",
      dueDate: "4/5",
      startTime: "9:00 AM",
      endTime: "11:00 AM",
      recurringDays: [],
      completed: false
    },
    {
      id: "2",
      name: "Upper body workout",
      category: "Gym",
      dueDate: "4/5",
      startTime: "5:30 PM",
      endTime: "7:30 PM",
      recurringDays: [],
      completed: false
    },
    {
      id: "3",
      name: "Sprint kickoff",
      category: "Work",
      dueDate: "4/6",
      startTime: "9:30 AM",
      endTime: "11:30 AM",
      recurringDays: [],
      completed: false
    },
    {
      id: "4",
      name: "Algorithms lecture notes",
      category: "CS",
      dueDate: "4/6",
      startTime: "1:00 PM",
      endTime: "3:00 PM",
      recurringDays: [],
      completed: false
    },
    {
      id: "5",
      name: "Team project sync",
      category: "Study Group",
      dueDate: "4/7",
      startTime: "4:00 PM",
      endTime: "6:00 PM",
      recurringDays: [],
      completed: false
    },
    {
      id: "6",
      name: "Leg day",
      category: "Gym",
      dueDate: "4/7",
      startTime: "6:00 PM",
      endTime: "8:00 PM",
      recurringDays: [],
      completed: false
    },
    {
      id: "7",
      name: "Database assignment block",
      category: "CS",
      dueDate: "4/8",
      startTime: "11:00 AM",
      endTime: "1:00 PM",
      recurringDays: [],
      completed: false
    },
    {
      id: "8",
      name: "Grocery run",
      category: "Errands",
      dueDate: "4/8",
      startTime: "5:45 PM",
      endTime: "7:45 PM",
      recurringDays: [],
      completed: false
    },
    {
      id: "9",
      name: "Mock interview practice",
      category: "Work",
      dueDate: "4/9",
      startTime: "2:00 PM",
      endTime: "4:00 PM",
      recurringDays: [],
      completed: false
    },
    {
      id: "10",
      name: "Study group review",
      category: "Study Group",
      dueDate: "4/9",
      startTime: "7:00 PM",
      endTime: "9:00 PM",
      recurringDays: [],
      completed: false
    },
    {
      id: "11",
      name: "Frontend polish pass",
      category: "Work",
      dueDate: "4/10",
      startTime: "10:00 AM",
      endTime: "12:00 PM",
      recurringDays: [],
      completed: false
    },
    {
      id: "12",
      name: "Campus coffee catch-up",
      category: "Personal",
      dueDate: "4/10",
      startTime: "3:30 PM",
      endTime: "5:30 PM",
      recurringDays: [],
      completed: false
    },
    {
      id: "13",
      name: "Laundry and reset",
      category: "Errands",
      dueDate: "4/11",
      startTime: "10:30 AM",
      endTime: "12:30 PM",
      recurringDays: [],
      completed: false
    },
    {
      id: "14",
      name: "Read chapter 8",
      category: "CS",
      dueDate: "4/11",
      startTime: "7:30 PM", 
      endTime: "9:30 PM",
      recurringDays: [],
      completed: true
    }
  ])

  const [friends, setFriends] = useState([
    { id: "1", name: "Hingle McCringleberry", avatar: "👨", tasksCompleted: 4, totalTasks: 9 },
    { id: "2", name: "Ella", avatar: "👩", tasksCompleted: 11, totalTasks: 11 },
  ]);
  const [friendRequest, setFriendRequest] = useState({
    id: "request-1",
    name: "John Pork",
    avatar: "🐷",
  })

  function handleAcceptFriendRequest() {
    if (!friendRequest) return

    setFriends((currentFriends) => [
      {
        id: friendRequest.id,
        name: friendRequest.name,
        avatar: friendRequest.avatar,
        tasksCompleted: 0,
        totalTasks: 0,
      },
      ...currentFriends,
    ])
    setFriendRequest(null)
  }

  function handleRejectFriendRequest() {
    setFriendRequest(null)
  }

  function handleAddTask(task) {
    setTasks((currentTasks) => [task, ...currentTasks])
  }

  function handleAddCategory(category) {
    setCategories((currentCategories) => [category, ...currentCategories])
  }

  function handleSelectTask(task) {
    setSelectedTask(task)
  }

  function handleCloseTaskModal() {
    setSelectedTask(null)
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    let isActive = true

    async function loadProfile() {
      try {
        const response = await fetch('http://localhost:8000/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) return

        const user = await response.json()
        if (isActive) {
          setProfile((currentProfile) => ({
            ...currentProfile,
            ...user,
            profile_picture: user.profile_picture || currentProfile.profile_picture,
          }))
        }
      } catch {
        // Keep the default avatar if the profile request fails.
      }
    }

    async function loadHomePageData() {
      try {
        const response = await fetch('http://localhost:8000/api/homepage', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) return

        const data = await response.json()
        console.log(data)
        if (isActive) {
          const due_date = (data.due_date) ? new Date(data.due_date) : null
          const start_time = (data.start_time) ? new Date(data.start_time) : null
          const end_time = (data.end_time) ? new Date(data.end_time) : null
          const created_at = (data.created_at) ? new Date(data.created_at) : null
        }


      } catch {

      }
      
    }

    loadProfile()
    loadHomePageData()

    return () => {
      isActive = false
    }
  }, [])



  function handleDeleteTask(taskToDelete) {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskToDelete.id))
    setSelectedTask(null)
  }

  function handleMarkTaskDone(taskToUpdate) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskToUpdate.id
          ? { ...task, completed: true }
          : task
      )
    )
    setSelectedTask((currentTask) => (currentTask ? { ...currentTask, completed: true } : currentTask))
  }

  return (
    <div className="home-page">
      <div className="home-top-bar">
        <Brand/>
        <div className="home-top-bar-buttons">
          <div className="home-pill-placeholder" aria-hidden="true" />
          <button
            type="button"
            className="home-pill-button home-pill-button-1"
            onClick={() => setIsAddTaskModalOpen(true)}
          >
            <Plus size={18} />
            <span>Add Task</span>
          </button>
          <button
            type="button"
            className="home-pill-button home-pill-button-2"
            onClick={() => setIsAddCategoryModalOpen(true)}
          >
            <FolderPlus size={18} />
            <span>Add Category</span>
          </button>
        </div>
        <div className="home-top-bar-spacer" />
        <button
          type="button"
          className="home-profile-button"
          aria-label="Profile"
          onClick={() => setIsProfileModalOpen(true)}
        >
          <span className="home-profile-button-circle" aria-hidden="true">{profile.profile_picture}</span>
          <span className="home-profile-button-label">Profile</span>
        </button>
      </div>

      <div className="home-main-row">
        <div className="home-calendar-section">
          <CalendarWidget tasks={tasks} categories={categories} onTaskClick={handleSelectTask} />
        </div>
        <div className="home-friends-section">
          <FriendsWidget
            friends={friends}
            friendRequest={friendRequest}
            onAcceptFriendRequest={handleAcceptFriendRequest}
            onRejectFriendRequest={handleRejectFriendRequest}
            onAddFriendClick={() => setIsAddFriendModalOpen(true)}
          />
        </div>
      </div>

      <div className="home-upcoming-section">
        <UpcomingTasksBar tasks={tasks} categories={categories} onTaskClick={handleSelectTask} />
      </div>

      <AddTaskModal
        open={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        categories={categories}
        onAddTask={handleAddTask}
      />

      <AddCategoryModal
        open={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
        onAddCategory={handleAddCategory}
      />

      <TaskDetailsModal
        open={Boolean(selectedTask)}
        task={selectedTask}
        onClose={handleCloseTaskModal}
        onDelete={handleDeleteTask}
        onMarkDone={handleMarkTaskDone}
      />

      <ProfileModal
        open={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
      />

      <AddFriendModal
        open={isAddFriendModalOpen}
        onClose={() => setIsAddFriendModalOpen(false)}
      />
    </div>
  )
}
