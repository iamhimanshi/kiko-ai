import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import SessionSetup from './pages/SessionSetup';
import SessionPreview from './pages/SessionPreview';
import ActiveSession from './pages/ActiveSession';
import SessionComplete from './pages/SessionComplete';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Study Session */}
          <Route
            path="/study-session/setup"
            element={
              <ProtectedRoute>
                <SessionSetup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/study-session/preview"
            element={
              <ProtectedRoute>
                <SessionPreview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/study-session/active/:sessionId"
            element={
              <ProtectedRoute>
                <ActiveSession />
              </ProtectedRoute>
            }
          />
          <Route
            path="/study-session/complete/:sessionId"
            element={
              <ProtectedRoute>
                <SessionComplete />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
