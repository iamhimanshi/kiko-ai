export default function MetricCard({ icon: Icon, label, value, sublabel, change, changeType, iconBg, iconColor }) {
  const isUp = changeType === 'up';
  return (
    <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[#6B7280] text-sm">{label}</p>
          <p className="text-2xl font-bold text-[#1F2937] mt-1 truncate">{value}</p>
          {change != null && (
            <p className={`text-xs font-medium mt-1 ${isUp ? 'text-[#2E7D32]' : 'text-[#D14343]'}`}>
              {isUp ? '↑' : '↓'} {Math.abs(change)}%
            </p>
          )}
          {sublabel && <p className="text-[#9CA3AF] text-xs mt-1">{sublabel}</p>}
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg || 'bg-[#EEF7F0]'}`}>
            <Icon className={iconColor || 'text-[#1B4332]'} size={22} />
          </div>
        )}
      </div>
    </div>
  );
}