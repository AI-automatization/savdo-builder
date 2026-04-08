interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  subtitle?: string
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="mb-3 opacity-30" style={{ color: 'var(--text-muted)' }}>
          {icon}
        </div>
      )}
      <p className="m-0 text-[15px] font-semibold" style={{ color: 'var(--text-muted)' }}>
        {title}
      </p>
      {subtitle && (
        <p className="m-0 mt-1 text-[13px]" style={{ color: 'var(--text-dim)' }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
