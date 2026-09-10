const MODES = [
  { id: 'all', label: 'Entire document' },
  { id: 'range', label: 'Page range' },
  { id: 'individual', label: 'Pick pages' },
];

export default function PagesSelector({
  pageCount,
  mode,
  setMode,
  rangeStart,
  setRangeStart,
  rangeEnd,
  setRangeEnd,
  selectedPages,
  togglePage,
}) {
  if (!pageCount) return null;

  return (
    <div>
      <div className="flex gap-2 mb-3 flex-wrap">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              mode === m.id
                ? 'bg-[#1B4332] text-white'
                : 'bg-white border border-[#E8ECE7] text-[#4B5563] hover:bg-[#EDF4EE]'
            }`}
          >
            {m.id === 'all' ? `${m.label} (${pageCount})` : m.label}
          </button>
        ))}
      </div>

      {mode === 'range' && (
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="1"
            max={pageCount}
            value={rangeStart}
            onChange={(e) => setRangeStart(Number(e.target.value))}
            className="w-20 bg-white border border-[#E8ECE7] rounded-[12px] px-3 py-2 text-sm text-[#1F2937] focus:outline-none focus:border-[#1B4332]"
          />
          <span className="text-[#9CA3AF] text-sm">to</span>
          <input
            type="number"
            min="1"
            max={pageCount}
            value={rangeEnd}
            onChange={(e) => setRangeEnd(Number(e.target.value))}
            className="w-20 bg-white border border-[#E8ECE7] rounded-[12px] px-3 py-2 text-sm text-[#1F2937] focus:outline-none focus:border-[#1B4332]"
          />
          <span className="text-[#9CA3AF] text-xs">of {pageCount}</span>
        </div>
      )}

      {mode === 'individual' && (
        <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => togglePage(n)}
              className={`w-9 h-9 rounded-[10px] text-xs font-medium transition ${
                selectedPages.includes(n)
                  ? 'bg-[#1B4332] text-white'
                  : 'bg-white border border-[#E8ECE7] text-[#4B5563] hover:bg-[#EDF4EE]'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
