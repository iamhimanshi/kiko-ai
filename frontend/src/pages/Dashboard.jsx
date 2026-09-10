import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { sessionApi } from '../services/api';
import { 
  Plus, 
  Clock, 
  Target, 
  Zap, 
  Calendar, 
  FileText, 
  ArrowRight,
  TrendingUp,
  Activity,
  PlayCircle,
  AlertCircle
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSession, setActiveSession] = useState(null);
  const [loadingActive, setLoadingActive] = useState(true);

  // Check for active session
  useEffect(() => {
    const checkActive = async () => {
      try {
        const response = await sessionApi.getActive();
        // Backend returns null (or empty) if no active session
        setActiveSession(response.data && response.data.id ? response.data : null);
      } catch (err) {
        // Silent fail — dashboard still works
        setActiveSession(null);
      } finally {
        setLoadingActive(false);
      }
    };
    checkActive();
  }, []);

  const stats = [
    { icon: Clock, label: 'Study Time', value: '2h 35m', change: '+12%', changeType: 'up', iconBg: 'bg-[#EEF7F0]', iconColor: 'text-[#1B4332]' },
    { icon: Target, label: 'Focus Score', value: '82%', change: '+8%', changeType: 'up', iconBg: 'bg-[#EAF8EC]', iconColor: 'text-[#2E7D32]' },
    { icon: Zap, label: 'Distraction', value: '18m', change: '-5%', changeType: 'down', iconBg: 'bg-[#FFF8E8]', iconColor: 'text-[#D4A64A]' },
    { icon: Calendar, label: 'Sessions', value: '3', change: '+2', changeType: 'up', iconBg: 'bg-[#EDF4EE]', iconColor: 'text-[#1B4332]' },
  ];

  const recentSessions = [
    { subject: 'DSA — Linked Lists', duration: '60 min', focus: 82, date: 'Today' },
    { subject: 'DBMS — SQL Joins', duration: '45 min', focus: 76, date: 'Yesterday' },
    { subject: 'OS — Scheduling', duration: '50 min', focus: 91, date: '2 days ago' },
  ];

  const weekData = [
    { day: 'Mon', focus: 80 },
    { day: 'Tue', focus: 62 },
    { day: 'Wed', focus: 91 },
    { day: 'Thu', focus: 74 },
    { day: 'Fri', focus: 88 },
    { day: 'Sat', focus: 70 },
    { day: 'Sun', focus: 0 },
  ];

  const maxFocus = Math.max(...weekData.map(d => d.focus));

  const greeting = new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening';

  return (
    <div className="flex min-h-screen bg-[#F8F7F2]">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1F2937]">
              Good {greeting}, {user?.full_name || user?.username} 👋
            </h1>
            <p className="text-[#4B5563] text-sm">
              {activeSession
                ? 'You have an active session in progress.'
                : 'Ready to make your next study session count?'}
            </p>
          </div>

          {/* CTA — Contextual */}
          {loadingActive ? (
            <div className="bg-[#EDF4EE] text-[#6B7280] px-5 py-2.5 rounded-[14px] font-medium text-sm">
              Checking...
            </div>
          ) : activeSession ? (
            <Link
              to={`/study-session/active/${activeSession.id}`}
              className="bg-[#D4A64A] hover:bg-[#C9962E] text-white px-5 py-2.5 rounded-[14px] font-medium transition flex items-center gap-2 shadow-[0px_4px_12px_rgba(212,166,74,0.3)]"
            >
              <PlayCircle size={18} />
              Resume Session
            </Link>
          ) : (
            <Link
              to="/study-session/setup"
              className="bg-[#1B4332] hover:bg-[#24543F] text-white px-5 py-2.5 rounded-[14px] font-medium transition flex items-center gap-2"
            >
              <Plus size={18} />
              Start Study Session
            </Link>
          )}
        </div>

        {/* Active Session Banner */}
        {activeSession && !loadingActive && (
          <Link
            to={`/study-session/active/${activeSession.id}`}
            className="block bg-gradient-to-br from-[#FFF8E8] to-[#FFF3D6] border border-[#D4A64A]/40 rounded-[18px] p-5 mb-6 hover:shadow-[0px_4px_12px_rgba(212,166,74,0.15)] transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#D4A64A] rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="text-white" size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[#4D3A11] font-semibold text-sm">
                      Active Session in Progress
                    </p>
                    <span className="bg-[#D4A64A]/20 text-[#4D3A11] text-[10px] font-medium px-2 py-0.5 rounded-full">
                      {activeSession.status}
                    </span>
                  </div>
                  <p className="text-[#4D3A11] text-sm font-medium">
                    {activeSession.subject}
                  </p>
                  <p className="text-[#6B7280] text-xs mt-0.5">
                    {activeSession.goal}
                  </p>
                </div>
              </div>
              <ArrowRight className="text-[#D4A64A] flex-shrink-0 mt-2" size={20} />
            </div>
          </Link>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            const isUp = stat.changeType === 'up';
            return (
              <div key={i} className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[#6B7280] text-sm">{stat.label}</p>
                    <p className="text-2xl font-bold text-[#1F2937] mt-1">{stat.value}</p>
                    <p className={`text-xs font-medium mt-1 ${isUp ? 'text-[#2E7D32]' : 'text-[#D14343]'}`}>
                      {stat.change} {isUp ? '↑' : '↓'}
                    </p>
                  </div>
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${stat.iconBg}`}>
                    <Icon className={stat.iconColor} size={22} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Sessions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#1F2937]">Recent Sessions</h2>
                <Link to="/analytics" className="text-[#1B4332] text-sm font-medium hover:underline flex items-center gap-1">
                  View All <ArrowRight size={14} />
                </Link>
              </div>
              <div className="space-y-3">
                {recentSessions.map((session, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-[#EDF4EE] rounded-[18px] hover:bg-[#EEF7F0] transition">
                    <div>
                      <p className="font-medium text-[#1F2937]">{session.subject}</p>
                      <div className="flex items-center gap-3 text-[#6B7280] text-xs mt-1">
                        <span>{session.duration}</span>
                        <span className="w-1 h-1 bg-[#E8ECE7] rounded-full"></span>
                        <span>{session.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${session.focus >= 80 ? 'bg-[#2E7D32]' : session.focus >= 60 ? 'bg-[#D4A64A]' : 'bg-[#D14343]'}`} />
                        <span className="text-sm font-medium text-[#1F2937]">{session.focus}%</span>
                      </div>
                      <Link to={`/study-session/report/${i}`} className="text-[#6B7280] hover:text-[#1B4332] transition">
                        <FileText size={16} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Focus Overview */}
          <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6">
            <h2 className="text-lg font-semibold text-[#1F2937] mb-4">Focus Overview</h2>
            <div className="space-y-3">
              {weekData.map((day, i) => {
                const height = day.focus === 0 ? 2 : (day.focus / maxFocus) * 100;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[#6B7280] text-xs w-8">{day.day}</span>
                    <div className="flex-1 h-6 bg-[#EDF4EE] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          day.focus >= 80 ? 'bg-[#2E7D32]' : 
                          day.focus >= 60 ? 'bg-[#D4A64A]' : 
                          day.focus > 0 ? 'bg-[#D14343]' : 'bg-[#E8ECE7]'
                        }`}
                        style={{ width: `${height}%` }}
                      />
                    </div>
                    <span className="text-[#4B5563] text-xs font-medium w-10 text-right">
                      {day.focus > 0 ? `${day.focus}%` : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-[#E8ECE7] flex items-center justify-between text-[#6B7280] text-xs">
              <span>Best focus: <span className="text-[#2E7D32] font-medium">Wed (91%)</span></span>
              <span>Avg: <span className="text-[#1F2937] font-medium">74%</span></span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-6 bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6">
          <h2 className="text-lg font-semibold text-[#1F2937] mb-3">Recent Activity</h2>
          <div className="bg-[#FFF8E8] border border-[#D4A64A]/30 rounded-[18px] p-4 flex items-start gap-3">
            <div className="w-8 h-8 bg-[#D4A64A] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Activity className="text-white" size={16} />
            </div>
            <div>
              <p className="text-[#1F2937] font-medium">AI Insight</p>
              <p className="text-[#4B5563] text-sm">You maintained your longest focus period during your first 32 minutes. Consider taking a short break around the 40-minute mark.</p>
              <Link to="/analytics" className="text-[#1B4332] text-sm font-medium hover:underline mt-1 inline-block">
                View full report
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
