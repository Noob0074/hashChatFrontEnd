import { Plus, DoorOpen } from 'lucide-react'

const ActionsSection = ({ onCreateRoom, onJoinRoom }) => {
  return (
    <div className="px-4 py-3 border-b border-dark-700/50 flex gap-2">
      <button
        onClick={onCreateRoom}
        className="flex-1 btn-primary text-sm py-2 flex items-center justify-center gap-1.5"
        id="create-room-btn"
      >
        <Plus className="w-4 h-4" />
        Create Room
      </button>
      <button
        onClick={onJoinRoom}
        className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center gap-1.5"
        id="join-room-btn"
      >
        <DoorOpen className="w-4 h-4" />
        Join Room
      </button>
    </div>
  )
}

export default ActionsSection
