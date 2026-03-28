import { useAuth } from '../../context/AuthContext'
import API from '../../api/axios'
import toast from 'react-hot-toast'
import { useSocket } from '../../context/SocketContext'
import { formatLastActive, normalizePresenceId } from '../../utils/presence'
import {
  Menu,
  Hash,
  Shield,
  ShieldCheck,
  LogOut,
  Trash2,
  Settings,
  Ban,
  UserCircle,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  MoreVertical,
} from 'lucide-react'
import ConfirmModal from '../Modals/ConfirmModal'
import { useState } from 'react'

const ChatHeader = ({
  room,
  isAdmin,
  onOpenSidebar,
  onToggleAdmin,
  onRoomLeft,
  onRoomDeleted,
  searchQuery,
  onSearchQueryChange,
  onSearchSubmit,
  onClearSearch,
  searchOpen,
  onToggleSearch,
  searchResultsCount,
  activeSearchIndex,
  onPrevSearchResult,
  onNextSearchResult,
  searchLoading,
  searchPerformed,
}) => {
  const { user, setUser } = useAuth()
  const { onlineUsers, lastSeenByUser } = useSocket()
  const [showConfirmAction, setShowConfirmAction] = useState(null) // null | 'leave' | 'delete' | 'block'
  const [showDmMenu, setShowDmMenu] = useState(false)


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

  const otherUserId = normalizePresenceId(targetId)
  const isOtherUserOnline = !!(isDM && otherUserId && onlineUsers.has(otherUserId))
  const lastActiveLabel =
    isDM && otherUserId
      ? isOtherUserOnline
        ? 'Online'
        : formatLastActive(lastSeenByUser[otherUserId] || otherUser?.lastActive)
      : ''

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
      setShowDmMenu(false)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to block user')
    }
  }

  const handleUnblock = async () => {
    try {
      const { data } = await API.post(`/users/unblock/${targetId}`)
      toast.success('User unblocked')
      setUser(data.user)
      setShowDmMenu(false)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to unblock user')
    }
  }

  return (
    <div className="relative z-30 border-b border-dark-700/50 bg-dark-900/60 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu and Room info */}
          <button
            onClick={onOpenSidebar}
            className="p-2 text-dark-400 hover:text-white transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-dark-800 border border-dark-700/50 flex items-center justify-center overflow-hidden flex-shrink-0 sm:h-10 sm:w-10">
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
              <h2 className="text-sm font-bold text-white truncate leading-none mb-0.5 sm:mb-1">
                {displayName}
              </h2>
              {isDM && !otherUser?.isDeleted && (
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isOtherUserOnline ? 'bg-emerald-400' : 'bg-dark-600'
                    }`}
                  />
                  <p className="text-[11px] text-dark-500 truncate">
                    {lastActiveLabel}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {room.type !== 'dm' && (
            <button
              onClick={onToggleSearch}
              className={`p-2 rounded-lg transition-colors ${
                searchOpen
                  ? 'text-primary-400 bg-primary-500/10'
                  : 'text-dark-500 hover:text-primary-400 hover:bg-primary-500/10'
              }`}
              title="Search in chat"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

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
            <div className="relative z-40">
              <button
                onClick={() => setShowDmMenu((prev) => !prev)}
                className={`p-2 rounded-lg transition-colors ${
                  showDmMenu
                    ? 'text-primary-400 bg-primary-500/10'
                    : 'text-dark-500 hover:text-dark-200 hover:bg-dark-800'
                }`}
                title="Conversation options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showDmMenu && (
                <>
                  <button
                    className="fixed inset-0 z-10 cursor-default"
                    aria-label="Close menu"
                    onClick={() => setShowDmMenu(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-dark-700/60 bg-dark-900/95 shadow-2xl backdrop-blur-xl sm:w-48">
                    <button
                      onClick={() => {
                        onToggleSearch()
                        setShowDmMenu(false)
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-dark-100 transition-colors hover:bg-dark-800"
                    >
                      <Search className="w-4 h-4" />
                      <span>{searchOpen ? 'Close Search' : 'Search Chat'}</span>
                    </button>

                    {isBlocked ? (
                      <button
                        onClick={handleUnblock}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-emerald-400 transition-colors hover:bg-emerald-500/10"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Unblock User</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setShowConfirmAction('block')
                          setShowDmMenu(false)
                        }}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                      >
                        <Ban className="w-4 h-4" />
                        <span>Block User</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setShowConfirmAction('delete')
                        setShowDmMenu(false)
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Hide Chat</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {searchOpen && (
      <div className="px-3 pb-2.5 sm:px-4 sm:pb-3">
        <form
          onSubmit={onSearchSubmit}
          className="flex flex-wrap items-center gap-1.5 rounded-xl border border-dark-700/50 bg-dark-950/70 px-2.5 py-1.5 sm:flex-nowrap sm:gap-2 sm:rounded-2xl sm:px-3 sm:py-2"
        >
          <Search className="h-4 w-4 flex-shrink-0 text-dark-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search this chat..."
            className="min-w-0 flex-1 basis-[110px] bg-transparent text-[13px] text-white placeholder:text-dark-600 focus:outline-none sm:basis-[120px] sm:text-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={onClearSearch}
              className="rounded-md p-1 text-dark-500 transition-colors hover:bg-dark-800 hover:text-dark-200"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="flex w-full items-center justify-end gap-1.5 sm:w-auto sm:flex-shrink-0 sm:gap-2">
            <button
              type="button"
              onClick={onPrevSearchResult}
              disabled={!searchResultsCount || searchLoading}
              className="rounded-md p-1 text-dark-500 transition-colors hover:bg-dark-800 hover:text-dark-200 disabled:opacity-40"
              title="Previous result"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onNextSearchResult}
              disabled={!searchResultsCount || searchLoading}
              className="rounded-md p-1 text-dark-500 transition-colors hover:bg-dark-800 hover:text-dark-200 disabled:opacity-40"
              title="Next result"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-primary-500 disabled:opacity-40 sm:rounded-xl sm:px-3 sm:text-xs"
              disabled={searchLoading}
            >
              {searchLoading ? '...' : 'Find'}
            </button>
            <button
              type="button"
              onClick={onToggleSearch}
              className="rounded-lg px-2 py-1.5 text-[11px] font-semibold text-dark-400 transition-colors hover:bg-dark-800 hover:text-dark-100 sm:px-2.5 sm:text-xs"
              title="Close search"
            >
              Close
            </button>
          </div>
        </form>

        <div className="mt-2 flex flex-col gap-1 text-[11px] text-dark-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {searchQuery.trim()
              ? searchResultsCount
                ? `${activeSearchIndex + 1} of ${searchResultsCount} results`
                : searchLoading
                  ? 'Searching chat history...'
                  : searchPerformed
                    ? 'No matches found'
                    : 'Press Enter to search'
              : 'Searches the full room history'}
          </span>
          {searchQuery.trim() && !searchLoading && (
            <span className="text-dark-600">Press Enter to search</span>
          )}
        </div>
      </div>
      )}

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
