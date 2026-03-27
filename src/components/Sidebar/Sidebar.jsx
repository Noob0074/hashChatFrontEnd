import { useState } from 'react'
import UserInfo from './UserInfo'
import SearchSection from './SearchSection'
import ActionsSection from './ActionsSection'
import RoomsList from './RoomsList'
import CreateRoomModal from '../Modals/CreateRoomModal'
import JoinRoomModal from '../Modals/JoinRoomModal'
import { X, Hash } from 'lucide-react'

const Sidebar = ({
  rooms,
  activeRoom,
  loadingRooms,
  onSelectRoom,
  onRoomCreated,
  onRoomJoined,
  onCloseSidebar,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)

  return (
    <div className="h-full flex flex-col bg-dark-900/95 backdrop-blur-xl border-r border-dark-700/50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-dark-700/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Hash className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-extrabold bg-gradient-to-r from-primary-400 via-purple-400 to-primary-400 bg-clip-text text-transparent tracking-tight">
            Hashchat
          </h2>
        </div>
        <button
          onClick={onCloseSidebar}
          className="md:hidden p-1.5 rounded-lg hover:bg-dark-800 text-dark-400"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User Info */}
      <UserInfo />

      {/* Actions */}
      <ActionsSection
        onCreateRoom={() => setShowCreateModal(true)}
        onJoinRoom={() => setShowJoinModal(true)}
      />

      {/* Search */}
      <SearchSection onRoomJoined={onRoomJoined} onSelectRoom={onSelectRoom} />

      {/* Rooms List */}
      <RoomsList
        rooms={rooms}
        activeRoom={activeRoom}
        loading={loadingRooms}
        onSelectRoom={onSelectRoom}
      />

      {/* Modals */}
      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onCreated={onRoomCreated}
        />
      )}
      {showJoinModal && (
        <JoinRoomModal
          onClose={() => setShowJoinModal(false)}
          onJoined={onRoomJoined}
        />
      )}
    </div>
  )
}

export default Sidebar
