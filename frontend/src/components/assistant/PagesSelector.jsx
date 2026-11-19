const MODES = [
  { id: 'all', label: 'Entire document' },
  { id: 'range', label: 'Page range' },
  { id: 'individual', label: 'Pick pages' },
];

export default function PagesSelector({
  pageCount, mode, setMode, rangeStart, setRangeStart,
  rangeEnd, setRangeEnd, selectedPages, togglePage,
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
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
              mode === m.id
                ? 'bg-[#E66A10] text-white'
                : 'bg-[#232325] border border-[#2E2E32] text-[#8E8E93] hover:text-white'
            }`}
          >
            {m.id === 'all' ? `${m.label} (${pageCount})` : m.label}
          </button>
        ))}
      </div>

      {mode === 'range' && (
        <div className="flex items-center gap-3">
          <input
            type="number" min="1" max={pageCount} value={rangeStart}
            onChange={(e) => setRangeStart(Number(e.target.value))}
            className="w-20 bg-[#232325] border border-[#2E2E32] rounded-[12px] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FF841C]"
          />
          <span className="text-[#8E8E93] text-sm">to</span>
          <input
            type="number" min="1" max={pageCount} value={rangeEnd}
            onChange={(e) => setRangeEnd(Number(e.target.value))}
            className="w-20 bg-[#232325] border border-[#2E2E32] rounded-[12px] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FF841C]"
          />
          <span className="text-[#8E8E93] text-xs">of {pageCount}</span>
        </div>
      )}

      {mode === 'individual' && (
        <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => togglePage(n)}
              className={`w-9 h-9 rounded-[10px] text-xs font-semibold transition ${
                selectedPages.includes(n)
                  ? 'bg-[#E66A10] text-white'
                  : 'bg-[#232325] border border-[#2E2E32] text-[#8E8E93] hover:text-white'
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
