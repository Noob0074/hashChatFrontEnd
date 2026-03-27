import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Ghost, UserCircle, LogOut } from 'lucide-react'
import ProfileModal from '../Modals/ProfileModal'

const UserInfo = () => {
  const { user, logout } = useAuth()
  const [showProfile, setShowProfile] = useState(false)

  if (!user) return null

  return (
    <>
      <div className="px-4 py-3 border-b border-dark-700/50">
        <div className="flex items-center gap-3">
          <div 
            onClick={() => setShowProfile(true)}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all overflow-hidden"
            title="Edit Profile"
          >
            {user.profilePic ? (
              <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
            ) : user.isGuest ? (
              <Ghost className="w-5 h-5 text-white" />
            ) : (
              <UserCircle className="w-5 h-5 text-white" />
            )}
          </div>

          <div className="flex-1 min-w-0 flex items-center justify-between gap-2 overflow-hidden">
            <div 
              className="min-w-0 cursor-pointer"
              onClick={() => setShowProfile(true)}
            >
              <p className="font-semibold text-sm text-white truncate hover:text-primary-400 transition-colors">
                {user.username}
              </p>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex-shrink-0 ${
              user.isGuest 
                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                : 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
            }`}>
              {user.isGuest ? 'Guest' : 'Registered'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {!user.isGuest && (
              <button
                onClick={logout}
                className="p-2 rounded-lg text-dark-500 hover:text-dark-200 hover:bg-dark-800 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </>
  )
}

export default UserInfo
