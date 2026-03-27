const TypingIndicator = ({ users }) => {
  if (!users || users.length === 0) return null

  const names = users.map((u) => u.username).join(', ')

  return (
    <div className="px-4 py-1.5 animate-fade-in">
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
        <span className="text-xs text-dark-500">
          {names} {users.length === 1 ? 'is' : 'are'} typing...
        </span>
      </div>
    </div>
  )
}

export default TypingIndicator
