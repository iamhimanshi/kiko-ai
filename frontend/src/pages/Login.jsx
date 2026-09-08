import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Mail, Lock, ArrowRight, CheckCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-cream px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <span className="text-2xl font-bold text-primary">KIKO</span>
            <span className="text-sm font-medium text-gold bg-gold-bg px-2 py-0.5 rounded-full">AI</span>
          </div>
          <h1 className="text-2xl font-bold text-text-dark">Welcome Back!</h1>
          <p className="text-text-slate mt-1">Login to continue your focused study journey</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          {error && (
            <div className="bg-status-errorBg border border-status-error/30 text-status-error px-4 py-3 rounded-input mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-text-slate text-sm font-medium mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-placeholder" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-11"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-text-slate text-sm font-medium">Password</label>
                <button type="button" className="text-text-muted text-sm hover:text-primary transition">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-placeholder" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-11"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3"
            >
              {loading ? 'Logging in...' : 'Login to your account'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-bg-white text-text-muted">or</span>
            </div>
          </div>

          <div className="space-y-3">
            <button className="w-full border border-border rounded-button px-4 py-2.5 text-text-slate font-medium hover:bg-bg-hover transition flex items-center justify-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>
            <button className="w-full border border-border rounded-button px-4 py-2.5 text-text-slate font-medium hover:bg-bg-hover transition flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.205 11.387.6.113.82-.26.82-.58 0-.287-.01-1.05-.015-2.06-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.744.082-.729.082-.729 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.235-3.22-.123-.3-.535-1.52.117-3.16 0 0 1.008-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.29-1.552 3.297-1.23 3.297-1.23.653 1.64.24 2.86.118 3.16.768.84 1.233 1.91 1.233 3.22 0 4.61-2.804 5.62-5.476 5.92.43.37.824 1.102.824 2.22 0 1.602-.015 2.894-.015 3.287 0 .322.216.698.825.58C20.565 21.795 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
              Continue with GitHub
            </button>
          </div>

          <p className="text-text-muted text-center mt-6 text-sm">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-medium hover:underline transition">
              Sign up free
            </Link>
          </p>
        </div>

        {/* Security Badge */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 text-text-muted text-xs">
            <Shield size={14} className="text-gold" />
            <span>Secure JWT Authentication</span>
            <span className="w-1 h-1 bg-border rounded-full"></span>
            <CheckCircle size={14} className="text-status-success" />
            <span>AES-256 Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}

