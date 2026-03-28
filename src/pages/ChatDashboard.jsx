import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar/Sidebar'
import ChatArea from '../components/Chat/ChatArea'
import { useSocket } from '../context/SocketContext'
import API from '../api/axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import VerificationOverlay from '../components/Auth/VerificationOverlay'

const normalizeRoomId = (value) => value?.toString?.() || value

const ChatDashboard = () => {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [rooms, setRooms] = useState([])
  const [activeRoom, setActiveRoom] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [newMessageRoomIds, setNewMessageRoomIds] = useState([])

  const updateRoomState = (roomId, updater) => {
    const normalizedRoomId = normalizeRoomId(roomId)

    setRooms((prev) =>
      prev.map((room) => (normalizeRoomId(room._id) === normalizedRoomId ? updater(room) : room))
    )

    setActiveRoom((prev) =>
      normalizeRoomId(prev?._id) === normalizedRoomId ? updater(prev) : prev
    )
  }

  const moveRoomToTop = (roomId, updater) => {
    const normalizedRoomId = normalizeRoomId(roomId)

    setRooms((prev) => {
      const index = prev.findIndex((room) => normalizeRoomId(room._id) === normalizedRoomId)
      if (index === -1) return prev

      const next = [...prev]
      const [room] = next.splice(index, 1)
      next.unshift(updater(room))
      return next
    })

    setActiveRoom((prev) =>
      normalizeRoomId(prev?._id) === normalizedRoomId ? updater(prev) : prev
    )
  }

  const fetchRooms = async () => {
    try {
      const { data } = await API.get('/rooms')
      setRooms(data.rooms)
      if (activeRoom) {
        const updatedData = data.rooms.find(
          (room) => normalizeRoomId(room._id) === normalizeRoomId(activeRoom._id)
        )
        setActiveRoom(updatedData || null)
      }
    } catch (err) {
      toast.error('Failed to load rooms')
    } finally {
      setLoadingRooms(false)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [])

  useEffect(() => {
    if (!socket) return

    const handleKicked = ({ roomId }) => {
      const normalizedRoomId = normalizeRoomId(roomId)
      toast.error('You were removed from the room')
      setRooms((prev) => prev.filter((room) => normalizeRoomId(room._id) !== normalizedRoomId))
      setNewMessageRoomIds((prev) => prev.filter((id) => id !== normalizedRoomId))
      setActiveRoom((prev) => (normalizeRoomId(prev?._id) === normalizedRoomId ? null : prev))
    }

    const handleNewDm = ({ room }) => {
      const normalizedRoomId = normalizeRoomId(room._id)

      setRooms((prev) => {
        if (prev.find((entry) => normalizeRoomId(entry._id) === normalizedRoomId)) return prev
        toast('New Direct Message!', { icon: 'Ã°Å¸â€™Â¬' })
        return [room, ...prev]
      })

      setNewMessageRoomIds((prev) =>
        prev.includes(normalizedRoomId) ? prev : [...prev, normalizedRoomId]
      )
    }

    const handleNewRequest = () => {
      toast.success('New join request for your room!')
      fetchRooms()
    }

    const handleRequestApproved = ({ room }) => {
      const normalizedRoomId = normalizeRoomId(room._id)
      toast.success('Your join request was approved!')
      setRooms((prev) => {
        const existing = prev.find((entry) => normalizeRoomId(entry._id) === normalizedRoomId)
        if (existing) {
          return prev.map((entry) =>
            normalizeRoomId(entry._id) === normalizedRoomId ? { ...entry, ...room } : entry
          )
        }
        return [room, ...prev]
      })
    }

    const handleRoomMessage = (message) => {
      const normalizedRoomId = normalizeRoomId(message.roomId)

      moveRoomToTop(normalizedRoomId, (room) => ({
        ...room,
        lastMessage: message,
      }))

      const senderId = message.senderId?._id || message.senderId
      const isIncoming = senderId?.toString() !== user?._id?.toString()
      if (isIncoming && normalizedRoomId !== normalizeRoomId(activeRoom?._id)) {
        setNewMessageRoomIds((prev) =>
          prev.includes(normalizedRoomId) ? prev : [...prev, normalizedRoomId]
        )

        setRooms((prev) => {
          const exists = prev.some((room) => normalizeRoomId(room._id) === normalizedRoomId)
          if (!exists) {
            fetchRooms()
          }
          return prev
        })
      }
    }

    const handleDmBlocked = ({ actorUserId, targetUserId }) => {
      setRooms((prev) =>
        prev.map((room) => {
          if (room.type !== 'dm') return room
          const hasActor = room.members?.some(
            (member) => (member._id || member).toString() === actorUserId.toString()
          )
          const hasTarget = room.members?.some(
            (member) => (member._id || member).toString() === targetUserId.toString()
          )
          if (!hasActor || !hasTarget) return room

          return {
            ...room,
            members: room.members.map((member) => {
              if ((member._id || member).toString() !== actorUserId.toString()) return member
              const blockedUsers = member.blockedUsers || []
              if (
                blockedUsers.some(
                  (entry) => (entry._id || entry).toString() === targetUserId.toString()
                )
              ) {
                return member
              }
              return { ...member, blockedUsers: [...blockedUsers, targetUserId] }
            }),
          }
        })
      )

      setActiveRoom((prev) => {
        if (!prev || prev.type !== 'dm') return prev
        const hasActor = prev.members?.some(
          (member) => (member._id || member).toString() === actorUserId.toString()
        )
        const hasTarget = prev.members?.some(
          (member) => (member._id || member).toString() === targetUserId.toString()
        )
        if (!hasActor || !hasTarget) return prev

        return {
          ...prev,
          members: prev.members.map((member) => {
            if ((member._id || member).toString() !== actorUserId.toString()) return member
            const blockedUsers = member.blockedUsers || []
            if (
              blockedUsers.some(
                (entry) => (entry._id || entry).toString() === targetUserId.toString()
              )
            ) {
              return member
            }
            return { ...member, blockedUsers: [...blockedUsers, targetUserId] }
          }),
        }
      })
    }

    const handleDmUnblocked = ({ actorUserId, targetUserId }) => {
      const removeBlock = (room) => ({
        ...room,
        members: room.members.map((member) => {
          if ((member._id || member).toString() !== actorUserId.toString()) return member
          return {
            ...member,
            blockedUsers: (member.blockedUsers || []).filter(
              (entry) => (entry._id || entry).toString() !== targetUserId.toString()
            ),
          }
        }),
      })

      setRooms((prev) =>
        prev.map((room) => {
          if (room.type !== 'dm') return room
          const hasActor = room.members?.some(
            (member) => (member._id || member).toString() === actorUserId.toString()
          )
          const hasTarget = room.members?.some(
            (member) => (member._id || member).toString() === targetUserId.toString()
          )
          return hasActor && hasTarget ? removeBlock(room) : room
        })
      )

      setActiveRoom((prev) => {
        if (!prev || prev.type !== 'dm') return prev
        const hasActor = prev.members?.some(
          (member) => (member._id || member).toString() === actorUserId.toString()
        )
        const hasTarget = prev.members?.some(
          (member) => (member._id || member).toString() === targetUserId.toString()
        )
        return hasActor && hasTarget ? removeBlock(prev) : prev
      })
    }

    const handleMessageUpdated = ({ messageId, content, type, isEdited, isDeleted }) => {
      setRooms((prev) =>
        prev.map((room) => {
          if (room.lastMessage?._id !== messageId) return room
          return {
            ...room,
            lastMessage: {
              ...room.lastMessage,
              content,
              type,
              isEdited,
              isDeleted,
            },
          }
        })
      )
    }

    const handleUserKicked = ({ userId: targetUserId, roomId }) => {
      updateRoomState(roomId, (room) => ({
        ...room,
        members:
          room.members?.filter(
            (member) => (member._id || member).toString() !== targetUserId.toString()
          ) || [],
        kickedUsers: [...(room.kickedUsers || []), targetUserId],
      }))
    }

    const handleRoomDeletedEvent = ({ roomId }) => {
      const normalizedRoomId = normalizeRoomId(roomId)
      setRooms((prev) => prev.filter((room) => normalizeRoomId(room._id) !== normalizedRoomId))
      setNewMessageRoomIds((prev) => prev.filter((id) => id !== normalizedRoomId))
      setActiveRoom((prev) => (normalizeRoomId(prev?._id) === normalizedRoomId ? null : prev))
    }

    const handleRoomUpdated = ({ room }) => {
      updateRoomState(room._id, (current) => ({ ...current, ...room }))
    }

    socket.on('kicked', handleKicked)
    socket.on('new_dm', handleNewDm)
    socket.on('new_request', handleNewRequest)
    socket.on('request_approved', handleRequestApproved)
    socket.on('room_message', handleRoomMessage)
    socket.on('dm_blocked', handleDmBlocked)
    socket.on('dm_unblocked', handleDmUnblocked)
    socket.on('message_updated', handleMessageUpdated)
    socket.on('user_kicked', handleUserKicked)
    socket.on('room_deleted', handleRoomDeletedEvent)
    socket.on('room_updated', handleRoomUpdated)

    return () => {
      socket.off('kicked', handleKicked)
      socket.off('new_dm', handleNewDm)
      socket.off('new_request', handleNewRequest)
      socket.off('request_approved', handleRequestApproved)
      socket.off('room_message', handleRoomMessage)
      socket.off('dm_blocked', handleDmBlocked)
      socket.off('dm_unblocked', handleDmUnblocked)
      socket.off('message_updated', handleMessageUpdated)
      socket.off('user_kicked', handleUserKicked)
      socket.off('room_deleted', handleRoomDeletedEvent)
      socket.off('room_updated', handleRoomUpdated)
    }
  }, [socket, activeRoom?._id, user?._id])

  const handleSelectRoom = (room) => {
    const normalizedRoomId = normalizeRoomId(room._id)
    setActiveRoom(room)
    setNewMessageRoomIds((prev) => prev.filter((id) => id !== normalizedRoomId))
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  const handleRoomCreated = (newRoom) => {
    setRooms((prev) => [newRoom, ...prev])
    setActiveRoom(newRoom)
  }

  const handleRoomJoined = (room) => {
    const normalizedRoomId = normalizeRoomId(room._id)
    setRooms((prev) => {
      const exists = prev.find((entry) => normalizeRoomId(entry._id) === normalizedRoomId)
      if (exists) return prev
      return [room, ...prev]
    })
    setActiveRoom(room)
  }

  const handleRoomLeft = (roomId) => {
    const normalizedRoomId = normalizeRoomId(roomId)
    setRooms((prev) => prev.filter((room) => normalizeRoomId(room._id) !== normalizedRoomId))
    setActiveRoom((prev) => (normalizeRoomId(prev?._id) === normalizedRoomId ? null : prev))
  }

  const handleRoomDeleted = (roomId) => {
    const normalizedRoomId = normalizeRoomId(roomId)
    setRooms((prev) => prev.filter((room) => normalizeRoomId(room._id) !== normalizedRoomId))
    setNewMessageRoomIds((prev) => prev.filter((id) => id !== normalizedRoomId))
    setActiveRoom((prev) => (normalizeRoomId(prev?._id) === normalizedRoomId ? null : prev))
  }

  if (user && !user.isGuest && !user.isVerified) {
    return <VerificationOverlay />
  }

  return (
    <div className="flex-1 h-full w-full flex bg-dark-950 overflow-hidden relative">
      <div
        className={`
          ${sidebarOpen ? 'w-96 translate-x-0' : 'w-0 -translate-x-full'}
          transition-all duration-300 ease-in-out
          fixed md:relative z-30 h-full flex-shrink-0 overflow-hidden border-r border-dark-700/50 pt-[env(safe-area-inset-top)]
        `}
      >
        <Sidebar
          rooms={rooms}
          activeRoom={activeRoom}
          newMessageRoomIds={newMessageRoomIds}
          loadingRooms={loadingRooms}
          onSelectRoom={handleSelectRoom}
          onRoomCreated={handleRoomCreated}
          onRoomJoined={handleRoomJoined}
          onCloseSidebar={() => setSidebarOpen(false)}
        />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <ChatArea
          room={activeRoom}
          sidebarOpen={sidebarOpen}
          onOpenSidebar={() => setSidebarOpen((prev) => !prev)}
          onRoomLeft={handleRoomLeft}
          onRoomDeleted={handleRoomDeleted}
          onRefreshRooms={fetchRooms}
        />
      </div>
    </div>
  )
}

export default ChatDashboard
