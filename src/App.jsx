import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const AuthPage = lazy(() => import('./pages/AuthPage'))
const ChatDashboard = lazy(() => import('./pages/ChatDashboard'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))

const AppShellLoader = () => (
  <div className="h-screen w-screen flex items-center justify-center gradient-bg">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      <p className="text-dark-400 text-sm font-medium">Loading...</p>
    </div>
  </div>
)

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <AppShellLoader />
  }

  return (
    <div className="h-screen h-[100dvh] w-full flex flex-col bg-dark-950 text-white overflow-hidden">
      <Suspense fallback={<AppShellLoader />}>
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
      </Suspense>
    </div>
  )
}

export default App
