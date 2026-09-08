import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, CheckCircle, Shield, ArrowRight, Sparkles } from 'lucide-react';

export default function Signup() {
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    const { confirmPassword, ...registerData } = formData;
    const result = await register(registerData);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F7F2] px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo - Compact */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-9 h-9 bg-[#1B4332] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-base">K</span>
            </div>
            <span className="text-xl font-bold text-[#1B4332]">KIKO</span>
            <span className="text-xs font-medium text-[#D4A64A] bg-[#FFF8E8] px-2 py-0.5 rounded-full">AI</span>
          </div>
          <h1 className="text-xl font-bold text-[#1F2937]">Create Your Account</h1>
          <p className="text-[#4B5563] text-sm">Start building better study habits today</p>
        </div>

        {/* Card - Compact */}
        <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6">
          {/* Premium Badge */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex items-center gap-1.5 bg-[#FFF8E8] border border-[#D4A64A]/30 px-3 py-0.5 rounded-full">
              <Sparkles size={12} className="text-[#D4A64A]" />
              <span className="text-[#4D3A11] text-[10px] font-medium">Free Forever</span>
            </div>
          </div>

          {error && (
            <div className="bg-[#FDECEC] border border-[#D14343]/30 text-[#D14343] px-3 py-2 rounded-[14px] mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div className="mb-2">
                <label className="block text-[#4B5563] text-xs font-medium mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={15} />
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full bg-white border border-[#E8ECE7] rounded-[14px] pl-9 pr-3 py-2 text-[#1F2937] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] transition-all"
                    placeholder="Full name"
                  />
                </div>
              </div>

              <div className="mb-2">
                <label className="block text-[#4B5563] text-xs font-medium mb-1">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={15} />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full bg-white border border-[#E8ECE7] rounded-[14px] pl-9 pr-3 py-2 text-[#1F2937] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] transition-all"
                    placeholder="Username"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="mb-2">
              <label className="block text-[#4B5563] text-xs font-medium mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={15} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-white border border-[#E8ECE7] rounded-[14px] pl-9 pr-3 py-2 text-[#1F2937] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="mb-2">
                <label className="block text-[#4B5563] text-xs font-medium mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={15} />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-white border border-[#E8ECE7] rounded-[14px] pl-9 pr-3 py-2 text-[#1F2937] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] transition-all"
                    placeholder="Password"
                    required
                  />
                </div>
              </div>

              <div className="mb-2">
                <label className="block text-[#4B5563] text-xs font-medium mb-1">Confirm</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={15} />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full bg-white border border-[#E8ECE7] rounded-[14px] pl-9 pr-3 py-2 text-[#1F2937] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] transition-all"
                    placeholder="Confirm"
                    required
                  />
                </div>
              </div>
            </div>
            <p className="text-[#9CA3AF] text-[10px] -mt-1 mb-2">Minimum 6 characters</p>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1B4332] hover:bg-[#24543F] text-white font-semibold py-2.5 rounded-[14px] transition flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
            >
              {loading ? 'Creating account...' : 'Create Account'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E8ECE7]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-[#6B7280] text-xs">or sign up with</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="flex-1 border border-[#E8ECE7] rounded-[14px] px-3 py-2 text-[#4B5563] font-medium hover:bg-[#EDF4EE] transition flex items-center justify-center gap-2 text-sm">
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google
            </button>
            <button className="flex-1 border border-[#E8ECE7] rounded-[14px] px-3 py-2 text-[#4B5563] font-medium hover:bg-[#EDF4EE] transition flex items-center justify-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.205 11.387.6.113.82-.26.82-.58 0-.287-.01-1.05-.015-2.06-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.744.082-.729.082-.729 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.235-3.22-.123-.3-.535-1.52.117-3.16 0 0 1.008-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.29-1.552 3.297-1.23 3.297-1.23.653 1.64.24 2.86.118 3.16.768.84 1.233 1.91 1.233 3.22 0 4.61-2.804 5.62-5.476 5.92.43.37.824 1.102.824 2.22 0 1.602-.015 2.894-.015 3.287 0 .322.216.698.825.58C20.565 21.795 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
              GitHub
            </button>
          </div>

          <p className="text-[#6B7280] text-center mt-4 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-[#1B4332] font-medium hover:underline transition">
              Login here
            </Link>
          </p>
        </div>

        {/* Security Badge - Compact */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 text-[#6B7280] text-[10px]">
            <Shield size={12} className="text-[#D4A64A]" />
            <span>Secure JWT Auth</span>
            <span className="w-0.5 h-0.5 bg-[#E8ECE7] rounded-full"></span>
            <CheckCircle size={12} className="text-[#2E7D32]" />
            <span>AES-256 Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}
