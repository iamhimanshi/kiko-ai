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
    <aside className="w-64 h-screen sticky top-0 bg-[#172554] flex flex-col flex-shrink-0 overflow-y-auto border-r border-[#1E3A8A]">
      {/* Logo */}
      <div className="p-6 border-b border-[#1E3A8A]">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#1E3A8A] rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M4 15C6.5 12.5 9.5 12.5 12 15C14.5 17.5 17.5 17.5 20 15"
                stroke="#FF5C5C"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <path
                d="M6 9.5C8 7.5 10.5 7.5 12 9.5C13.5 11.5 16 11.5 18 9.5"
                stroke="#FFFFFF"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white">
            Day<span className="text-[#FF5C5C]">dive</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path === '/study-session' && location.pathname.startsWith('/study-session'));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-[12px] transition-all ${
                isActive
                  ? 'bg-[#FF5C5C] text-white shadow-[0px_4px_12px_rgba(255,92,92,0.3)]'
                  : 'text-[#93C5FD] hover:text-white hover:bg-[#1E3A8A]'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-white' : 'text-[#DBEAFE]'} />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom - Profile & Logout */}
      <div className="p-4 border-t border-[#1E3A8A]">
        <div className="flex items-center gap-3 px-3 py-2 rounded-[12px] hover:bg-[#1E3A8A] transition cursor-pointer">
          <div className="w-9 h-9 bg-[#1E3A8A] rounded-full flex items-center justify-center border border-[#3B82F6]/30">
            <User size={18} className="text-[#DBEAFE]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">
              {user?.full_name || user?.username || 'User'}
            </p>
            <p className="text-[#93C5FD] text-xs">Student</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-[12px] text-[#93C5FD] hover:text-white hover:bg-[#1E3A8A] transition mt-1.5 text-sm font-medium"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}