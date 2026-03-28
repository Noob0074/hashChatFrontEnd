import { useState } from 'react'
import { Search, Users, Hash } from 'lucide-react'
import API from '../../api/axios'
import toast from 'react-hot-toast'

const SearchSection = ({ onRoomJoined, onSelectRoom }) => {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('users')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  const handleSearch = async () => {
    if (query.length < 2) return

    setSearching(true)
    try {
      if (tab === 'users') {
        const { data } = await API.get(`/users/search?username=${query}`)
        setResults(data.users || [])
      } else {
        const { data } = await API.get(`/rooms/search?name=${query}`)
        setResults(data.rooms || [])
      }
    } catch (err) {
      toast.error('Search failed')
    } finally {
      setSearching(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handleStartDM = async (targetUserId) => {
    try {
      const { data } = await API.post('/rooms/dm', { targetUserId })
      onRoomJoined(data.room)
      setQuery('')
      setResults([])
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start DM')
    }
  }

  const handleJoinRoom = async (roomId) => {
    try {
      const { data } = await API.post(`/rooms/${roomId}/join`)
      toast.success(data.message)
      if (data.room) {
        onRoomJoined(data.room)
      }
      setQuery('')
      setResults([])
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to join room')
    }
  }

  return (
    <div className="px-3 py-3 sm:px-4 border-b border-dark-700/50">
      {/* Search tabs */}
      <div className="flex bg-dark-800/60 rounded-lg p-0.5 mb-2">
        <button
          onClick={() => { setTab('users'); setResults([]) }}
          className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${
            tab === 'users'
              ? 'bg-dark-700 text-white'
              : 'text-dark-500 hover:text-dark-300'
          }`}
        >
          <Users className="w-3 h-3 inline mr-1" />
          Users
        </button>
        <button
          onClick={() => { setTab('rooms'); setResults([]) }}
          className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${
            tab === 'rooms'
              ? 'bg-dark-700 text-white'
              : 'text-dark-500 hover:text-dark-300'
          }`}
        >
          <Hash className="w-3 h-3 inline mr-1" />
          Rooms
        </button>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="input-field pl-9 py-2 text-sm"
          placeholder={tab === 'users' ? 'Search users...' : 'Search rooms...'}
          id="search-input"
        />
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
          {results.map((item) => (
            <div
              key={item._id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-dark-800/70 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-dark-700 flex items-center justify-center flex-shrink-0">
                  {tab === 'users' ? (
                    <Users className="w-3.5 h-3.5 text-dark-400" />
                  ) : (
                    <Hash className="w-3.5 h-3.5 text-dark-400" />
                  )}
                </div>
                <span className="text-sm text-dark-200 truncate">
                  {tab === 'users' ? item.username : item.name}
                </span>
                {tab === 'rooms' && (
                  <span className={item.type === 'public' ? 'badge-public text-[10px]' : 'badge-private text-[10px]'}>
                    {item.type}
                  </span>
                )}
              </div>
              <button
                onClick={() =>
                  tab === 'users'
                    ? handleStartDM(item._id)
                    : handleJoinRoom(item._id)
                }
                className="text-xs text-primary-400 hover:text-primary-300 font-medium px-2 py-1 rounded hover:bg-primary-500/10 transition-colors flex-shrink-0"
              >
                {tab === 'users' ? 'Chat' : 'Join'}
              </button>
            </div>
          ))}
        </div>
      )}

      {searching && (
        <p className="text-xs text-dark-500 text-center mt-2">Searching...</p>
      )}
    </div>
  )
}

export default SearchSection
