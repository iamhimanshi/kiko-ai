export default function MetricCard({ icon: Icon, label, value, sublabel, change, changeType, iconBg, iconColor }) {
  const isUp = changeType === 'up';
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[#8E8E93] text-xs font-medium">{label}</p>
          <p className="text-2xl font-extrabold text-white mt-1 truncate">{value}</p>
          {change != null && (
            <p className={`text-xs font-semibold mt-1 ${isUp ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
              {isUp ? '↑' : '↓'} {Math.abs(change)}%
            </p>
          )}
          {sublabel && <p className="text-[#8E8E93] text-xs mt-1">{sublabel}</p>}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl border border-[#2E2E32] flex items-center justify-center flex-shrink-0 ${iconBg || 'bg-[#232325]'}`}>
            <Icon className={iconColor || 'text-[#FF841C]'} size={20} />
          </div>
        )}
      </div>
    </div>
  );
}