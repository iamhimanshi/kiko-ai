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
      {/* Connection card */}
      <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-8">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-[#EEF7F0] rounded-2xl flex items-center justify-center flex-shrink-0">
            <Chrome className="text-[#1B4332]" size={26} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-[#1F2937] mb-1">KIKO AI Chrome Extension</h2>
            <p className="text-[#6B7280] text-sm mb-4">
              Monitor your browser activity while you study.
            </p>

            {loading && !data ? (
              <div className="flex items-center gap-2 text-[#6B7280] text-sm">
                <Loader2 size={14} className="animate-spin" /> Checking status...
              </div>
            ) : data?.connected ? (
              <div className="flex items-center gap-2 bg-[#EAF8EC] text-[#2E7D32] px-3 py-2 rounded-full text-sm font-medium w-fit">
                <div className="w-2 h-2 rounded-full bg-[#2E7D32] animate-pulse" />
                Connected
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-[#FDECEC] text-[#D14343] px-3 py-2 rounded-full text-sm font-medium w-fit">
                <div className="w-2 h-2 rounded-full bg-[#D14343]" />
                Not Connected
              </div>
            )}
          </div>
          <button
            onClick={load}
            className="text-[#6B7280] hover:text-[#1B4332] p-2 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#E8ECE7]/50">
          <div>
            <p className="text-[#9CA3AF] text-xs uppercase tracking-wider font-medium mb-1">Version</p>
            <p className="text-[#1F2937] text-sm font-medium">{data?.version || '—'}</p>
          </div>
          <div>
            <p className="text-[#9CA3AF] text-xs uppercase tracking-wider font-medium mb-1">Session</p>
            <p className="text-[#1F2937] text-sm font-medium">
              {data?.active_session_id ? `#${data.active_session_id}` : 'No active session'}
            </p>
          </div>
          <div>
            <p className="text-[#9CA3AF] text-xs uppercase tracking-wider font-medium mb-1">Last seen</p>
            <p className="text-[#1F2937] text-sm font-medium">
              {data?.last_seen_at ? new Date(data.last_seen_at).toLocaleTimeString() : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* How to install */}
      <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6">
        <h3 className="text-sm font-semibold text-[#1F2937] mb-4 flex items-center gap-2">
          <Chrome size={16} className="text-[#1B4332]" />
          Installation
        </h3>
        <ol className="space-y-3 text-sm text-[#4B5563]">
          {[
            'Open Chrome and go to chrome://extensions',
            'Enable Developer mode (top-right toggle)',
            'Click "Load unpacked" and select the extension/ folder',
            'Sign in to the extension with your KIKO account',
            'Start a study session — MindGuard activates automatically',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 bg-[#EEF7F0] text-[#1B4332] rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Privacy */}
      <div className="bg-[#FFF8E8] border border-[#D4A64A]/30 rounded-[18px] p-6">
        <div className="flex items-start gap-3">
          <Shield className="text-[#D4A64A] flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="text-sm font-semibold text-[#4D3A11] mb-3">Your Privacy</h3>
            <p className="text-[#4B5563] text-sm mb-4">
              MindGuard only monitors browser activity while a Study Session is active.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[#2E7D32] font-medium mb-2">KIKO uses:</p>
                <ul className="space-y-1 text-[#4B5563] text-xs">
                  <li className="flex items-center gap-2"><Check size={12} className="text-[#2E7D32]" /> Website / domain</li>
                  <li className="flex items-center gap-2"><Check size={12} className="text-[#2E7D32]" /> Page title</li>
                  <li className="flex items-center gap-2"><Check size={12} className="text-[#2E7D32]" /> Activity duration</li>
                  <li className="flex items-center gap-2"><Check size={12} className="text-[#2E7D32]" /> Tab changes</li>
                </ul>
              </div>
              <div>
                <p className="text-[#D14343] font-medium mb-2">KIKO never collects:</p>
                <ul className="space-y-1 text-[#4B5563] text-xs">
                  <li className="flex items-center gap-2"><X size={12} className="text-[#D14343]" /> Passwords</li>
                  <li className="flex items-center gap-2"><X size={12} className="text-[#D14343]" /> Form contents</li>
                  <li className="flex items-center gap-2"><X size={12} className="text-[#D14343]" /> Keystrokes</li>
                  <li className="flex items-center gap-2"><X size={12} className="text-[#D14343]" /> Personal messages</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}