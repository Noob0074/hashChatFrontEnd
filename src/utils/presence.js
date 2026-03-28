export const normalizePresenceId = (value) => value?.toString?.() || value

export const formatLastActive = (dateValue) => {
  if (!dateValue) return 'Offline'

  const timestamp = new Date(dateValue)
  if (Number.isNaN(timestamp.getTime())) return 'Offline'

  const diffMs = Date.now() - timestamp.getTime()
  const diffMins = Math.max(1, Math.floor(diffMs / 60000))

  if (diffMins < 1) return 'Last active just now'
  if (diffMins < 60) return `Last active ${diffMins}m ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `Last active ${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `Last active ${diffDays}d ago`

  return `Last active ${timestamp.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })}`
}
