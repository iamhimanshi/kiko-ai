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
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-1">
          <Shield size={18} className="text-[#FF841C]" />
          <h2 className="text-lg font-bold text-white">Website Blocking</h2>
        </div>
        <p className="text-[#8E8E93] text-sm mb-5">
          Block distracting websites during active study sessions.
        </p>

        {error && (
          <div className="bg-[#2D1616] border border-[#EF4444]/40 text-[#EF4444] px-4 py-3 rounded-[14px] mb-4 text-sm flex items-start justify-between">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} className="text-[#EF4444]/70 hover:text-[#EF4444]">
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
            className="input-field flex-1 min-w-[200px] text-sm"
          />
          <button
            type="submit"
            disabled={adding || !newDomain.trim()}
            className="btn-primary px-5 py-3 flex items-center gap-2 disabled:opacity-50"
          >
            {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Block
          </button>
        </form>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">Blocked Websites</h3>
          <span className="text-[#8E8E93] text-xs font-medium">
            {sites.length} {sites.length === 1 ? 'site' : 'sites'}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-[#8E8E93] gap-2">
            <Loader2 size={16} className="animate-spin text-[#FF841C]" /> Loading...
          </div>
        ) : sites.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white text-sm font-semibold">No websites blocked yet</p>
            <p className="text-[#8E8E93] text-xs mt-1">Add a website above to block it during study sessions.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sites.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 p-3 bg-[#232325] border border-[#2E2E32] rounded-[12px] hover:border-[#EF4444]/40 transition group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-[#EF4444] flex-shrink-0" />
                  <span className="text-white text-sm font-medium truncate">{s.domain}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(s.id)}
                  className="text-[#8E8E93] hover:text-[#EF4444] p-1.5 rounded-lg transition"
                  title="Remove"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[#261A10] border border-[#FF841C]/35 rounded-[18px] p-5">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-[#FF841C] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-white mb-1">How blocking works</p>
            <p className="text-[#D1D5DB] text-xs leading-relaxed">
              Blocked websites are inaccessible while a study session is active.
              You&apos;ll be shown a Focus Screen with the option to return to study.
              Blocking is automatically disabled when the session ends.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}