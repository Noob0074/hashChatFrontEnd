import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'

const ConfirmModal = ({ title, message, onConfirm, onClose, danger = false }) => {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
      onClose()
    } catch (err) {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target.classList.contains('modal-overlay')) onClose()
    }}>
      <div className="modal-content max-w-sm mx-auto my-auto place-self-center">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            {danger && (
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
            )}
            <h2 className="text-xl font-bold text-white">{title}</h2>
          </div>
          <button onClick={onClose} className="text-dark-400 hover:text-white mt-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-dark-300">
            {message}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 ${danger ? 'btn-danger' : 'btn-primary'}`}
            disabled={loading}
          >
            {loading ? 'Wait...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
