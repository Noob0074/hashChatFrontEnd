import { useAuth } from '../../context/AuthContext'
import API from '../../api/axios'
import toast from 'react-hot-toast'
import {
  Menu,
  Hash,
  Users,
  Shield,
  ShieldCheck,
  LogOut,
  Trash2,
  Settings,
  Copy,
  Ban,
  UserCircle,
} from 'lucide-react'
import ConfirmModal from '../Modals/ConfirmModal'
import { useState } from 'react'

const ChatHeader = ({ room, isAdmin, onOpenSidebar, onToggleAdmin, onRoomLeft, onRoomDeleted }) => {
  const { user, setUser } = useAuth()
  const [showConfirmAction, setShowConfirmAction] = useState(null) // null | 'leave' | 'delete' | 'block'


  // For DM, show other user's name
  let displayName = room?.name || 'Anonymous Room'
  let targetId = null
  let isBlocked = false
  let otherUser = null
  const isDM = room.type === 'dm'

  if (isDM && room.members) {
    otherUser = room.members.find((m) => (m._id || m) !== user?._id)
    targetId = otherUser?._id || otherUser
    if (otherUser?.username) {
      displayName = otherUser.isDeleted ? 'Deleted User' : otherUser.username
    }
    isBlocked = user?.blockedUsers?.some(b => (b._id || b).toString() === targetId?.toString())
  }

  const handleLeave = async () => {
    try {
      await API.post(`/rooms/${room._id}/leave`)
      toast.success('Left room')
      onRoomLeft(room._id)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to leave room')
    }
  }

  const handleDelete = async () => {
    try {
      if (room.type === 'dm') {
        await API.put(`/rooms/${room._id}/hide`)
        toast.success('Chat hidden')
      } else {
        await API.delete(`/rooms/${room._id}`)
        toast.success('Room deleted')
      }
      onRoomDeleted(room._id)
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to ${room.type === 'dm' ? 'hide chat' : 'delete room'}`)
    }
  }

  const handleBlock = async () => {
    try {
      const { data } = await API.post(`/users/block/${targetId}`)
      toast.success('User blocked')
      setUser(data.user) // Updates the blocked array in auth context
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to block user')
    }
  }

  const handleUnblock = async () => {
    try {
      const { data } = await API.post(`/users/unblock/${targetId}`)
      toast.success('User unblocked')
      setUser(data.user)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to unblock user')
    }
  }

  const copyRoomId = () => {
    navigator.clipboard.writeText(room._id)
    toast.success('Room ID copied!')
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700/50 bg-dark-900/60 backdrop-blur-xl">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu and Room info */}
        <button
          onClick={onOpenSidebar}
          className="p-2 text-dark-400 hover:text-white transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-dark-800 border border-dark-700/50 flex items-center justify-center overflow-hidden flex-shrink-0">
            {room.roomPic ? (
              <img src={room.roomPic} alt={displayName} className="w-full h-full object-cover" />
            ) : isDM ? (
              otherUser?.profilePic ? (
                <img src={otherUser.profilePic} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="w-6 h-6 text-dark-500" />
              )
            ) : (
              <Hash className="w-5 h-5 text-primary-500" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white truncate leading-none mb-1">
              {displayName}
            </h2>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">

        {room.type !== 'dm' && (
          <button
            onClick={onToggleAdmin}
            className={`p-2 rounded-lg transition-colors ${
              isAdmin 
                ? 'text-dark-500 hover:text-primary-400 hover:bg-primary-500/10' 
                : 'text-dark-500 hover:text-dark-200 hover:bg-dark-800'
            }`}
            title={isAdmin ? "Admin Panel" : "Room Information"}
          >
            {isAdmin ? <Settings className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          </button>
        )}

        {!isAdmin && room.type !== 'dm' && (
          <button
            onClick={() => setShowConfirmAction('leave')}
            className="p-2 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Leave Room"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}

        {room.type === 'dm' && (
          <>
            {isBlocked ? (
              <button
                onClick={handleUnblock}
                className="p-2 rounded-lg text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                title="Unblock User"
              >
                <Shield className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowConfirmAction('block')}
                className="p-2 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Block User"
              >
                <Ban className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShowConfirmAction('delete')}
              className="p-2 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Delete Chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {showConfirmAction === 'leave' && (
        <ConfirmModal
          title="Leave Room"
          message={`Are you sure you want to leave ${room.name}?`}
          onConfirm={handleLeave}
          onClose={() => setShowConfirmAction(null)}
          danger={false}
        />
      )}

      {showConfirmAction === 'delete' && (
        <ConfirmModal
          title={room.type === 'dm' ? 'Hide Chat' : 'Delete Room'}
          message={
            room.type === 'dm'
              ? 'Hide this chat from your list? It will come back if a new message arrives.'
              : 'Are you sure? This action cannot be undone and all messages will be deleted.'
          }
          onConfirm={handleDelete}
          onClose={() => setShowConfirmAction(null)}
          danger={room.type !== 'dm'}
        />
      )}

      {showConfirmAction === 'block' && (
        <ConfirmModal
          title="Block User"
          message={`Are you sure you want to block ${displayName}? They won't be able to DM you anymore.`}
          onConfirm={handleBlock}
          onClose={() => setShowConfirmAction(null)}
          danger={true}
        />
      )}
    </div>
  )
}

export default ChatHeader
