
import { Check, Plus, X } from 'lucide-react'

export default function FriendsWidget({
    friends,
    friendRequests,
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
                {
                    [ ...friendRequests.map((friend) => (
                            
                            <article key={friend.id} className="friends-widget-card friends-widget-card-request">
                                <div className="friends-widget-avatar" aria-hidden="true">
                                    {friend.profile_emoji}
                                </div>
                                <div className="friends-widget-card-body">
                                    <p className="friends-widget-name">{friend.full_name}</p>
                                    <p className="friends-widget-tasks">Incoming friend request</p>
                                </div>
                                <div className="friends-widget-request-actions">
                                    <button
                                        type="button"
                                        className="friends-widget-request-button friends-widget-request-button-accept"
                                        onClick={() => onAcceptFriendRequest(friend)}
                                        aria-label={`Accept friend request from ${friend.full_name}`}
                                    >
                                        <Check size={16} aria-hidden="true" />
                                    </button>
                                    <button
                                        type="button"
                                        className="friends-widget-request-button friends-widget-request-button-reject"
                                        onClick={() => onRejectFriendRequest(friend)}
                                        aria-label={`Reject friend request from ${friend.full_name}`}
                                    >
                                        <X size={16} aria-hidden="true" />
                                    </button>
                                </div>
                            </article>
                        )
                    ),

                    ...friends.map((friend) => (
                        <article key={friend.id} className="friends-widget-card">
                            <div className="friends-widget-avatar" aria-hidden="true">
                                {friend.profile_emoji}
                            </div>
                            <div className="friends-widget-card-body">
                                <p className="friends-widget-name">{friend.full_name}</p>
                                <p className="friends-widget-tasks">
                                    {friend.get_card_snippet()}
                                </p>
                            </div>
                        </article>
                    ))]
                }
            </div>
        </section>
    )
}
