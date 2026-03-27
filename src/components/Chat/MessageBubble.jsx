import { useAuth } from '../../context/AuthContext'
import { Download, FileText, Image as ImageIcon, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import API from '../../api/axios'
import toast from 'react-hot-toast'
import ConfirmModal from '../Modals/ConfirmModal'

const MessageBubble = ({ message, onEdit, onDelete, isAdmin }) => {
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

  const renderActionsMenu = () => (
    <div className={`absolute top-full ${isMine ? 'right-0' : 'left-0'} mt-1 w-32 bg-dark-800 border border-dark-700 rounded-xl shadow-2xl z-20 overflow-hidden animate-fade-in ring-1 ring-white/5`}>
      {isMine && !isDeleted && message.type === 'text' && (
        <button 
          onClick={() => { onEdit(); setShowActions(false); }}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-dark-200 hover:bg-dark-700 transition-colors"
        >
          <Pencil className="w-3 h-3 text-primary-500" />
          Edit
        </button>
      )}
      <button 
        onClick={() => { setShowDeleteConfirm(true); setShowActions(false); }}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 transition-colors"
      >
        <Trash2 className="w-3 h-3" />
        Delete
      </button>
    </div>
  )

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} items-start gap-1 p-1 animate-slide-up group`}>
      {/* Actions (Dots) - Show on left for mine */}
      {(showActionsButton && isMine) && (
        <div className="relative self-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowActions(!showActions); }}
            className="p-1.5 rounded-lg text-dark-600 hover:text-dark-300 hover:bg-dark-800 transition-all"
            title="Message Actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {showActions && renderActionsMenu()}
        </div>
      )}

      <div className={`max-w-[75%] md:max-w-[60%] flex flex-col w-fit ${isMine ? 'items-end' : 'items-start'} ${isMine ? 'self-end' : 'self-start'}`}>
        {/* Sender name */}
        {!isMine && (
          <p className="text-[11px] text-dark-500 mb-1 ml-3 font-medium">
            {senderName}
          </p>
        )}

        {/* Bubble */}
        <div className={`px-4 py-2.5 w-fit rounded-2xl ${isMine ? 'msg-sent' : 'msg-received'} ${isDeleted ? 'opacity-70 !bg-dark-800 !text-white/80 italic border border-dark-700 font-medium' : ''}`}>
          {isDeleted ? (
            <p className="text-sm flex items-center gap-2">
              <Trash2 className="w-3 h-3" />
              Message has been deleted
            </p>
          ) : (
            <>
              {message.type === 'text' && (
                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                  {message.content}
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

        {/* Timestamp & Edited status */}
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

      {/* Actions (Dots) - Show on right for others (if admin) */}
      {(showActionsButton && !isMine) && (
        <div className="relative self-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowActions(!showActions); }}
            className="p-1.5 rounded-lg text-dark-600 hover:text-dark-300 hover:bg-dark-800 transition-all"
            title="Moderate Message"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {showActions && renderActionsMenu()}
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
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

export default MessageBubble
