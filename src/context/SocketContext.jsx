import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import { normalizePresenceId } from '../utils/presence'

const SocketContext = createContext(null)

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) throw new Error('useSocket must be used within SocketProvider')
  return context
}

export const SocketProvider = ({ children }) => {
  const { user } = useAuth()
  const [socket, setSocket] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [lastSeenByUser, setLastSeenByUser] = useState({})
  const socketRef = useRef(null)

  useEffect(() => {
    if (!user) {
      // Disconnect if user logs out
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setSocket(null)
      }
      setOnlineUsers(new Set())
      setLastSeenByUser({})
      return
    }

    const token = localStorage.getItem('token')
    if (!token) return

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
    })

    newSocket.on('connect', () => {
      console.log('🟢 Socket connected:', newSocket.id)
    })

    newSocket.on('disconnect', () => {
      console.log('🔴 Socket disconnected')
    })

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message)
    })

    // Track online users
    newSocket.on('presence_snapshot', ({ userIds = [] }) => {
      setOnlineUsers(new Set(userIds.map((id) => normalizePresenceId(id))))
    })

    newSocket.on('user_online', ({ userId }) => {
      const normalizedUserId = normalizePresenceId(userId)
      setOnlineUsers((prev) => new Set([...prev, normalizedUserId]))
      setLastSeenByUser((prev) => {
        const next = { ...prev }
        delete next[normalizedUserId]
        return next
      })
    })

    newSocket.on('user_offline', ({ userId, lastActive }) => {
      const normalizedUserId = normalizePresenceId(userId)
      setOnlineUsers((prev) => {
        const next = new Set(prev)
        next.delete(normalizedUserId)
        return next
      })
      if (lastActive) {
        setLastSeenByUser((prev) => ({
          ...prev,
          [normalizedUserId]: lastActive,
        }))
      }
    })

    socketRef.current = newSocket
    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
      socketRef.current = null
      setOnlineUsers(new Set())
      setLastSeenByUser({})
    }
  }, [user])

  const joinRoom = (roomId) => {
    socketRef.current?.emit('join_room', roomId)
  }

  const leaveRoom = (roomId) => {
    socketRef.current?.emit('leave_room', roomId)
  }

  const sendMessage = (data) => {
    socketRef.current?.emit('send_message', data)
  }

  const startTyping = (roomId) => {
    socketRef.current?.emit('typing', roomId)
  }

  const stopTyping = (roomId) => {
    socketRef.current?.emit('stop_typing', roomId)
  }

  const kickUser = (roomId, targetUserId) => {
    socketRef.current?.emit('kick_user', { roomId, targetUserId })
  }

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        lastSeenByUser,
        joinRoom,
        leaveRoom,
        sendMessage,
        startTyping,
        stopTyping,
        kickUser,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}
