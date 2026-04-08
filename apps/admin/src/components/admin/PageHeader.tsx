import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface PageHeaderProps {
  icon?: React.ReactNode
  title: string
  subtitle?: string
  count?: number
  actions?: React.ReactNode
  backTo?: string
  backLabel?: string
}

export function PageHeader({ icon, title, subtitle, count, actions, backTo, backLabel }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="flex items-start justify-between mb-7">
      <div className="flex items-center gap-3.5">
        {backTo && (
          <button
            onClick={() => navigate(backTo)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] transition-colors"
            style={{
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={14} />
            {backLabel ?? 'Назад'}
          </button>
        )}

        <div>
          <div className="flex items-center gap-2.5 mb-1">
            {icon && <span className="shrink-0" style={{ color: 'var(--primary)' }}>{icon}</span>}
            <h1 className="m-0 text-[22px] font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
              {title}
            </h1>
            {count !== undefined && count > 0 && (
              <span
                className="px-2.5 py-0.5 rounded-full text-[12px] font-bold"
                style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}
              >
                {count}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="m-0 text-[13px]" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}
