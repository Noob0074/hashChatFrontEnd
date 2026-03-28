import { memo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Download, FileText, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import API from '../../api/axios'
import toast from 'react-hot-toast'
import ConfirmModal from '../Modals/ConfirmModal'

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const MessageBubble = ({ message, onEdit, onDelete, isAdmin, searchQuery, isActiveSearchResult }) => {
  const { user } = useAuth()
  const [showActions, setShowActions] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const isMine = (message.senderId?._id || message.senderId)?.toString() === user?._id?.toString()
  const senderName = message.senderId?.isDeleted
    ? 'Deleted User'
    : message.senderId?.username || 'Unknown'

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  const handleDelete = async () => {
    try {
      await API.delete(`/messages/${message._id}`)
      if (onDelete) onDelete(message._id)
    } catch (err) {
      toast.error('Failed to delete message')
      throw err 
    }
  }

  const isDeleted = message.isDeleted;
  const showActionsButton = (isMine || isAdmin) && !isDeleted;

  const renderHighlightedText = (content) => {
    const trimmedQuery = searchQuery?.trim()
    if (!trimmedQuery || message.type !== 'text') {
      return content
    }

    const parts = content.split(new RegExp(`(${escapeRegExp(trimmedQuery)})`, 'ig'))

    return parts.map((part, index) => {
      const isMatch = part.toLowerCase() === trimmedQuery.toLowerCase()
      if (!isMatch) {
        return <span key={index}>{part}</span>
      }

      return (
        <mark
          key={index}
          className={`rounded px-1 py-0.5 ${
            isActiveSearchResult ? 'bg-amber-300 text-dark-950' : 'bg-amber-200/80 text-dark-950'
          }`}
        >
          {part}
        </mark>
      )
    })
  }

  const renderActionsMenu = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" 
        onClick={() => setShowActions(false)} 
      />
      
      {/* Menu Content */}
      <div className="relative w-full max-w-[200px] bg-dark-800 border border-dark-700/50 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10 animate-scale-in">
        <div className="px-4 py-3 border-b border-dark-700/50 bg-dark-900/50">
          <p className="text-[10px] uppercase font-bold text-dark-400 tracking-widest text-center">Message Actions</p>
        </div>
        
        <div className="p-1">
          {isMine && !isDeleted && message.type === 'text' && (
            <button 
              onClick={() => { onEdit(); setShowActions(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-dark-100 hover:bg-primary-500/10 hover:text-primary-400 rounded-xl transition-all"
            >
              <Pencil className="w-4 h-4" />
              <span className="font-medium">Edit Message</span>
            </button>
          )}
          <button 
            onClick={() => { setShowDeleteConfirm(true); setShowActions(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span className="font-medium text-red-400">Delete Message</span>
          </button>
        </div>
        
        <button 
          onClick={() => setShowActions(false)}
          className="w-full py-3 text-xs font-bold text-dark-500 hover:text-dark-200 bg-dark-800/50 border-t border-dark-700/50 uppercase tracking-widest transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )

  const actionButton = (
    <div
      className={`absolute top-2 ${isMine ? '-left-8 sm:-left-10' : '-right-8 sm:-right-10'} z-10 flex justify-center transition-opacity ${
        showActionsButton ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <button
        onClick={(e) => { e.stopPropagation(); setShowActions(!showActions); }}
        className="p-1.5 rounded-lg text-dark-600 hover:text-dark-300 hover:bg-dark-800 transition-all"
        title={isMine ? 'Message Actions' : 'Moderate Message'}
        disabled={!showActionsButton}
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {showActions && renderActionsMenu()}
    </div>
  )

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} items-start px-0.5 sm:px-2 py-1 animate-slide-up`}>
      <div className={`max-w-[94%] sm:max-w-[88%] md:max-w-[72%] min-w-0 flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        {!isMine && (
          <p className="text-[11px] text-dark-500 mb-1 ml-3 font-medium">
            {senderName}
          </p>
        )}

        <div className="relative group w-fit max-w-full">
          {actionButton}
          <div className={`px-4 py-2.5 w-fit max-w-full rounded-2xl ${isMine ? 'msg-sent' : 'msg-received'} ${isDeleted ? 'opacity-70 !bg-dark-800 !text-white/80 italic border border-dark-700 font-medium' : ''} ${isActiveSearchResult ? 'ring-2 ring-amber-300/80 ring-offset-2 ring-offset-dark-950' : ''}`}>
            {isDeleted ? (
              <p className="text-sm flex items-center gap-2">
                <Trash2 className="w-3 h-3" />
                Message has been deleted
              </p>
            ) : (
              <>
                {message.type === 'text' && (
                  <p className="text-sm leading-relaxed break-all break-words whitespace-pre-wrap">
                    {renderHighlightedText(message.content)}
                  </p>
                )}

                {message.type === 'image' && (
                  <div className="relative group">
                    <img
                      src={message.content}
                      alt={message.fileName || 'Image'}
                      className="max-w-full rounded-lg max-h-64 object-cover cursor-pointer border border-white/10"
                      onClick={() => window.open(message.content, '_blank')}
                      loading="lazy"
                    />
                    <a 
                      href={message.content.includes('?s=') || message.content.includes('/s--') 
                        ? message.content 
                        : message.content.replace('/upload/', '/upload/fl_attachment/')}
                      download={message.fileName || 'image.jpg'}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                      title="Download"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    {message.fileName && (
                      <p className="text-[10px] opacity-70 mt-1 truncate max-w-[200px]">{message.fileName}</p>
                    )}
                  </div>
                )}

                {message.type === 'file' && (
                  <a
                    href={message.content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 ${
                      isMine ? 'text-white/90 hover:text-white' : 'text-dark-200 hover:text-white'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isMine ? 'bg-white/10' : 'bg-dark-700'
                    }`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {message.fileName || 'File'}
                      </p>
                      <p className="text-[10px] opacity-60">Click to download</p>
                    </div>
                    <Download className="w-4 h-4 flex-shrink-0 opacity-60" />
                  </a>
                )}
              </>
            )}
          </div>
        </div>

        <div className={`flex items-center gap-2 mt-1 ${isMine ? 'justify-end mr-3' : 'justify-start ml-3'}`}>
          {message.isEdited && (
            <span className="text-[9px] text-dark-600 font-bold uppercase tracking-tighter italic">
              (edited)
            </span>
          )}
          <p className="text-[10px] text-dark-600">
            {time}
          </p>
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Message?"
          message="Once deleted, this message will be gone forever for everyone in the room."
          danger={true}
          onConfirm={handleDelete}
          onClose={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  )
}

export default memo(MessageBubble)
