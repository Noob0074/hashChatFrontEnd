import { Hash, Users, MessageSquare } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const RoomsList = ({ rooms, activeRoom, loading, onSelectRoom }) => {
  const { user } = useAuth()

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (rooms.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <MessageSquare className="w-10 h-10 text-dark-600 mb-3" />
        <p className="text-dark-500 text-sm font-medium">No rooms yet</p>
        <p className="text-dark-600 text-xs mt-1">
          Create a room or search for users to start chatting
        </p>
      </div>
    )
  }

  const dmRooms = rooms.filter(r => r.type === 'dm')
  const myRooms = rooms.filter(r => r.type !== 'dm' && (r.createdBy?._id || r.createdBy) === user?._id)
  const joinedRooms = rooms.filter(r => r.type !== 'dm' && (r.createdBy?._id || r.createdBy) !== user?._id)

  const renderRoomItem = (room) => {
    const isActive = activeRoom?._id === room._id
    const isAdmin = room.type !== 'dm' && (room.createdBy?._id || room.createdBy) === user?._id

    // For DMs, show the other user's name
    let displayName = room.name
    if (room.type === 'dm' && room.members) {
      const otherMember = room.members.find(
        (m) => (m._id || m) !== user?._id
      )
      if (otherMember?.username) {
        displayName = otherMember.isDeleted ? 'Deleted User' : otherMember.username
      }
    }

    return (
      <div
        key={room._id}
        onClick={() => onSelectRoom(room)}
        className={`room-item ${isActive ? 'active' : ''}`}
      >
        {/* Icon */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden ${
          room.type === 'dm'
            ? 'bg-primary-500/10 text-primary-400'
            : room.type === 'public'
            ? 'bg-emerald-500/10 text-emerald-400'
            : 'bg-amber-500/10 text-amber-400'
        }`}>
          {room.roomPic ? (
            <img src={room.roomPic} alt={displayName} className="w-full h-full object-cover" />
          ) : room.type === 'dm' ? (
            (() => {
              const otherMember = room.members?.find(m => (m._id || m) !== user?._id);
              return otherMember?.profilePic ? (
                <img src={otherMember.profilePic} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <Users className="w-4 h-4" />
              );
            })()
          ) : (
            <Hash className="w-4 h-4" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-dark-200 truncate">
              {displayName}
            </span>
            {room.type !== 'dm' && (
              <span className={`text-[9px] ${
                room.type === 'public' ? 'badge-public' : 'badge-private'
              }`}>
                {room.type}
              </span>
            )}
            {isAdmin && room.type !== 'dm' && (
              <span className="text-[9px] badge bg-primary-500/15 text-primary-400 border border-primary-500/20">
                admin
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
      {dmRooms.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-2 px-3">
            Direct Messages
          </h3>
          <div className="space-y-0.5">
            {dmRooms.map(renderRoomItem)}
          </div>
        </div>
      )}

      {myRooms.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-2 px-3">
            My Rooms
          </h3>
          <div className="space-y-0.5">
            {myRooms.map(renderRoomItem)}
          </div>
        </div>
      )}

      {joinedRooms.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-2 px-3">
            Joined Rooms
          </h3>
          <div className="space-y-0.5">
            {joinedRooms.map(renderRoomItem)}
          </div>
        </div>
      )}
    </div>
  )
}

export default RoomsList
