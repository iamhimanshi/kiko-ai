import { NavLink, useNavigate } from 'react-router-dom'
import { Brain, LayoutDashboard, MessagesSquare, Timer, LogOut, Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/session/new', label: 'Study Session', icon: Timer },
  { to: '/assistant', label: 'Assistant', icon: MessagesSquare },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <>
      {/* Desktop / tablet sidebar */}
      <aside className="hidden sm:flex flex-col w-[240px] shrink-0 bg-surface border-r border-border h-screen sticky top-0">
        <div className="h-16 flex items-center gap-2 px-6 border-b border-border">
          <Brain size={20} className="text-brand" strokeWidth={2.2} />
          <span className="font-display text-base font-semibold tracking-tight">KIKO AI</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors ${
                  isActive
                    ? 'bg-brand-soft text-ink'
                    : 'text-muted hover:text-ink hover:bg-cardElevated'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-border">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm text-muted truncate">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="text-muted hover:text-danger transition-colors shrink-0"
              aria-label="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav — design brief §43 */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-border flex items-center justify-around h-16">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[11px] ${isActive ? 'text-brand-light' : 'text-muted'}`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}

export function TopBar({ title }) {
  return (
    <div className="h-16 border-b border-border flex items-center justify-between px-6 sm:px-8">
      <h1 className="font-display text-h4 sm:text-h3 text-ink">{title}</h1>
      <button className="text-muted hover:text-ink transition-colors" aria-label="Notifications">
        <Bell size={18} />
      </button>
    </div>
  )
}
