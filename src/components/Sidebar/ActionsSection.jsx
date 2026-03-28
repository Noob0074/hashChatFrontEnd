import { Plus, DoorOpen } from 'lucide-react'

const ActionsSection = ({ onCreateRoom, onJoinRoom }) => {
  return (
    <div className="px-4 py-3 border-b border-dark-700/50">
      <div className="grid grid-cols-2 gap-2">
      <button
        onClick={onCreateRoom}
        className="btn-primary text-sm py-3 flex items-center justify-center gap-2"
        id="create-room-btn"
      >
        <Plus className="w-4 h-4" />
        Create Room
      </button>
      <button
        onClick={onJoinRoom}
        className="btn-secondary text-sm py-3 flex items-center justify-center gap-2 text-center leading-tight"
        id="join-room-btn"
      >
        <DoorOpen className="w-4 h-4" />
        Join Private Room
      </button>
      </div>
    </div>
  )
}

export default ActionsSection
