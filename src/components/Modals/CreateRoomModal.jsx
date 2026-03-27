import { useState } from 'react'
import { X, Shield } from 'lucide-react'
import API from '../../api/axios'
import toast from 'react-hot-toast'

const CreateRoomModal = ({ onClose, onCreated }) => {
  const [name, setName] = useState('')
  const [type, setType] = useState('public')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      const { data } = await API.post('/rooms', { name, type })
      toast.success('Room created successfully!')
      onCreated(data.room)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create room')
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
          <h2 className="text-xl font-bold text-white">Create Room</h2>
          <button onClick={onClose} className="text-dark-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-dark-300 mb-1">
              Room Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="e.g. Chill Lounge"
              maxLength={50}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-dark-300 mb-3">
              Room Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`cursor-pointer rounded-xl border p-4 flex flex-col items-center justify-center gap-2 transition-all ${
                type === 'public'
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                  : 'bg-dark-800 border-dark-600 text-dark-400 hover:border-dark-500'
              }`}>
                <input
                  type="radio"
                  name="type"
                  value="public"
                  checked={type === 'public'}
                  onChange={() => setType('public')}
                  className="hidden"
                />
                <span className="font-semibold text-sm">Public</span>
                <span className="text-xs text-center opacity-80">
                  Anyone can join
                </span>
              </label>

              <label className={`cursor-pointer rounded-xl border p-4 flex flex-col items-center justify-center gap-2 transition-all ${
                type === 'private'
                  ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                  : 'bg-dark-800 border-dark-600 text-dark-400 hover:border-dark-500'
              }`}>
                <input
                  type="radio"
                  name="type"
                  value="private"
                  checked={type === 'private'}
                  onChange={() => setType('private')}
                  className="hidden"
                />
                <Shield className="w-4 h-4 mb-0.5" />
                <span className="font-semibold text-sm leading-none">Private</span>
                <span className="text-xs text-center opacity-80">
                  Requires approval
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="btn-primary w-full"
          >
            {loading ? 'Creating...' : 'Create Room'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default CreateRoomModal
