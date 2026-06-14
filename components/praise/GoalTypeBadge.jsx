import { cn } from '@/lib/utils'

export function GoalTypeBadge({ type }) {
  const typeMap = {
    1: { label: 'By Value', className: 'bg-purple-100 text-purple-700 border-purple-200' },
    2: { label: 'By Date', className: 'bg-orange-100 text-orange-700 border-orange-200' },
    3: { label: 'By State', className: 'bg-teal-100 text-teal-700 border-teal-200' },
  }

  const config = typeMap[type] || { label: 'Unknown', className: 'bg-gray-100 text-gray-500 border-gray-200' }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        config.className
      )}
    >
      {config.label}
    </span>
  )
}
