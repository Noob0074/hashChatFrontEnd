import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Ghost, Lock, ArrowLeft, CheckCircle, RefreshCw } from 'lucide-react'
import API from '../api/axios'
import toast from 'react-hot-toast'

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!token) {
      toast.error('Invalid or missing reset token')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const { data } = await API.post('/auth/reset-password', {
        token,
        password,
      })
      toast.success(data.message)
      setSuccess(true)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="h-screen w-screen gradient-bg flex items-center justify-center p-6">
        <div className="glass-card max-w-md w-full p-8 text-center animate-slide-up">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Password Updated!</h2>
          <p className="text-dark-400 mb-8">
            Your password has been reset successfully. You can now use your new password to sign in.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="btn-primary w-full"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen gradient-bg relative overflow-hidden flex items-center justify-center p-6">
      <div className="orb w-72 h-72 bg-primary-600 top-[10%] left-[10%] animate-float" />
      
      <div className="relative z-10 w-full max-w-md">
        <button
          onClick={() => navigate('/auth')}
          className="btn-ghost flex items-center gap-2 mb-6 text-dark-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </button>

        <div className="glass-card p-8 animate-slide-up">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Ghost className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-white">AnonChat</span>
          </div>

          <h2 className="text-xl font-bold text-white mb-2 text-center">Reset Password</h2>
          <p className="text-dark-400 text-sm mb-6 text-center">
            Enter your new password below. Make sure it's at least 6 characters.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-dark-400 mb-1.5 block">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-dark-400 mb-1.5 block">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage
