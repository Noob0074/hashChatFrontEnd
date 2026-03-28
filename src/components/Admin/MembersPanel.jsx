import { useState } from 'react'
import { Ghost, UserCircle, LogOut, Search, X, Users } from 'lucide-react'
import { useSocket } from '../../context/SocketContext'
import { formatLastActive, normalizePresenceId } from '../../utils/presence'

const MembersPanel = ({ members, createdBy, isAdmin: viewerIsAdmin, onKick }) => {
  const [search, setSearch] = useState('')
  const { onlineUsers, lastSeenByUser } = useSocket()

  const filteredMembers = members.filter(m => 
    m.username?.toLowerCase().includes(search.toLowerCase()) ||
    (m.isDeleted && 'deleted user'.includes(search.toLowerCase()))
  )

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
        <input
          type="text"
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-dark-800 border border-dark-700 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder:text-dark-600 focus:outline-none focus:border-primary-500/50 transition-all"
        />
        {search && (
          <button 
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="px-1 flex items-center justify-between">
        <span className="text-[10px] uppercase font-bold text-dark-500 tracking-widest flex items-center gap-2">
          <Users className="w-3 h-3" />
          {members.length} {members.length === 1 ? 'Member' : 'Members'}
        </span>
      </div>

      <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar">
        {filteredMembers.length === 0 ? (
          <p className="text-sm text-dark-500 text-center py-10 italic">
            {search ? 'No members match your search' : 'No members found'}
          </p>
        ) : (
          filteredMembers.map((member) => {
            const memberIsAdmin = member._id === createdBy
            const isDeleted = member.isDeleted
            const memberId = normalizePresenceId(member._id)
            const isOnline = !isDeleted && onlineUsers.has(memberId)
            const presenceLabel = isDeleted
              ? ''
              : isOnline
                ? 'Online'
                : formatLastActive(lastSeenByUser[memberId] || member.lastActive)
            return (
              <div key={member._id} className="flex flex-col gap-3 p-3 bg-dark-800/40 rounded-xl border border-dark-700/30 hover:bg-dark-800/60 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center flex-shrink-0 shadow-inner overflow-hidden">
                      {member.profilePic && !isDeleted ? (
                        <img
                          src={member.profilePic}
                          alt={member.username || 'Member'}
                          className="w-full h-full object-cover"
                        />
                      ) : member.isGuest ? (
                        <Ghost className="w-5 h-5 text-dark-400" />
                      ) : (
                        <UserCircle className="w-5 h-5 text-dark-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {isDeleted ? 'Deleted User' : member.username}
                      </p>
                      {!isDeleted && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-dark-600'}`} />
                          <span className="text-[10px] text-dark-500 truncate">
                            {presenceLabel}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 mt-1">
                        {memberIsAdmin && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-primary-500/10 text-primary-400 border border-primary-500/20 font-bold uppercase tracking-wider">
                            admin
                          </span>
                        )}
                        {member.isGuest && !isDeleted && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-dark-700 text-dark-400 border border-dark-600 font-bold uppercase tracking-wider">
                            guest
                          </span>
                        )}
                        {!memberIsAdmin && !member.isGuest && !isDeleted && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold uppercase tracking-wider">
                            member
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin Actions */}
                {viewerIsAdmin && !memberIsAdmin && !isDeleted && (
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => onKick(member._id)}
                      className="flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg flex items-center justify-center gap-1 transition-colors"
                    >
                      <LogOut className="w-3 h-3" />
                      Kick
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default MembersPanel
