import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Assistant from './pages/Assistant'
import SessionSetup from './pages/SessionSetup'
import ActiveSession from './pages/ActiveSession'
import SessionReport from './pages/SessionReport'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assistant"
          element={
            <ProtectedRoute>
              <Assistant />
            </ProtectedRoute>
          }
        />
        <Route
          path="/session/new"
          element={
            <ProtectedRoute>
              <SessionSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/session/:sessionId"
          element={
            <ProtectedRoute>
              <ActiveSession />
            </ProtectedRoute>
          }
        />
        <Route
          path="/session/:sessionId/report"
          element={
            <ProtectedRoute>
              <SessionReport />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  )
}
