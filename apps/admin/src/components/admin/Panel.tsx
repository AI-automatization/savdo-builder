import { cn } from '@/lib/utils'

interface PanelProps {
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function Panel({ title, subtitle, icon, children, className }: PanelProps) {
  return (
    <div
      className={cn('rounded-xl p-6', className)}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      {(title || icon) && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-0.5">
            {icon && <span className="shrink-0" style={{ color: 'var(--primary)' }}>{icon}</span>}
            {title && (
              <h3 className="m-0 text-[15px] font-bold" style={{ color: 'var(--text)' }}>{title}</h3>
            )}
          </div>
          {subtitle && (
            <p className="m-0 text-[13px]" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
