import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Target,
  Brain,
  Shield,
  BarChart3,
  Settings,
  LogOut,
  User,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/study-session', icon: Target, label: 'Study Session' },
  { path: '/assistant', icon: Brain, label: 'AI Study Assistant' },
  { path: '/mindguard', icon: Shield, label: 'MindGuard' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="w-64 min-h-screen bg-[#163020] flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-[#2C493A]">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1B4332] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <span className="text-xl font-bold text-white">KIKO</span>
          <span className="text-xs font-medium text-[#D4A64A] bg-[#FFF8E8]/10 px-2 py-0.5 rounded-full">AI</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
  (item.path === '/study-session' && location.pathname.startsWith('/study-session'));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                isActive
                  ? 'bg-[#2E5A43] text-white'
                  : 'text-[#C9D6CB] hover:text-white hover:bg-[#244535]'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-[#E6F2E7]' : ''} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom - Profile & Logout */}
      <div className="p-4 border-t border-[#2C493A]">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#244535] transition cursor-pointer">
          <div className="w-9 h-9 bg-[#2E5A43] rounded-full flex items-center justify-center">
            <User size={18} className="text-[#E6F2E7]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {user?.full_name || user?.username || 'User'}
            </p>
            <p className="text-[#C9D6CB] text-xs">Student</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[#C9D6CB] hover:text-white hover:bg-[#244535] transition mt-1"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}

