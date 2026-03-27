import { useState, useEffect, useRef } from 'react'
import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import TypingIndicator from './TypingIndicator'
import AdminPanel from '../Admin/AdminPanel'
import { useSocket } from '../../context/SocketContext'
import { useAuth } from '../../context/AuthContext'
import API from '../../api/axios'
import { Hash } from 'lucide-react'

const ChatArea = ({ room, onOpenSidebar, onRoomLeft, onRoomDeleted, onRefreshRooms }) => {
  const { socket, joinRoom, leaveRoom } = useSocket()
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [cursor, setCursor] = useState(null)
  const [typingUsers, setTypingUsers] = useState([])
  const [showRoomInfo, setShowRoomInfo] = useState(false)
  const [editingMessage, setEditingMessage] = useState(null)
  const prevRoomRef = useRef(null)

  // Join/leave socket room when active room changes
  useEffect(() => {
    if (prevRoomRef.current) {
      leaveRoom(prevRoomRef.current)
    }

    if (room) {
      joinRoom(room._id)
      fetchMessages(room._id)
      prevRoomRef.current = room._id
    } else {
      setMessages([])
      prevRoomRef.current = null
    }

    setShowRoomInfo(false)
    setTypingUsers([])
    setEditingMessage(null)
  }, [room?._id])

  const handleMessageUpdated = ({ messageId, content, type, isEdited, isDeleted }) => {
    setMessages((prev) => 
      prev.map((msg) => 
        msg._id === messageId ? { ...msg, content, type, isEdited, isDeleted } : msg
      )
    )
  }

  const handleMessageDeleted = ({ messageId }) => {
    setMessages((prev) => prev.filter((msg) => msg._id !== messageId))
  }

  // Listen for new messages
  useEffect(() => {
    if (!socket || !room) return

    const handleNewMessage = (message) => {
      if (message.roomId === room._id) {
        setMessages((prev) => [...prev, message])
      }
    }

    const handleTyping = ({ userId, username }) => {
      if (userId !== user?._id) {
        setTypingUsers((prev) => {
          if (prev.find((u) => u.userId === userId)) return prev
          return [...prev, { userId, username }]
        })
      }
    }

    const handleStopTyping = ({ userId }) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId))
    }
    
    socket.on('receive_message', handleNewMessage)
    socket.on('typing', handleTyping)
    socket.on('stop_typing', handleStopTyping)
    socket.on('message_updated', handleMessageUpdated)
    socket.on('message_deleted', handleMessageDeleted)

    return () => {
      socket.off('receive_message', handleNewMessage)
      socket.off('typing', handleTyping)
      socket.off('stop_typing', handleStopTyping)
      socket.off('message_updated', handleMessageUpdated)
      socket.off('message_deleted', handleMessageDeleted)
    }
  }, [socket, room?._id, user?._id])

  const fetchMessages = async (roomId, loadMore = false) => {
    setLoading(true)
    try {
      let url = `/messages/${roomId}?limit=50`
      if (loadMore && cursor) {
        url += `&cursor=${cursor}`
      }

      const { data } = await API.get(url)

      if (loadMore) {
        setMessages((prev) => [...data.messages, ...prev])
      } else {
        setMessages(data.messages)
      }

      setHasMore(data.hasMore)
      setCursor(data.cursor)
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = () => {
    if (room && hasMore && !loading) {
      fetchMessages(room._id, true)
    }
  }

  // Empty state
  if (!room) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-dark-950">
        <div className="text-center animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30 animate-glow">
              <Hash className="w-8 h-8 text-white" />
            </div>
            <span className="font-bold text-2xl text-white">Hashchat</span>
          </div>
          <h3 className="text-xl font-semibold text-dark-400 mb-2">Welcome to Hashchat</h3>
          <p className="text-dark-600 text-sm max-w-xs">
            Select a room from the sidebar or create a new one to start chatting
          </p>

          <button
            onClick={onOpenSidebar}
            className="btn-primary mt-6"
          >
            Open Sidebar
          </button>
        </div>
      </div>
    )
  }

  const isAdmin = (room?.createdBy?._id || room?.createdBy) === user?._id

  return (
    <div className="h-full flex flex-col bg-dark-950 overflow-hidden pt-[env(safe-area-inset-top)]">
      <ChatHeader
        room={room}
        isAdmin={isAdmin}
        onOpenSidebar={onOpenSidebar}
        onToggleAdmin={() => setShowRoomInfo(!showRoomInfo)}
        onRoomLeft={onRoomLeft}
        onRoomDeleted={onRoomDeleted}
      />

      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Messages */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <MessageList
            messages={messages}
            loading={loading}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            onEditMessage={setEditingMessage}
            onDeleteMessage={handleMessageDeleted}
            isAdmin={isAdmin}
          />

          <TypingIndicator users={typingUsers} />

          <ChatInput 
            room={room} 
            editingMessage={editingMessage} 
            setEditingMessage={setEditingMessage} 
          />
        </div>

        {showRoomInfo && room.type !== 'dm' && (
          <AdminPanel
            room={room}
            onClose={() => setShowRoomInfo(false)}
            onRefresh={onRefreshRooms}
            isAdmin={isAdmin}
          />
        )}
      </div>
    </div>
  )
}

export default ChatArea
