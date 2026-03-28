import { lazy, Suspense, useState, useEffect, useRef } from 'react'
import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import TypingIndicator from './TypingIndicator'
import { useSocket } from '../../context/SocketContext'
import { useAuth } from '../../context/AuthContext'
import API from '../../api/axios'
import toast from 'react-hot-toast'
import { Hash, Menu } from 'lucide-react'

const AdminPanel = lazy(() => import('../Admin/AdminPanel'))
const normalizeId = (value) => value?.toString?.() || value

const ChatArea = ({
  room,
  sidebarOpen,
  onOpenSidebar,
  onRoomLeft,
  onRoomDeleted,
  onRefreshRooms,
}) => {
  const { socket, joinRoom, leaveRoom } = useSocket()
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [cursor, setCursor] = useState(null)
  const [typingUsers, setTypingUsers] = useState([])
  const [showRoomInfo, setShowRoomInfo] = useState(false)
  const [editingMessage, setEditingMessage] = useState(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [searchHasMore, setSearchHasMore] = useState(false)
  const [searchCursor, setSearchCursor] = useState(null)
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1)
  const [activeSearchMessageId, setActiveSearchMessageId] = useState(null)
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
    setSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
    setSearchLoading(false)
    setSearchPerformed(false)
    setSearchHasMore(false)
    setSearchCursor(null)
    setActiveSearchIndex(-1)
    setActiveSearchMessageId(null)
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

  const jumpToSearchResult = async (result, index) => {
    if (!room || !result?._id) return

    const targetId = normalizeId(result._id)
    setActiveSearchIndex(index)
    setActiveSearchMessageId(targetId)

    const alreadyLoaded = messages.some((message) => normalizeId(message._id) === targetId)
    if (alreadyLoaded) {
      return
    }

    try {
      const { data } = await API.get(`/messages/${room._id}/context/${targetId}`)
      setMessages(data.messages)
      setHasMore(data.hasMoreBefore)
      setCursor(data.cursor)
      setActiveSearchMessageId(normalizeId(data.targetMessageId))
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load message context')
    }
  }

  const performSearch = async (cursorOverride = null, append = false) => {
    if (!room) return

    const trimmedQuery = searchQuery.trim()
    if (!trimmedQuery) {
      setSearchResults([])
      setSearchPerformed(false)
      setSearchHasMore(false)
      setSearchCursor(null)
      setActiveSearchIndex(-1)
      setActiveSearchMessageId(null)
      return
    }

    if (trimmedQuery.length < 1) {
      toast.error('Search query is required')
      return
    }

    setSearchLoading(true)
    setSearchPerformed(true)
    try {
      let url = `/messages/${room._id}/search?q=${encodeURIComponent(trimmedQuery)}&limit=20`
      if (cursorOverride) {
        url += `&cursor=${encodeURIComponent(cursorOverride)}`
      }

      const { data } = await API.get(url)
      const nextResults = append ? [...searchResults, ...data.results] : data.results

      setSearchResults(nextResults)
      setSearchHasMore(data.hasMore)
      setSearchCursor(data.cursor)

      if (!append) {
        if (data.results.length > 0) {
          jumpToSearchResult(data.results[0], 0)
        } else {
          setActiveSearchIndex(-1)
          setActiveSearchMessageId(null)
        }
      }

      return { results: nextResults, newlyLoadedResults: data.results }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to search messages')
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSearchSubmit = (event) => {
    event?.preventDefault?.()
    performSearch()
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setSearchPerformed(false)
    setSearchHasMore(false)
    setSearchCursor(null)
    setActiveSearchIndex(-1)
    setActiveSearchMessageId(null)
  }

  const toggleSearch = () => {
    setSearchOpen((prev) => {
      const next = !prev
      if (!next) {
        handleClearSearch()
      }
      return next
    })
  }

  const handlePrevSearchResult = () => {
    if (searchResults.length === 0) return
    const nextIndex =
      activeSearchIndex <= 0 ? searchResults.length - 1 : activeSearchIndex - 1
    jumpToSearchResult(searchResults[nextIndex], nextIndex)
  }

  const handleNextSearchResult = () => {
    if (searchResults.length === 0) return

    if (activeSearchIndex >= searchResults.length - 1 && searchHasMore && !searchLoading) {
      performSearch(searchCursor, true).then((data) => {
        if (data?.newlyLoadedResults?.length) {
          jumpToSearchResult(data.newlyLoadedResults[0], searchResults.length)
        }
      })
      return
    }

    const nextIndex =
      activeSearchIndex >= searchResults.length - 1 ? 0 : activeSearchIndex + 1
    jumpToSearchResult(searchResults[nextIndex], nextIndex)
  }

  // Empty state
  if (!room) {
    return (
      <div className="relative h-full flex flex-col items-center justify-center bg-dark-950">
        {!sidebarOpen && (
          <button
            onClick={onOpenSidebar}
            className="absolute left-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-dark-700 bg-dark-900/90 text-dark-200 transition-colors hover:bg-dark-800 hover:text-white"
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
        )}

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
        </div>
      </div>
    )
  }

  const isAdmin = room?.type !== 'dm' && (room?.createdBy?._id || room?.createdBy) === user?._id

  return (
    <div className="h-full flex flex-col bg-dark-950 overflow-hidden pt-[env(safe-area-inset-top)]">
      <ChatHeader
        room={room}
        isAdmin={isAdmin}
        onOpenSidebar={onOpenSidebar}
        onToggleAdmin={() => setShowRoomInfo(!showRoomInfo)}
        onRoomLeft={onRoomLeft}
        onRoomDeleted={onRoomDeleted}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        onClearSearch={handleClearSearch}
        searchOpen={searchOpen}
        onToggleSearch={toggleSearch}
        searchResultsCount={searchResults.length}
        activeSearchIndex={activeSearchIndex >= 0 ? activeSearchIndex : 0}
        onPrevSearchResult={handlePrevSearchResult}
        onNextSearchResult={handleNextSearchResult}
        searchLoading={searchLoading}
        searchPerformed={searchPerformed}
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
            searchQuery={searchQuery}
            activeSearchMessageId={activeSearchMessageId}
          />

          <TypingIndicator users={typingUsers} />

          <ChatInput 
            room={room} 
            editingMessage={editingMessage} 
            setEditingMessage={setEditingMessage} 
          />
        </div>

        {showRoomInfo && room.type !== 'dm' && (
          <Suspense
            fallback={
              <div className="hidden lg:flex w-80 flex-shrink-0 items-center justify-center border-l border-dark-700/50 bg-dark-900/40">
                <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
              </div>
            }
          >
            <AdminPanel
              room={room}
              onClose={() => setShowRoomInfo(false)}
              onRefresh={onRefreshRooms}
              isAdmin={isAdmin}
            />
          </Suspense>
        )}
      </div>
    </div>
  )
}

export default ChatArea
