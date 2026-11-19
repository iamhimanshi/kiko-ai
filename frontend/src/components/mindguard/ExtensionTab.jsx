import { useState, useEffect } from 'react';
import { mindguardApi } from '../../services/api';
import { Loader2, Chrome, Check, X, RefreshCw, Shield } from 'lucide-react';

export default function ExtensionTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await mindguardApi.extensionStatus();
      setData(res.data);
    } catch { /* */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-6">
      <div className="card p-8">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-[#232325] border border-[#2E2E32] rounded-2xl flex items-center justify-center flex-shrink-0">
            <Chrome className="text-[#FF841C]" size={26} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-1">DayDive Chrome Extension</h2>
            <p className="text-[#8E8E93] text-sm mb-4">
              Monitor your browser activity while you study.
            </p>

            {loading && !data ? (
              <div className="flex items-center gap-2 text-[#8E8E93] text-sm">
                <Loader2 size={14} className="animate-spin text-[#FF841C]" /> Checking status...
              </div>
            ) : data?.connected ? (
              <div className="flex items-center gap-2 bg-[#0F2922] border border-[#10B981]/30 text-[#10B981] px-3.5 py-2 rounded-full text-sm font-semibold w-fit">
                <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                Connected
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-[#2D1616] border border-[#EF4444]/30 text-[#EF4444] px-3.5 py-2 rounded-full text-sm font-semibold w-fit">
                <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
                Not Connected
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={load}
            className="text-[#8E8E93] hover:text-white p-2 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-[#FF841C]' : ''} />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#2E2E32]">
          <div>
            <p className="text-[#8E8E93] text-xs uppercase tracking-wider font-bold mb-1">Version</p>
            <p className="text-white text-sm font-semibold">{data?.version || '—'}</p>
          </div>
          <div>
            <p className="text-[#8E8E93] text-xs uppercase tracking-wider font-bold mb-1">Session</p>
            <p className="text-white text-sm font-semibold">
              {data?.active_session_id ? `#${data.active_session_id}` : 'No active session'}
            </p>
          </div>
          <div>
            <p className="text-[#8E8E93] text-xs uppercase tracking-wider font-bold mb-1">Last seen</p>
            <p className="text-white text-sm font-semibold">
              {data?.last_seen_at ? new Date(data.last_seen_at).toLocaleTimeString() : '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Chrome size={16} className="text-[#FF841C]" />
          Installation
        </h3>
        <ol className="space-y-3 text-sm text-[#D1D5DB]">
          {[
            'Open Chrome and go to chrome://extensions',
            'Enable Developer mode (top-right toggle)',
            'Click "Load unpacked" and select the extension/ folder',
            'Sign in to the extension with your DayDive account',
            'Start a study session — MindGuard activates automatically',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 bg-[#232325] border border-[#2E2E32] text-[#FF841C] rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-[#261A10] border border-[#FF841C]/35 rounded-[18px] p-6">
        <div className="flex items-start gap-3">
          <Shield className="text-[#FF841C] flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="text-sm font-bold text-white mb-2">Your Privacy</h3>
            <p className="text-[#D1D5DB] text-sm mb-4">
              MindGuard only monitors browser activity while a Study Session is active.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[#10B981] font-semibold mb-2">DayDive uses:</p>
                <ul className="space-y-1 text-[#D1D5DB] text-xs">
                  <li className="flex items-center gap-2"><Check size={12} className="text-[#10B981]" /> Website / domain</li>
                  <li className="flex items-center gap-2"><Check size={12} className="text-[#10B981]" /> Page title</li>
                  <li className="flex items-center gap-2"><Check size={12} className="text-[#10B981]" /> Activity duration</li>
                  <li className="flex items-center gap-2"><Check size={12} className="text-[#10B981]" /> Tab changes</li>
                </ul>
              </div>
              <div>
                <p className="text-[#EF4444] font-semibold mb-2">DayDive never collects:</p>
                <ul className="space-y-1 text-[#D1D5DB] text-xs">
                  <li className="flex items-center gap-2"><X size={12} className="text-[#EF4444]" /> Passwords</li>
                  <li className="flex items-center gap-2"><X size={12} className="text-[#EF4444]" /> Form contents</li>
                  <li className="flex items-center gap-2"><X size={12} className="text-[#EF4444]" /> Keystrokes</li>
                  <li className="flex items-center gap-2"><X size={12} className="text-[#EF4444]" /> Personal messages</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}