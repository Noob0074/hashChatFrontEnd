import { createContext, useContext, useState, useEffect } from 'react'
import API from '../api/axios'

const ConfigContext = createContext()

export const useConfig = () => useContext(ConfigContext)

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await API.get('/config')
        setConfig(data)
      } catch (err) {
        console.error('Failed to fetch app config:', err)
        // Fallback defaults if API fails
        setConfig({
          auth: {
            username: '^[a-zA-Z0-9._]+$',
            roomName: '^[a-zA-Z0-9._]+$',
            password: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[_@$!%*?&.])[A-Za-z\d@$!%*?&._]{8,}$',
          },
          limits: {
            avatarSize: 10485760,
            mediaSize: 20971520,
            avatarTypes: ['image/jpeg', 'image/png'],
            mediaTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
          }
        })
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [])

  // Helper to validate a file against limits
  const validateFile = (file, type = 'media') => {
    if (!config) return { valid: true }

    const limits = config.limits
    const maxSize = type === 'avatar' ? limits.avatarSize : limits.mediaSize
    const allowedTypes = type === 'avatar' ? limits.avatarTypes : limits.mediaTypes

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File is too large. Max size is ${Math.round(maxSize / (1024 * 1024))}MB`
      }
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`
      }
    }

    return { valid: true }
  }

  // Helper to block invalid characters in real-time
  const handleKeyRestriction = (e, type = 'username') => {
    if (!config) return
    const pattern = type === 'username' ? config.auth.username : config.auth.roomName

    // Allow navigation/control keys (Backspace, Delete, Arrow keys, etc.)
    if (e.key.length > 1 || e.ctrlKey || e.metaKey) return

    // Robust validation: Allow letters, numbers, underscores, and dots by default
    // We only block if the character is clearly invalid for ANY standard identifier
    const isBasicValid = /[a-zA-Z0-9._]/.test(e.key);

    if (!isBasicValid) {
      e.preventDefault();
      return;
    }

    // Secondary Check: Strict regex validation from backend
    try {
      // Create a temporary string of current value + new key to test
      const nextValue = e.target.value + e.key;
      // We test if the SPECIFIC character added is allowed by the character class
      // Most patterns are ^[...]+$, so we extract the bracketed part
      const charClassMatch = pattern.match(/\[(.*?)\]/);
      if (charClassMatch) {
        const charRegex = new RegExp(`[${charClassMatch[1]}]`);
        if (!charRegex.test(e.key)) {
          e.preventDefault();
        }
      }
    } catch (err) {
      // If regex parsing fails, we already did the basic check above
    }
  }

  return (
    <ConfigContext.Provider value={{ config, loading, validateFile, handleKeyRestriction }}>
      {children}
    </ConfigContext.Provider>
  )
}
