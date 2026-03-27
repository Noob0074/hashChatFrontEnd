import { useState } from 'react'
import { Mail, RefreshCw, LogOut, CheckCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const VerificationOverlay = () => {
  const { user, resendVerification, logout, refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const handleResend = async () => {
    if (cooldown > 0) return
    
    setLoading(true)
    try {
      await resendVerification()
      setCooldown(60)
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      // Error handled by context toast
    } finally {
      setLoading(false)
    }
  }

  const handleCheckStatus = async () => {
    setChecking(true)
    try {
      const updatedUser = await refreshUser()
      if (updatedUser.isVerified) {
        toast.success('Email verified! You are ready to chat.')
      } else {
        toast.error('Still not verified. Please check your email.')
      }
    } catch (err) {
      // handled
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md animate-fade-in">
      <div className="max-w-md w-full bg-dark-900 border border-dark-800 rounded-2xl p-8 shadow-2xl overflow-hidden relative">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary-500/10 blur-[80px] -z-10" />
        
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mb-6 ring-8 ring-primary-500/5">
            <Mail className="w-8 h-8 text-primary-500 animate-pulse" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Verify your email</h2>
          <p className="text-dark-400 mb-8">
            We sent a verification link to <span className="text-primary-400 font-medium">{user?.email}</span>. 
            Please check your inbox (and spam folder) to activate your account.
          </p>

          <div className="grid grid-cols-1 w-full gap-3">
            <button
              onClick={handleCheckStatus}
              disabled={checking}
              className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
            >
              {checking ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  I've Verified My Email
                </>
              )}
            </button>

            <button
              onClick={handleResend}
              disabled={loading || cooldown > 0}
              className={`
                flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold transition-all
                ${cooldown > 0 
                  ? 'bg-dark-800 text-dark-500 cursor-not-allowed' 
                  : 'bg-dark-800 text-dark-200 hover:bg-dark-700 hover:text-white border border-dark-700 active:scale-95'}
              `}
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : cooldown > 0 ? (
                `Resend in ${cooldown}s`
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Resend Email
                </>
              )}
            </button>

            <button
              onClick={logout}
              className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold bg-dark-800 text-dark-200 hover:bg-dark-700 hover:text-white transition-all active:scale-95"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>

          <p className="mt-8 text-xs text-dark-500 flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-primary-500" />
            Verification ensures a safer anonymous community.
          </p>
        </div>
      </div>
    </div>
  )
}

export default VerificationOverlay
