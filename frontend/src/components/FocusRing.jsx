/**
 * The KIKO signature element. A circular progress ring representing
 * focus score / session progress — reused wherever the app needs to
 * communicate "how much of this session was focused", tying every
 * page back to the core MindGuard concept instead of a generic bar chart.
 */
export default function FocusRing({ value = 0, size = 120, strokeWidth = 10, label, sublabel }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, value))
  const offset = circumference - (clamped / 100) * circumference

  const ringColor = clamped >= 75 ? '#22D3EE' : clamped >= 50 ? '#F59E0B' : '#F97316'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#29324A"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-semibold text-ink">{label ?? `${Math.round(clamped)}%`}</span>
        {sublabel && <span className="text-xs text-muted mt-0.5">{sublabel}</span>}
      </div>
    </div>
  )
}
