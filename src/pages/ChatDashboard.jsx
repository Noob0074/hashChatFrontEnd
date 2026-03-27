import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar/Sidebar'
import ChatArea from '../components/Chat/ChatArea'
import { useSocket } from '../context/SocketContext'
import API from '../api/axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import VerificationOverlay from '../components/Auth/VerificationOverlay'

const ChatDashboard = () => {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [rooms, setRooms] = useState([])
  const [activeRoom, setActiveRoom] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loadingRooms, setLoadingRooms] = useState(true)

  // Fetch rooms on mount
  useEffect(() => {
    fetchRooms()
  }, [])

  // Listen for kick/ban events
  useEffect(() => {
    if (!socket) return

    const handleKicked = ({ roomId }) => {
      toast.error('You were removed from the room')
      if (activeRoom?._id === roomId) setActiveRoom(null)
      fetchRooms()
    }

    const handleBanned = ({ roomId }) => {
      toast.error('You are banned from this room')
      if (activeRoom?._id === roomId) setActiveRoom(null)
      fetchRooms()
    }

    const handleNewDm = ({ room }) => {
      setRooms((prev) => {
        if (prev.find(r => r._id === room._id)) return prev;
        toast('New Direct Message!', { icon: '💬' });
        return [room, ...prev];
      });
    };

    const handleNewRequest = () => {
      toast.success('New join request for your room!');
      fetchRooms();
    };

    const handleRequestApproved = ({ room }) => {
      toast.success(`Your join request was approved!`);
      fetchRooms(); // Better than manually adding, as it gets all data (lastMessage, etc)
    };

    const handleUserAction = () => {
      fetchRooms()
    };

    const handleRoomDeletedEvent = ({ roomId }) => {
      setRooms((prev) => prev.filter((r) => r._id !== roomId))
      setActiveRoom((prev) => (prev?._id === roomId ? null : prev))
    }

    const handleUnbannedEvent = () => {
      toast.success('You were unbanned from a room!')
      fetchRooms()
    }

    const handleRoomUpdated = ({ room }) => {
      setRooms((prev) => prev.map((r) => (r._id === room._id ? { ...r, ...room } : r)))
      if (activeRoom?._id === room._id) {
        setActiveRoom((prev) => ({ ...prev, ...room }))
      }
    }

    socket.on('kicked', handleKicked)
    socket.on('banned', handleBanned)
    socket.on('unbanned', handleUnbannedEvent)
    socket.on('new_dm', handleNewDm)
    socket.on('new_request', handleNewRequest)
    socket.on('request_approved', handleRequestApproved)
    socket.on('user_kicked', handleUserAction)
    socket.on('user_banned', handleUserAction)
    socket.on('user_unbanned', handleUserAction)
    socket.on('room_deleted', handleRoomDeletedEvent)
    socket.on('room_updated', handleRoomUpdated)

    return () => {
      socket.off('kicked', handleKicked)
      socket.off('banned', handleBanned)
      socket.off('unbanned', handleUnbannedEvent)
      socket.off('new_dm', handleNewDm)
      socket.off('new_request', handleNewRequest)
      socket.off('request_approved', handleRequestApproved)
      socket.off('user_kicked', handleUserAction)
      socket.off('user_banned', handleUserAction)
      socket.off('user_unbanned', handleUserAction)
      socket.off('room_deleted', handleRoomDeletedEvent)
      socket.off('room_updated', handleRoomUpdated)
    }
  }, [socket, activeRoom])

  const fetchRooms = async () => {
    try {
      const { data } = await API.get('/rooms')
      setRooms(data.rooms)
      if (activeRoom) {
        const updatedData = data.rooms.find(r => r._id === activeRoom._id)
        if (updatedData) setActiveRoom(updatedData)
      }
    } catch (err) {
      toast.error('Failed to load rooms')
    } finally {
      setLoadingRooms(false)
    }
  }

  const handleSelectRoom = (room) => {
    setActiveRoom(room)
    // On mobile, close sidebar when room selected
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  const handleRoomCreated = (newRoom) => {
    setRooms((prev) => [newRoom, ...prev])
    setActiveRoom(newRoom)
  }

  const handleRoomJoined = (room) => {
    setRooms((prev) => {
      const exists = prev.find((r) => r._id === room._id)
      if (exists) return prev
      return [room, ...prev]
    })
    setActiveRoom(room)
  }

  const handleRoomLeft = (roomId) => {
    setRooms((prev) => prev.filter((r) => r._id !== roomId))
    if (activeRoom?._id === roomId) setActiveRoom(null)
  }

  const handleRoomDeleted = (roomId) => {
    setRooms((prev) => prev.filter((r) => r._id !== roomId))
    if (activeRoom?._id === roomId) setActiveRoom(null)
  }

  if (user && !user.isGuest && !user.isVerified) {
    return <VerificationOverlay />
  }

  return (
    <div className="flex-1 h-full w-full flex bg-dark-950 overflow-hidden relative">
      {/* Sidebar */}
      <div
        className={`
          ${sidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full'}
          transition-all duration-300 ease-in-out
          fixed md:relative z-30 h-full flex-shrink-0 overflow-hidden border-r border-dark-700/50 pt-[env(safe-area-inset-top)]
        `}
      >
        <Sidebar
          rooms={rooms}
          activeRoom={activeRoom}
          loadingRooms={loadingRooms}
          onSelectRoom={handleSelectRoom}
          onRoomCreated={handleRoomCreated}
          onRoomJoined={handleRoomJoined}
          onCloseSidebar={() => setSidebarOpen(false)}
        />
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <ChatArea
          room={activeRoom}
          onOpenSidebar={() => setSidebarOpen(prev => !prev)}
          onRoomLeft={handleRoomLeft}
          onRoomDeleted={handleRoomDeleted}
          onRefreshRooms={fetchRooms}
        />
      </div>
    </div>
  )
}

export default ChatDashboard
