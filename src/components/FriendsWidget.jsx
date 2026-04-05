
/** @typedef {import('../types/task').Friend} Friend */
import { Check, Plus, X } from 'lucide-react'

export default function FriendsWidget({
    friends,
    friendRequest,
    onAcceptFriendRequest,
    onRejectFriendRequest,
    onAddFriendClick
}) {
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
                {friendRequest ? (
                    <article className="friends-widget-card friends-widget-card-request">
                        <div className="friends-widget-avatar" aria-hidden="true">
                            {friendRequest.avatar}
                        </div>
                        <div className="friends-widget-card-body">
                            <p className="friends-widget-name">{friendRequest.name}</p>
                            <p className="friends-widget-tasks">Incoming friend request</p>
                        </div>
                        <div className="friends-widget-request-actions">
                            <button
                                type="button"
                                className="friends-widget-request-button friends-widget-request-button-accept"
                                onClick={onAcceptFriendRequest}
                                aria-label={`Accept friend request from ${friendRequest.name}`}
                            >
                                <Check size={16} aria-hidden="true" />
                            </button>
                            <button
                                type="button"
                                className="friends-widget-request-button friends-widget-request-button-reject"
                                onClick={onRejectFriendRequest}
                                aria-label={`Reject friend request from ${friendRequest.name}`}
                            >
                                <X size={16} aria-hidden="true" />
                            </button>
                        </div>
                    </article>
                ) : null}

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
