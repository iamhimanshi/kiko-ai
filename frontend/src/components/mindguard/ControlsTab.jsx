import { useState, useEffect } from 'react';
import { mindguardApi } from '../../services/api';
import { Loader2, Plus, Trash2, Shield, AlertCircle, X } from 'lucide-react';

export default function ControlsTab() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await mindguardApi.listBlocked();
      setSites(res.data);
    } catch { /* */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const domain = newDomain.trim();
    if (!domain) return;
    setError('');
    setAdding(true);
    try {
      await mindguardApi.addBlocked(domain);
      setNewDomain('');
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not add website.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await mindguardApi.deleteBlocked(id);
      setSites((prev) => prev.filter((s) => s.id !== id));
    } catch { /* */ }
  };

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6">
        <div className="flex items-center gap-2 mb-1">
          <Shield size={18} className="text-[#1B4332]" />
          <h2 className="text-lg font-semibold text-[#1F2937]">Website Blocking</h2>
        </div>
        <p className="text-[#6B7280] text-sm mb-5">
          Block distracting websites during active study sessions.
        </p>

        {error && (
          <div className="bg-[#FDECEC] border border-[#D14343]/30 text-[#D14343] px-4 py-3 rounded-[14px] mb-4 text-sm flex items-start justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-[#D14343]/70 hover:text-[#D14343]">
              <X size={14} />
            </button>
          </div>
        )}

        <form onSubmit={handleAdd} className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="e.g. instagram.com"
            className="flex-1 min-w-[200px] bg-white border border-[#E8ECE7] rounded-[14px] px-4 py-3 text-[#1F2937] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] transition-all text-sm"
          />
          <button
            type="submit"
            disabled={adding || !newDomain.trim()}
            className="bg-[#1B4332] hover:bg-[#24543F] text-white px-5 py-3 rounded-[14px] font-medium transition flex items-center gap-2 disabled:opacity-50"
          >
            {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Block
          </button>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#1F2937]">Blocked Websites</h3>
          <span className="text-[#6B7280] text-xs">
            {sites.length} {sites.length === 1 ? 'site' : 'sites'}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-[#6B7280] gap-2">
            <Loader2 size={16} className="animate-spin" /> Loading...
          </div>
        ) : sites.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#1F2937] text-sm font-medium">No websites blocked yet</p>
            <p className="text-[#6B7280] text-xs mt-1">
              Add a website above to block it during study sessions.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sites.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 p-3 bg-[#F8F7F2] rounded-[12px] hover:bg-[#FDECEC]/40 transition group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-[#D14343] flex-shrink-0" />
                  <span className="text-[#1F2937] text-sm font-medium truncate">{s.domain}</span>
                </div>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="text-[#9CA3AF] hover:text-[#D14343] p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition"
                  title="Remove"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-[#FFF8E8] border border-[#D4A64A]/30 rounded-[18px] p-5">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-[#D4A64A] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[#4D3A11] mb-1">How blocking works</p>
            <p className="text-[#4B5563] text-xs leading-relaxed">
              Blocked websites are inaccessible while a study session is active.
              You'll be shown a Focus Screen with the option to return to study.
              Blocking is automatically disabled when the session ends.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}