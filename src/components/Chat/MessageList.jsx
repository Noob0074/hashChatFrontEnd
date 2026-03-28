import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import { ArrowUp } from 'lucide-react'

const getDayKey = (dateString) => {
  const date = new Date(dateString)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

const formatDayLabel = (dateString) => {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (getDayKey(dateString) === getDayKey(today)) {
    return 'Today'
  }

  if (getDayKey(dateString) === getDayKey(yesterday)) {
    return 'Yesterday'
  }

  return date.toLocaleDateString([], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const normalizeId = (value) => value?.toString?.() || value

const MessageList = ({
  messages,
  loading,
  hasMore,
  onLoadMore,
  onEditMessage,
  onDeleteMessage,
  isAdmin,
  searchQuery,
  activeSearchMessageId,
}) => {
   const bottomRef = useRef(null)
   const containerRef = useRef(null)
   const prevLengthRef = useRef(0)
 
   // Auto-scroll to bottom on new messages
   useEffect(() => {
     if (messages.length > prevLengthRef.current) {
       bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
     }
     prevLengthRef.current = messages.length
   }, [messages.length])

   useEffect(() => {
     if (!activeSearchMessageId || !containerRef.current) return

     const target = containerRef.current.querySelector(
       `[data-message-id="${CSS.escape(normalizeId(activeSearchMessageId))}"]`
     )
     target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
   }, [activeSearchMessageId, messages])
 
   return (
     <div ref={containerRef} className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 space-y-1">
       {/* Load more */}
       {hasMore && (
         <div className="text-center py-2">
           <button
             onClick={onLoadMore}
             disabled={loading}
             className="btn-ghost text-xs flex items-center gap-1 mx-auto"
           >
             <ArrowUp className="w-3 h-3" />
             {loading ? 'Loading...' : 'Load older messages'}
           </button>
         </div>
       )}
 
       {loading && messages.length === 0 && (
         <div className="flex items-center justify-center py-10">
           <div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
         </div>
       )}
 
       {!loading && messages.length === 0 && (
         <div className="flex items-center justify-center py-10">
           <p className="text-dark-600 text-sm">No messages yet. Say something!</p>
         </div>
       )}
 
       {messages.map((msg, index) => {
         const showDayDivider =
           index === 0 || getDayKey(messages[index - 1].createdAt) !== getDayKey(msg.createdAt)
         const isActiveSearchResult =
           normalizeId(msg._id) === normalizeId(activeSearchMessageId)

         return (
           <div key={msg._id} data-message-id={normalizeId(msg._id)}>
             {showDayDivider && (
               <div className="flex items-center justify-center py-3">
                 <div className="px-3 py-1 rounded-full bg-dark-800/80 border border-dark-700/60 text-[11px] font-medium text-dark-300">
                   {formatDayLabel(msg.createdAt)}
                 </div>
               </div>
             )}
             <MessageBubble 
               message={msg} 
               onEdit={() => onEditMessage(msg)}
               onDelete={() => onDeleteMessage(msg._id)}
               isAdmin={isAdmin}
               searchQuery={searchQuery}
               isActiveSearchResult={isActiveSearchResult}
             />
           </div>
         )
       })}

      <div ref={bottomRef} />
    </div>
  )
}

export default MessageList
