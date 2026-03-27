import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import { ArrowUp } from 'lucide-react'

const MessageList = ({ messages, loading, hasMore, onLoadMore, onEditMessage, onDeleteMessage, isAdmin }) => {
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
 
       {messages.map((msg) => (
         <MessageBubble 
           key={msg._id} 
           message={msg} 
           onEdit={() => onEditMessage(msg)}
           onDelete={() => onDeleteMessage(msg._id)}
           isAdmin={isAdmin}
         />
       ))}

      <div ref={bottomRef} />
    </div>
  )
}

export default MessageList
