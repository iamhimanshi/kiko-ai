import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { User, Target, Bell, Palette, Check } from 'lucide-react';

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'study', label: 'Study Goals', icon: Target },
  { id: 'notifications', label: 'MindGuard & Alerts', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
];

export default function Settings() {
  const { user } = useAuth();
  const [section, setSection] = useState('profile');
  const [saved, setSaved] = useState(false);

  const [prefs, setPrefs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('daydive_prefs') || '{}');
    } catch { return {}; }
  });

  const dailyGoal = prefs.dailyGoal ?? 120;
  const pomodoroWork = prefs.pomodoroWork ?? 25;
  const pomodoroBreak = prefs.pomodoroBreak ?? 5;
  const nudgeAlerts = prefs.nudgeAlerts ?? true;
  const strictMode = prefs.strictMode ?? false;

  const updatePref = (key, val) => {
    const next = { ...prefs, [key]: val };
    setPrefs(next);
    localStorage.setItem('daydive_prefs', JSON.stringify(next));
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="flex min-h-screen bg-[#121212] text-white">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Settings</h1>
              <p className="text-[#8E8E93] text-sm mt-1">Manage your DayDive profile, goals, and focus preferences.</p>
            </div>
            {saved && (
              <span className="inline-flex items-center gap-1.5 bg-[#0F2922] border border-[#10B981]/40 text-[#10B981] text-xs font-semibold px-3 py-1.5 rounded-full">
                <Check size={14} /> Saved
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-3 space-y-1">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const active = section === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSection(s.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-[12px] text-sm font-semibold transition ${
                      active
                        ? 'bg-[#232325] text-[#FF841C] border border-[#2E2E32]'
                        : 'text-[#8E8E93] hover:text-white hover:bg-[#1A1A1A]'
                    }`}
                  >
                    <Icon size={16} />
                    {s.label}
                  </button>
                );
              })}
            </div>

            <div className="md:col-span-9 card p-6 md:p-8 space-y-6">
              {section === 'profile' && (
                <>
                  <div>
                    <h2 className="text-lg font-bold text-white">General Details</h2>
                    <p className="text-[#8E8E93] text-xs mt-0.5">Your account details synced with DayDive.</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#8E8E93] mb-1.5">Full Name</label>
                      <input type="text" readOnly value={user?.full_name || '—'} className="input-field text-sm opacity-80" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#8E8E93] mb-1.5">Username</label>
                      <input type="text" readOnly value={user?.username || '—'} className="input-field text-sm opacity-80" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#8E8E93] mb-1.5">Email Address</label>
                    <input type="email" readOnly value={user?.email || '—'} className="input-field text-sm opacity-80" />
                  </div>
                </>
              )}

              {section === 'study' && (
                <>
                  <div>
                    <h2 className="text-lg font-bold text-white">Study Goals &amp; Defaults</h2>
                    <p className="text-[#8E8E93] text-xs mt-0.5">Customize your daily target and Pomodoro intervals.</p>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#8E8E93] mb-1.5">Daily Goal (min)</label>
                      <input type="number" min="15" max="600" value={dailyGoal} onChange={(e) => updatePref('dailyGoal', Number(e.target.value))} className="input-field text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#8E8E93] mb-1.5">Focus Sprint (min)</label>
                      <input type="number" min="5" max="120" value={pomodoroWork} onChange={(e) => updatePref('pomodoroWork', Number(e.target.value))} className="input-field text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#8E8E93] mb-1.5">Break (min)</label>
                      <input type="number" min="1" max="60" value={pomodoroBreak} onChange={(e) => updatePref('pomodoroBreak', Number(e.target.value))} className="input-field text-sm" />
                    </div>
                  </div>
                </>
              )}

              {section === 'notifications' && (
                <>
                  <div>
                    <h2 className="text-lg font-bold text-white">MindGuard &amp; Alerts</h2>
                    <p className="text-[#8E8E93] text-xs mt-0.5">Control how DayDive nudges you when focus drifts.</p>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-4 bg-[#232325] border border-[#2E2E32] rounded-[14px] cursor-pointer">
                      <div>
                        <p className="text-sm font-semibold text-white">Focus Drift Nudges</p>
                        <p className="text-xs text-[#8E8E93]">Show browser notifications when you leave your study goal.</p>
                      </div>
                      <input type="checkbox" checked={nudgeAlerts} onChange={(e) => updatePref('nudgeAlerts', e.target.checked)} className="accent-[#FF841C] w-4 h-4" />
                    </label>
                    <label className="flex items-center justify-between p-4 bg-[#232325] border border-[#2E2E32] rounded-[14px] cursor-pointer">
                      <div>
                        <p className="text-sm font-semibold text-white">Strict Blocklist Mode</p>
                        <p className="text-xs text-[#8E8E93]">Immediately redirect blocked domains during active sessions.</p>
                      </div>
                      <input type="checkbox" checked={strictMode} onChange={(e) => updatePref('strictMode', e.target.checked)} className="accent-[#FF841C] w-4 h-4" />
                    </label>
                  </div>
                </>
              )}

              {section === 'appearance' && (
                <>
                  <div>
                    <h2 className="text-lg font-bold text-white">Theme Preferences</h2>
                    <p className="text-[#8E8E93] text-xs mt-0.5">Active DayDive visual system.</p>
                  </div>
                  <div className="p-4 bg-[#232325] border border-[#FF841C]/50 rounded-[16px] flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">Flat Dark &amp; Amber-Orange (Active)</p>
                      <p className="text-xs text-[#8E8E93] mt-0.5">Matte charcoal surfaces (#121212 / #1A1A1A) with amber highlights (#FF841C).</p>
                    </div>
                    <span className="w-6 h-6 rounded-full bg-[#10B981] flex items-center justify-center text-[#121212]">
                      <Check size={14} />
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}