import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Hash, Shield, Zap, Lock, ArrowRight } from 'lucide-react'

const LandingPage = () => {
  const navigate = useNavigate()
  const { user, loginAsGuest } = useAuth()
  const [isJoining, setIsJoining] = useState(false)

  const handleGuestJoin = async () => {
    setIsJoining(true)
    try {
      await loginAsGuest()
      navigate('/chat')
    } catch (err) {
      // handled
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="flex-1 w-full h-full min-h-screen overflow-y-auto overflow-x-hidden no-scrollbar bg-dark-950 flex flex-col items-center py-12 p-6 relative scroll-smooth">
      {/* Background orbs */}
      <div className="orb w-96 h-96 bg-primary-600 top-[-10%] left-[-10%] animate-pulse" />
      <div className="orb w-96 h-96 bg-purple-500 bottom-[-10%] right-[-10%] animate-pulse" style={{ animationDelay: '2.5s' }} />

      <div className="relative z-10 w-full max-w-4xl text-center">
        {/* Logo */}
        <div className="w-full flex items-center justify-center gap-3 mb-8 animate-fade-in">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Hash className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Hashchat</h1>
        </div>

        <h2 className="text-3xl md:text-5xl font-extrabold mb-6 animate-slide-up bg-clip-text text-transparent bg-gradient-to-r from-primary-400 via-primary-500 to-purple-500 tracking-tight leading-tight">
          Anonymous <span className="block sm:inline">Real-time Messaging</span>
        </h2>
        
        <p className="text-dark-400 text-lg mb-10 max-w-xs sm:max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
          Secure, private, and instant chat rooms. No personal information required.
          Start a conversation in seconds.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          {user ? (
            <button
              onClick={() => navigate('/chat')}
              className="btn-primary flex items-center gap-2 group"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleGuestJoin}
                disabled={isJoining}
                className="btn-primary flex items-center gap-2 group"
              >
                {isJoining ? 'Joining...' : 'Join as Guest'}
                {!isJoining && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </button>
              <button
                onClick={() => navigate('/auth')}
                className="btn-secondary"
              >
                Sign In / Register
              </button>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 mb-16 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <FeatureCard 
            icon={<Shield className="w-6 h-6 text-emerald-400" />}
            title="Privacy First"
            desc="No tracking, no data collection. Your privacy is our priority."
          />
          <FeatureCard 
            icon={<Zap className="w-6 h-6 text-amber-400" />}
            title="Instant Sync"
            desc="Real-time messaging with low latency for seamless conversations."
          />
          <FeatureCard 
            icon={<Lock className="w-6 h-6 text-primary-400" />}
            title="Secure Rooms"
            desc="Control your rooms, password protect them, and enjoy private spaces."
          />
        </div>
      </div>

      <footer className="mt-auto py-8 text-dark-500 text-sm relative z-10 w-full text-center">
        &copy; 2026 Hashchat. All rights reserved.
      </footer>
    </div>
  )
}

const FeatureCard = ({ icon, title, desc }) => (
  <div className="glass-card p-6 text-left hover:border-primary-500/30 transition-colors">
    <div className="w-12 h-12 rounded-xl bg-dark-800 flex items-center justify-center mb-4 border border-dark-700">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    <p className="text-dark-500 text-sm leading-relaxed">{desc}</p>
  </div>
)

export default LandingPage
