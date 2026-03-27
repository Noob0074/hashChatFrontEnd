import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import ChatDashboard from './pages/ChatDashboard'
import ResetPasswordPage from './pages/ResetPasswordPage'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center gradient-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-dark-400 text-sm font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-[100dvh] flex flex-col bg-dark-950 text-white">
      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to="/chat" replace /> : <LandingPage />}
        />
        <Route
          path="/auth"
          element={user ? <Navigate to="/chat" replace /> : <AuthPage />}
        />
        <Route
          path="/chat"
          element={user ? <ChatDashboard /> : <Navigate to="/" replace />}
        />
        <Route
          path="/verify"
          element={<AuthPage />}
        />
        <Route
          path="/reset-password"
          element={<ResetPasswordPage />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
