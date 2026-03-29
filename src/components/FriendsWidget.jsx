

/** @typedef {import('../types/task').Friend} Friend */
import { Plus } from 'lucide-react'

export default function FriendsWidget({friends, onAddFriendClick}) {
    return (
        <section className="friends-widget">
            <div className="friends-widget-header">
                <h2 className="friends-widget-title">Friends</h2>
                <button
                    type="button"
                    className="friends-widget-add-button"
                    onClick={onAddFriendClick}
                    aria-label="Add friend"
                >
                    <Plus size={16} />
                </button>
            </div>

            <div className="friends-widget-list">
                {friends.map((friend) => (
                    <article key={friend.id} className="friends-widget-card">
                        <div className="friends-widget-avatar" aria-hidden="true">
                            {friend.avatar}
                        </div>
                        <div className="friends-widget-card-body">
                            <p className="friends-widget-name">{friend.name}</p>
                            <p className="friends-widget-tasks">
                                {friend.tasksCompleted}/{friend.totalTasks} {friend.tasksCompleted === 1 ? 'task' : 'tasks'} done today
                            </p>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    )
}
