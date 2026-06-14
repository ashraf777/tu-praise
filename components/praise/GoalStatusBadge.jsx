import { cn } from '@/lib/utils'

export function GoalStatusBadge({ status }) {
  const statusMap = {
    1: { label: 'Created', className: 'bg-slate-100 text-slate-700 border-slate-200' },
    2: { label: 'Baselined', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    3: { label: 'Successful', className: 'bg-green-100 text-green-700 border-green-200' },
    4: { label: 'Failed', className: 'bg-red-100 text-red-700 border-red-200' },
    5: { label: 'Archived', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    9: { label: 'Deleted', className: 'bg-gray-100 text-gray-500 border-gray-200' },
  }

  const config = statusMap[status] || { label: 'Unknown', className: 'bg-gray-100 text-gray-500 border-gray-200' }

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
