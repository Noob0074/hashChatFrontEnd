import { useState, useEffect } from 'react'
import { X, ShieldCheck, Info, Users, Settings, Clock, Link as LinkIcon, User, Trash2 } from 'lucide-react'
import ConfirmModal from '../Modals/ConfirmModal'
import MembersPanel from './MembersPanel'
import JoinRequestsPanel from './JoinRequestsPanel'
import AdminSettings from './AdminSettings'
import API from '../../api/axios'
import toast from 'react-hot-toast'
import { useSocket } from '../../context/SocketContext'

const AdminPanel = ({ room, onClose, onRefresh, isAdmin }) => {
  const [tab, setTab] = useState('info')
  const [roomData, setRoomData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { socket } = useSocket()

  useEffect(() => {
    fetchRoomDetails()
  }, [room._id])

  useEffect(() => {
    if (!socket) return

    const handleUpdate = (updatedRoom) => {
      const data = updatedRoom.room || updatedRoom
      if (data._id === room._id) {
        fetchRoomDetails()
      }
    }

    const handleRoomUpdateRequest = ({ roomId }) => {
      if (roomId === room._id) {
        fetchRoomDetails()
      }
    }

    socket.on('new_request', handleRoomUpdateRequest)
    socket.on('room_updated', handleUpdate)
    socket.on('user_kicked', handleRoomUpdateRequest)
    socket.on('user_banned', handleRoomUpdateRequest)
    socket.on('user_unbanned', handleRoomUpdateRequest)

    return () => {
      socket.off('new_request', handleRoomUpdateRequest)
      socket.off('room_updated', handleUpdate)
      socket.off('user_kicked', handleRoomUpdateRequest)
      socket.off('user_banned', handleRoomUpdateRequest)
      socket.off('user_unbanned', handleRoomUpdateRequest)
    }
  }, [socket, room._id])

  const fetchRoomDetails = async () => {
    try {
      const { data } = await API.get(`/rooms/${room._id}`)
      setRoomData(data.room)
    } catch (err) {
      toast.error('Failed to load room details')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action, userId) => {
    if (!isAdmin) return
    try {
      await API.post(`/rooms/${room._id}/${action}`, { userId })
      toast.success(
        action === 'approve'
          ? 'User approved'
          : action === 'reject'
          ? 'Request rejected'
          : action === 'kick'
          ? 'User kicked'
          : action === 'unban'
          ? 'User unbanned'
          : 'User banned'
      )
      await fetchRoomDetails()
      if (onRefresh) onRefresh()
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to ${action} user`)
    }
  }

  const handleDeleteRoom = async () => {
    try {
      await API.delete(`/rooms/${room._id}`)
      toast.success('Room deleted')
      if (onRefresh) onRefresh()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete room')
    }
  }

  const renderInfoTab = () => {
    if (!roomData) return null
    const createdDate = new Date(roomData.createdAt).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center py-4">
          <div className="w-20 h-20 rounded-2xl bg-dark-800 border border-dark-700 flex items-center justify-center overflow-hidden mb-3">
            {roomData.roomPic ? (
              <img src={roomData.roomPic} alt="Room" className="w-full h-full object-cover" />
            ) : (
              <Info className="w-8 h-8 text-primary-500" />
            )}
          </div>
          <h4 className="text-lg font-bold text-white text-center px-4">{roomData.name}</h4>
          <span className={`mt-2 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
            roomData.type === 'public' 
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
              : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
          }`}>
            {roomData.type} Room
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-dark-800/50 rounded-xl border border-dark-700/50">
            <User className="w-4 h-4 text-primary-400 mt-0.5" />
            <div>
              <p className="text-[10px] uppercase font-bold text-dark-500 tracking-wider">Creator</p>
              <p className="text-sm text-dark-100">{roomData.createdBy?.username || 'Unknown'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-dark-800/50 rounded-xl border border-dark-700/50">
            <Clock className="w-4 h-4 text-primary-400 mt-0.5" />
            <div>
              <p className="text-[10px] uppercase font-bold text-dark-500 tracking-wider">Created On</p>
              <p className="text-sm text-dark-100">{createdDate}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-dark-800/50 rounded-xl border border-dark-700/50 relative group">
            <LinkIcon className="w-4 h-4 text-primary-400 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase font-bold text-dark-500 tracking-wider">Room ID</p>
              <p className="text-sm text-dark-100 truncate">{roomData._id}</p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(roomData._id);
                toast.success('Room ID copied!');
              }}
              className="p-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 text-dark-300 hover:text-white transition-all shadow-sm"
              title="Copy ID"
            >
              <LinkIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {isAdmin && (
          <div className="pt-4 border-t border-dark-700/50">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3 px-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 transition-all flex items-center justify-center gap-2 group"
            >
              <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold uppercase tracking-wider">Delete Room</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-80 border-l border-dark-700/50 bg-dark-900 flex flex-col h-full flex-shrink-0 animate-fade-in">
      <div className="p-4 border-b border-dark-700/50 flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          {isAdmin ? (
            <ShieldCheck className="w-4 h-4 text-primary-400" />
          ) : (
            <Info className="w-4 h-4 text-primary-400" />
          )}
          {isAdmin ? 'Admin Panel' : 'Room Information'}
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded text-dark-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex bg-dark-800 p-1 m-4 rounded-lg overflow-hidden border border-dark-700/30">
        <button
          onClick={() => setTab('info')}
          className={`flex-1 py-1.5 px-2 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all ${
            tab === 'info' ? 'bg-dark-700 text-primary-400 shadow-sm shadow-black/20' : 'text-dark-500 hover:text-dark-200'
          }`}
        >
          Info
        </button>
        <button
          onClick={() => setTab('members')}
          className={`flex-1 py-1.5 px-2 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all ${
            tab === 'members' ? 'bg-dark-700 text-primary-400 shadow-sm shadow-black/20' : 'text-dark-500 hover:text-dark-200'
          }`}
        >
          Members
        </button>
        {isAdmin && room.type === 'private' && (
          <button
            onClick={() => setTab('requests')}
            className={`flex-1 py-1.5 px-2 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all relative ${
              tab === 'requests' ? 'bg-dark-700 text-primary-400 shadow-sm shadow-black/20' : 'text-dark-500 hover:text-dark-200'
            }`}
          >
            Reqs
            {roomData?.pendingRequests?.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full border border-dark-800 font-bold">
                {roomData.pendingRequests.length}
              </span>
            )}
          </button>
        )}
        {isAdmin && (
          <button
            onClick={() => setTab('settings')}
            className={`flex-1 py-1.5 px-2 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all ${
              tab === 'settings' ? 'bg-dark-700 text-primary-400 shadow-sm shadow-black/20' : 'text-dark-500 hover:text-dark-200'
            }`}
          >
            Setup
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : tab === 'info' ? (
          renderInfoTab()
        ) : tab === 'members' ? (
          <MembersPanel
            members={roomData?.members || []}
            bannedUsers={roomData?.bannedUsers || []}
            createdBy={roomData?.createdBy?._id || roomData?.createdBy}
            isPublic={room.type === 'public'}
            isAdmin={isAdmin}
            onKick={(userId) => handleAction('kick', userId)}
            onBan={(userId) => handleAction('ban', userId)}
            onUnban={(userId) => handleAction('unban', userId)}
          />
        ) : tab === 'requests' ? (
          <JoinRequestsPanel
            requests={roomData?.pendingRequests || []}
            onApprove={(userId) => handleAction('approve', userId)}
            onReject={(userId) => handleAction('reject', userId)}
          />
        ) : (
          <AdminSettings 
            room={roomData || room} 
            onUpdate={(updatedRoom) => {
              setRoomData(updatedRoom);
              if (onRefresh) onRefresh();
            }}
          />
        )}
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Room"
          message="Are you sure? This action cannot be undone and all messages will be permanently deleted."
          danger={true}
          onConfirm={handleDeleteRoom}
          onClose={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  )
}

export default AdminPanel
