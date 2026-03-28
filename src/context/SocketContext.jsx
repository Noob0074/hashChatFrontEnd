import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

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
  const socketRef = useRef(null)

  useEffect(() => {
    if (!user) {
      // Disconnect if user logs out
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setSocket(null)
      }
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
    newSocket.on('user_online', ({ userId }) => {
      setOnlineUsers((prev) => new Set([...prev, userId]))
    })

    newSocket.on('user_offline', ({ userId }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    })

    socketRef.current = newSocket
    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
      socketRef.current = null
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
