import { Circle, CircleDot } from 'lucide-react'

const STATUS_CONFIG = {
  focused: { label: 'YOU ARE FOCUSED', short: 'Focused', color: 'text-focus', dot: 'bg-focus' },
  distracted: { label: 'DISTRACTED', short: 'Distracted', color: 'text-distract', dot: 'bg-distract' },
  monitoring: { label: 'MONITORING', short: 'Monitoring', color: 'text-brand-light', dot: 'bg-brand-light' },
}

export default function FocusStatus({ status = 'monitoring', large = false }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.monitoring
  const Icon = status === 'monitoring' ? Circle : CircleDot

  return (
    <div className={`inline-flex items-center gap-2 ${config.color}`}>
      <span className={`w-2 h-2 rounded-full ${config.dot} ${status !== 'monitoring' ? 'animate-pulse' : ''}`} />
      <Icon size={large ? 16 : 13} className="hidden" />
      <span className={large ? 'text-sm font-semibold tracking-wide' : 'text-xs font-medium'}>
        {large ? config.label : config.short}
      </span>
    </div>
  )
}
