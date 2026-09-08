export default function MetricCard({ label, value, sublabel, prominent = false }) {
  return (
    <div
      className={`rounded-lg border p-6 ${
        prominent
          ? 'bg-brand-soft border-brand/40'
          : 'bg-card border-border'
      }`}
    >
      <p className="text-xs text-subtle mb-2">{label}</p>
      <p className={`font-display font-semibold ${prominent ? 'text-3xl text-brand-light' : 'text-2xl text-ink'}`}>
        {value}
      </p>
      {sublabel && <p className="text-xs text-muted mt-1">{sublabel}</p>}
    </div>
  )
}
