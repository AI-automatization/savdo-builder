import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
}

type BadgeVariant = {
  label: string
  className: string
}

const STATUS_MAP: Record<string, BadgeVariant> = {
  // success
  ACTIVE:       { label: 'Активен',        className: 'bg-green-500/12 text-green-500' },
  APPROVED:     { label: 'Одобрен',        className: 'bg-green-500/12 text-green-500' },
  VERIFIED:     { label: 'Верифицирован',  className: 'bg-green-500/12 text-green-500' },
  DELIVERED:    { label: 'Доставлен',      className: 'bg-green-500/12 text-green-500' },
  open:         { label: 'Открыт',         className: 'bg-green-500/12 text-green-500' },

  // warning
  PENDING:         { label: 'На проверке',    className: 'bg-amber-500/12 text-amber-400' },
  PENDING_REVIEW:  { label: 'Ожидает',        className: 'bg-amber-500/12 text-amber-400' },
  PROCESSING:      { label: 'Обработка',      className: 'bg-amber-500/12 text-amber-400' },
  CONFIRMED:       { label: 'Подтверждён',    className: 'bg-amber-500/12 text-amber-400' },
  SHIPPED:         { label: 'Отправлен',      className: 'bg-amber-500/12 text-amber-400' },

  // danger
  BLOCKED:     { label: 'Заблокирован',   className: 'bg-red-500/12 text-red-400' },
  REJECTED:    { label: 'Отклонён',       className: 'bg-red-500/12 text-red-400' },
  CANCELLED:   { label: 'Отменён',        className: 'bg-red-500/12 text-red-400' },
  closed:      { label: 'Закрыт',         className: 'bg-red-500/12 text-red-400' },

  // muted
  DRAFT:       { label: 'Черновик',       className: 'bg-slate-500/12 text-slate-400' },
  UNVERIFIED:  { label: 'Не верифицирован', className: 'bg-slate-500/12 text-slate-400' },

  // orange
  SUSPENDED:   { label: 'Приостановлен', className: 'bg-orange-500/12 text-orange-400' },
  ARCHIVED:    { label: 'Архив',          className: 'bg-orange-500/12 text-orange-400' },
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const cfg = STATUS_MAP[status]
  const label = cfg?.label ?? status
  const variantClass = cfg?.className ?? 'bg-slate-500/12 text-slate-400'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-[12px]',
        variantClass,
      )}
    >
      {label}
    </span>
  )
}
