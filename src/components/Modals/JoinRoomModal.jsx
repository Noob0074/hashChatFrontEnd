import { useState } from 'react'
import { X } from 'lucide-react'
import API from '../../api/axios'
import toast from 'react-hot-toast'

const JoinRoomModal = ({ onClose, onJoined }) => {
  const [roomId, setRoomId] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!roomId.trim()) return

    setLoading(true)
    try {
      const { data } = await API.post(`/rooms/${roomId}/join`)
      toast.success(data.message)
      if (data.room) {
        onJoined(data.room)
      }
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to join room')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target.classList.contains('modal-overlay')) onClose()
    }}>
      <div className="modal-content">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Join Private Room</h2>
          <button onClick={onClose} className="text-dark-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-dark-300 mb-1">
              Room ID
            </label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.trim())}
              className="input-field"
              placeholder="Paste room ID here"
              required
            />
            <p className="text-xs text-dark-500 mt-2">
              Ask the room creator for the Room ID.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !roomId.trim()}
            className="btn-primary w-full"
          >
            {loading ? 'Joining...' : 'Join Private Room'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default JoinRoomModal
