import { useState, useRef } from 'react'
import { Camera, Save, Image as ImageIcon } from 'lucide-react'
import API from '../../api/axios'
import toast from 'react-hot-toast'
import { useConfig } from '../../context/ConfigContext'
import { compressImage } from '../../utils/imageUtils'

const AdminSettings = ({ room, onUpdate }) => {
  const { config, validateFile, handleKeyRestriction } = useConfig()
  const [name, setName] = useState(room.name || '')
  const [roomPic, setRoomPic] = useState(room.roomPic || '')
  const [previewFile, setPreviewFile] = useState(null)
  const [fileToUpload, setFileToUpload] = useState(null)
  const [loading, setLoading] = useState(false)
  
  const fileRef = useRef(null)

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return
    
    const { valid, error } = validateFile(selectedFile, 'avatar') // Room pics use avatar limits
    if (!valid) {
      toast.error(error)
      return
    }

    // Compress image before setting for upload
    // Room avatars are small, like profile pics
    compressImage(selectedFile, { maxWidth: 512, maxHeight: 512, quality: 0.8 }).then((compressedFile) => {
      setFileToUpload(compressedFile)
      const reader = new FileReader()
      reader.onload = (ev) => setPreviewFile(ev.target.result)
      reader.readAsDataURL(compressedFile)
    })
  }

  const uploadToCloudinary = async () => {
    try {
      const { data: uploadData } = await API.post('/files/upload-url', {
        folder: 'anonchat/rooms',
      })
      const formData = new FormData()
      formData.append('file', fileToUpload)
      formData.append('api_key', uploadData.apiKey)
      formData.append('timestamp', uploadData.timestamp)
      formData.append('signature', uploadData.signature)
      formData.append('folder', uploadData.folder)

      const response = await fetch(uploadData.uploadUrl, {
        method: 'POST',
        body: formData,
      })
      const result = await response.json()
      return result.secure_url
    } catch (err) {
      toast.error('Cloudinary API not configured. Photo not saved.')
      return null
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim() || name.length < 2) {
      toast.error('Room name must be at least 2 characters')
      return
    }

    setLoading(true)
    try {
      let finalPicUrl = roomPic
      
      if (fileToUpload) {
        toast('Uploading room photo...', { icon: '⏳' })
        const url = await uploadToCloudinary()
        if (url) finalPicUrl = url
      }

      const { data } = await API.put(`/rooms/${room._id}`, {
        name: name,
        roomPic: finalPicUrl,
      })

      setRoomPic(data.room.roomPic)
      setFileToUpload(null)
      setPreviewFile(null)
      toast.success('Room settings updated')
      if (onUpdate) onUpdate(data.room)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update room')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Room Picture */}
        <div className="flex flex-col items-center">
          <div 
            className="w-24 h-24 rounded-2xl bg-dark-800 border-2 border-dark-600 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary-500 transition-colors group relative"
            onClick={() => fileRef.current?.click()}
          >
            {previewFile ? (
              <img src={previewFile} alt="Preview" className="w-full h-full object-cover" />
            ) : roomPic ? (
              <img src={roomPic} alt="Room" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-dark-500 group-hover:text-primary-400 transition-colors">
                <ImageIcon className="w-8 h-8 mb-1" />
                <span className="text-[10px] uppercase font-bold tracking-wider">Upload</span>
              </div>
            )}
            
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <input
            type="file"
            ref={fileRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
          />
          <p className="text-[10px] text-dark-500 mt-2 uppercase font-bold tracking-widest">Room Avatar</p>
          {config?.limits?.avatarSize && (
            <p className="text-[9px] text-dark-600 mt-1 uppercase font-bold tracking-widest">
              Max: {Math.max(1, Math.round(config.limits.avatarSize / (1024 * 1024)))}MB
            </p>
          )}
        </div>

        {/* Room Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-dark-400 uppercase tracking-wider">
            Room Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={(e) => handleKeyRestriction(e, 'roomName')}
            className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
            placeholder="Enter room name"
            minLength={2}
            maxLength={50}
            required
          />
          <p className="text-[10px] text-dark-500 mt-1 uppercase font-bold tracking-wider ml-1">Alphabets, numbers, underscores, dots only</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-800 text-white rounded-xl font-bold text-sm shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </form>
    </div>
  )
}

export default AdminSettings
