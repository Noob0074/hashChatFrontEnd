import { Ghost, UserCircle, Check, X } from 'lucide-react'

const JoinRequestsPanel = ({ requests, onApprove, onReject }) => {
  if (requests.length === 0) {
    return <p className="text-sm text-dark-500 text-center py-4">No pending requests</p>
  }

  return (
    <div className="space-y-3">
      {requests.map((user) => (
        <div key={user._id} className="flex items-center justify-between p-3 bg-dark-800/50 rounded-xl border border-dark-700/50">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center flex-shrink-0">
              {user.isGuest ? (
                <Ghost className="w-4 h-4 text-dark-400" />
              ) : (
                <UserCircle className="w-4 h-4 text-dark-400" />
              )}
            </div>
            <p className="text-sm font-medium text-white truncate">
              {user.username}
            </p>
          </div>

          <div className="flex gap-1 flex-shrink-0 ml-2">
            <button
              onClick={() => onApprove(user._id)}
              className="p-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
              title="Approve"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => onReject(user._id)}
              className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
              title="Reject"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default JoinRequestsPanel
