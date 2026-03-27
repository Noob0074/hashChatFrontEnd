import { useState, useRef, useEffect } from 'react'
import { Plus, Send, Image as ImageIcon, X, Smile, Paperclip, FileText, Pencil, Save } from 'lucide-react'
import { useSocket } from '../../context/SocketContext'
import { useConfig } from '../../context/ConfigContext'
import { useAuth } from '../../context/AuthContext'
import API from '../../api/axios'
import toast from 'react-hot-toast'
import { compressImage } from '../../utils/imageUtils'

const ChatInput = ({ room, editingMessage, setEditingMessage }) => {
  const { user } = useAuth()
  const { sendMessage, startTyping, stopTyping } = useSocket()
  const { config, validateFile } = useConfig()
  
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  
  const fileRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  // Handle Edit Mode: Load message content into input
  useEffect(() => {
    if (editingMessage && editingMessage.type === 'text') {
      setText(editingMessage.content)
      // Focus the input
      document.getElementById('message-input')?.focus()
    } else {
      setText('')
    }
  }, [editingMessage])

  // Typing indicators
  const handleTyping = (e) => {
    setText(e.target.value)
    
    if (!room) return
    startTyping(room._id)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(room._id)
    }, 2000)
  }

  // File selection
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    // Centralized validation from ConfigContext
    const { valid, error } = validateFile(selectedFile, 'media')
    if (!valid) {
      toast.error(error)
      return
    }

    // Compress image before setting for preview/upload
    if (selectedFile.type.startsWith('image/')) {
      compressImage(selectedFile).then((compressedFile) => {
        setFile(compressedFile)
        const reader = new FileReader()
        reader.onload = (ev) => setFilePreview(ev.target.result)
        reader.readAsDataURL(compressedFile)
      })
    } else {
      setFile(selectedFile)
      setFilePreview(null)
    }
  }

  const clearFile = () => {
    setFile(null)
    setFilePreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const uploadFile = async () => {
    if (!file) return null

    try {
      setUploading(true)

      // Get Cloudinary upload URL (folder specific)
      const { data: uploadData } = await API.post('/files/upload-url', {
        folder: 'hashchat/media',
      })

      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', uploadData.apiKey)
      formData.append('timestamp', uploadData.timestamp)
      formData.append('signature', uploadData.signature)
      formData.append('folder', uploadData.folder)

      const response = await fetch(uploadData.uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        console.error("Cloudinary upload error:", errData);
        throw new Error(errData.error?.message || "Cloudinary upload failed");
      }

      const result = await response.json();
      console.log("Upload result:", result);

      return {
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type, // added
        type: file.type.startsWith('image/') ? 'image' : 'file',
        fileName: file.name,
      }
    } catch (err) {
      console.error('File upload error detailed:', err);
      toast.error(`File upload failed: ${err.message || 'Settings missing'}`);
      return null;
    } finally {
      setUploading(false)
    }
  }

  const handleSend = async (e) => {
    if (e) e.preventDefault()
    if (!text.trim() && !file) return
    if (!room) return

    const currentText = text.trim()
    const currentFile = file
    const msgId = editingMessage?._id
    
    // Handle Edit
    if (msgId) {
      try {
        setUploading(true) // Reuse uploading state to disable buttons
        await API.put(`/messages/${msgId}`, { content: currentText })
        setEditingMessage(null)
        setText('')
        clearFile()
      } catch (err) {
        toast.error('Failed to update message')
      } finally {
        setUploading(false)
      }
      return
    }

    // Handle standard send...
    setUploading(true)
    try {
      // Handle file upload if present
      if (currentFile) {
        const uploaded = await uploadFile()
        if (uploaded) {
          sendMessage({
            roomId: room._id,
            content: uploaded.url,
            publicId: uploaded.publicId,
            resourceType: uploaded.resourceType,
            type: uploaded.type,
            fileName: uploaded.fileName,
          })
        }
        // If we only sent a file, stop here
        if (!currentText) {
          clearFile()
          setUploading(false)
          return
        }
      }

      // Send text message
      if (currentText) {
        sendMessage({
          roomId: room._id,
          content: currentText,
          type: 'text',
        })
        setText('')
        clearFile()
      }
    } catch (err) {
      toast.error('Failed to send message')
    } finally {
      setUploading(false)
      stopTyping(room._id)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Permission checks
  let isDeletedUser = false
  let amIBlocked = false

  if (room?.type === 'dm' && room.members) {
    const otherMember = room.members.find((m) => (m._id || m) !== user?._id)
    if (otherMember?.isDeleted) isDeletedUser = true
    if (otherMember?.blockedUsers?.some(u => (u._id || u).toString() === user?._id)) amIBlocked = true
  }

  const amIKicked = room?.kickedUsers?.some(u => (u._id || u).toString() === user?._id)
  const amIBanned = room?.bannedUsers?.some(u => (u._id || u).toString() === user?._id)

  const renderDisabled = (message) => (
    <div className="border-t border-dark-700/50 bg-dark-900/60 backdrop-blur-xl p-4 flex justify-center text-dark-500 text-sm italic">
      {message}
    </div>
  )

  if (amIBanned) return renderDisabled("You are banned from this room.")
  if (amIKicked) return renderDisabled("You have been removed from this room.")
  if (isDeletedUser) return renderDisabled("This user's account has been deleted.")
  if (amIBlocked) return renderDisabled("You cannot message this user.")

  return (
    <div className={`border-t border-dark-700/50 bg-dark-900/60 backdrop-blur-xl p-4 transition-all ${editingMessage ? 'border-t-primary-500/50 bg-primary-500/5' : ''}`}>
      {/* Edit Mode Header */}
      {editingMessage && (
        <div className="flex items-center justify-between mb-3 px-1 animate-fade-in">
          <div className="flex items-center gap-2 text-primary-400">
            <Pencil className="w-3 h-3" />
            <span className="text-[10px] uppercase font-bold tracking-widest">Editing Message</span>
          </div>
          <button 
            onClick={() => setEditingMessage(null)}
            className="text-[10px] uppercase font-bold text-dark-500 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
      {/* File preview */}
      {file && (
        <div className="flex items-center gap-3 mb-3 p-3 bg-dark-800 rounded-xl animate-slide-up border border-dark-700">
          {filePreview ? (
            <img src={filePreview} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-dark-700 flex items-center justify-center">
              <FileText className="w-5 h-5 text-dark-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-dark-200 truncate font-medium">{file.name}</p>
            <p className="text-[10px] text-dark-500 uppercase tracking-wider font-bold">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button onClick={clearFile} className="p-1.5 rounded-lg hover:bg-dark-700 text-dark-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-center gap-2">
        {/* File button */}
        <button
          onClick={() => fileRef.current?.click()}
          className="p-2.5 rounded-xl text-dark-500 hover:text-dark-200 hover:bg-dark-800 transition-colors flex-shrink-0"
          title="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Text input */}
        <div className="flex-1">
          <textarea
            value={text}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            className="input-field py-2.5 text-sm resize-none max-h-32 min-h-[44px] break-all"
            placeholder="Type a message..."
            rows={1}
            id="message-input"
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={(!text.trim() && !file) || uploading}
          className={`p-2.5 rounded-xl transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg ${
            editingMessage 
              ? 'bg-primary-600 text-white hover:bg-primary-500 shadow-primary-500/20' 
              : 'bg-primary-600 text-white hover:bg-primary-500 shadow-primary-500/20'
          }`}
          id="send-btn"
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : editingMessage ? (
            <Save className="w-5 h-5" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  )
}

export default ChatInput
