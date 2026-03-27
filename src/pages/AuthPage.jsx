import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useConfig } from '../context/ConfigContext'
import { Hash, Mail, Lock, User, ArrowLeft, CheckCircle, Info, Eye, EyeOff } from 'lucide-react'
import API from '../api/axios'
import toast from 'react-hot-toast'

const AuthPage = () => {
  const [tab, setTab] = useState('login')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, login, register, refreshUser } = useAuth()

  // Handle email verification
  useEffect(() => {
    const verifyToken = searchParams.get('token')
    if (verifyToken) {
      API.get(`/auth/verify?token=${verifyToken}`)
        .then(async () => {
          toast.success('Email verified successfully!')
          if (user) {
            await refreshUser()
            navigate('/chat')
          } else {
            setTab('login')
          }
        })
        .catch(() => {
          toast.error('Invalid or expired verification link')
        })
    }
  }, [searchParams, user])

  return (
    <div className="h-screen w-screen gradient-bg relative overflow-hidden flex items-center justify-center">
      {/* Orbs */}
      <div className="orb w-72 h-72 bg-primary-600 top-[10%] left-[10%] animate-float" />
      <div className="orb w-56 h-56 bg-purple-500 bottom-[10%] right-[10%] animate-float" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="btn-ghost flex items-center gap-2 mb-6 text-dark-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Card */}
        <div className="glass-card p-8 animate-slide-up">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Hash className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-white">Hashchat</span>
          </div>

          {/* Tabs */}
          <div className="flex bg-dark-800/80 rounded-xl p-1 mb-6">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                tab === 'login'
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                  : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setTab('register')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                tab === 'register'
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                  : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              Register
            </button>
          </div>

          {/* Forms */}
          {tab === 'login' ? (
            <LoginForm onLogin={login} navigate={navigate} />
          ) : (
            <RegisterForm onRegister={register} navigate={navigate} />
          )}
        </div>
      </div>
    </div>
  )
}

const LoginForm = ({ onLogin, navigate }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('login') // 'login' or 'forgot'
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await onLogin(email, password)
        navigate('/chat')
      } else {
        await API.post('/auth/forgot-password', { email })
        setSuccess(true)
      }
    } catch (err) {
      // handled
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-6 animate-fade-in">
        <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Check your email!</h3>
        <p className="text-dark-400 text-sm">
          If an account exists for <span className="text-primary-400">{email}</span>, 
          you will receive a reset link shortly.
        </p>
        <button
          onClick={() => {
            setSuccess(false)
            setMode('login')
          }}
          className="btn-ghost mt-6 text-primary-400 hover:text-primary-300"
        >
          Back to Login
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm text-dark-400 mb-1.5 block">Email</label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field pl-10"
            placeholder="you@example.com"
            required
            id="login-email"
          />
        </div>
      </div>

      {mode === 'login' && (
        <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-sm text-dark-400 block">Password</label>
            <button
              type="button"
              onClick={() => setMode('forgot')}
              className="text-xs text-primary-500 hover:text-primary-400 transition-colors"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pl-10 pr-10"
              placeholder="••••••••"
              required={mode === 'login'}
              id="login-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2"
        id="login-submit"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          mode === 'login' ? 'Sign In' : 'Send Reset Link'
        )}
      </button>

      {mode === 'forgot' && (
        <button
          type="button"
          onClick={() => setMode('login')}
          className="w-full text-center text-sm text-dark-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
      )}
    </form>
  )
}

const RegisterForm = ({ onRegister, navigate }) => {
  const { handleKeyRestriction, config } = useConfig()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Client-side fix for "Strength bug" - pulls accurately from config if possible
    if (config?.auth?.password) {
      const passRegex = new RegExp(config.auth.password)
      if (!passRegex.test(password)) {
        toast.error('Weak Password: Use A-Z, a-z, 0-9 & special characters.')
        return
      }
    }

    setLoading(true)
    try {
      await onRegister(username, email, password)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm text-dark-400 mb-1.5 block">Username</label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={(e) => handleKeyRestriction(e, 'username')}
            className="input-field pl-10"
            placeholder="Unique username"
            minLength={3}
            maxLength={30}
            required
            id="register-username"
          />
        </div>
        <p className="text-[10px] text-dark-500 mt-1 uppercase font-bold tracking-wider ml-1">Alphabets, underscores, dots only</p>
      </div>

      <div>
        <label className="text-sm text-dark-400 mb-1.5 block">Email</label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field pl-10"
            placeholder="you@example.com"
            required
            id="register-email"
          />
        </div>
      </div>

      <div>
        <label className="text-sm text-dark-400 mb-1.5 block">Password</label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field pl-10 pr-10"
            placeholder="Min 8 characters"
            minLength={8}
            required
            id="register-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex items-start gap-1.5 mt-2 ml-1">
          <Info className="w-3 h-3 text-dark-500 mt-0.5 shrink-0" />
          <p className="text-[10px] text-dark-500 leading-tight">
            Must include: <b>A-Z, a-z, 0-9, & special char</b>
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-2.5 mt-4"
        id="register-submit"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          'Create Account'
        )}
      </button>
    </form>
  )
}

export default AuthPage
