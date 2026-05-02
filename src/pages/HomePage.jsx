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
import { Category, Task, Friend } from "../types/task.js"

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

  const [categories, setCategories] = useState([])
  const [tasks, setTasks] = useState([])
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);

  async function handleAcceptFriendRequest(friend) {
    if (!friendRequests) return

    const token = localStorage.getItem('token');

    setFriends((currentFriends) => [
      friend,
      ...currentFriends,
    ])

    setFriendRequests((currentFriendRequests) => currentFriendRequests.filter((f) => f.id !== friend.id))

    try {
      const res = await fetch('http://localhost:8000/api/friends/change-status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          friend_user_id: friend.id,
          new_status: 1
        })
      });
    } catch (err) {
      console.log(err)
    }
  
    
  }

  async function handleRejectFriendRequest(friend) {
    if (!friendRequests) return
    setFriendRequests((currentFriendRequests) => currentFriendRequests.filter((f) => f.id !== friend.id))
   

    const token = localStorage.getItem('token');

    try {
      const res = await fetch('http://localhost:8000/api/friends/change-status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          friend_user_id: friend.id,
          new_status: 2
        })
      });
    } catch (err) {
      console.log(err)
    }
  }

  function handleAddTask(new_task) {
    setTasks((currentTasks) => [new_task, ...currentTasks])
  }

  async function handleAddCategory(category) {
    const token = localStorage.getItem('token');
    const semesterId = localStorage.getItem('semester_id')

    const res = await fetch('http://localhost:8000/api/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        categories: [{name: category.name, color: category.color, priority: category.priority}],
        semester_id: semesterId
      })
    });

    const data = await res.json();
    const savedCategory = data.created?.[0];
    const categoryWithRealId = savedCategory ? { ...category, id: savedCategory.id } : category;

    setCategories(currentCategories => [categoryWithRealId, ...currentCategories]);
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

        if (isActive) {

          const categories_list = data.categories.map((category) => {
            return new Category(category.id, category.name, category.color, category.priority)
          })


          const tasks_list = data.tasks.map((task) => {

            return new Task(
              task.id,
              task.title,
              task.description,
              task.category_id,
              task.due_date,
              task.start_time,
              task.end_time,
              task.priority,
              task.recurring_days,
              task.status == "incomplete" ? false : true
            )
          });

          const friend_stub_to_friend = (friendStub) => {
            return new Friend(
              friendStub.id, 
              friendStub.full_name, 
              friendStub.display_name, 
              friendStub.profile_picture,
              friendStub.share_goals,
              friendStub.share_results,
              friendStub.share_other,
              friendStub.share_all
            )
          }

          const friends_list = data.myFriends.map(friend_stub_to_friend);

          const friend_requests = data.incomingFriendRequests.map(friend_stub_to_friend);

          setCategories(categories_list);
          setTasks(tasks_list);
          setFriends(friends_list);
          setFriendRequests(friend_requests);


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


  async function handleDeleteTask(taskToDelete) {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`http://localhost:8000/api/tasks/${taskToDelete.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          console.error('Failed to delete task')
          return
        }
      } catch {
        console.error('Could not reach server')
        return
      }

      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskToDelete.id))
      setSelectedTask(null)
    }

  async function handleMarkTaskDone(taskToUpdate) {

    taskToUpdate.completed = true;

    console.log(JSON.stringify(taskToUpdate))

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:8000/api/update-task', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
        body: JSON.stringify({
          id: taskToUpdate.id,
          title: taskToUpdate.title,
          description: taskToUpdate.description,
          category_id: taskToUpdate.category_id,
          due_date: taskToUpdate.due_date,
          start_time: taskToUpdate.start_time,
          end_time: taskToUpdate.end_time,
          priority: taskToUpdate.priority,
          status: "complete"
        })
      });
    } catch (err) {
      console.log(err)
      console.log("post failed")
    }

    setTasks((currentTasks) =>
      currentTasks.map((task) => {
          if (task.id == taskToUpdate.id) {
            return taskToUpdate;
          } else {
            return task;
          }
          
        }
      )
    )
    setSelectedTask((currentTask) => (currentTask ? taskToUpdate : currentTask))
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
            friendRequests={friendRequests}
            onAcceptFriendRequest={handleAcceptFriendRequest}
            onRejectFriendRequest={handleRejectFriendRequest}
            onAddFriendClick={() => setIsAddFriendModalOpen(true)}
          />
        </div>
      </div>

      <div className="home-upcoming-section">
        <UpcomingTasksBar tasks={tasks.filter(t => !t.completed)} categories={categories} onTaskClick={handleSelectTask} />
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
        categories={categories}
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
