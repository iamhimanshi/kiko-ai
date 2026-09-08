import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import SessionSetup from './pages/SessionSetup';
import ActiveSession from './pages/ActiveSession';
import SessionReport from './pages/SessionReport';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/study-session/setup"
            element={
              <ProtectedRoute>
                <SessionSetup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/study-session/active"
            element={
              <ProtectedRoute>
                <ActiveSession />
              </ProtectedRoute>
            }
          />
          <Route
            path="/study-session/report"
            element={
              <ProtectedRoute>
                <SessionReport />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

