interface InfoRowProps {
  label: string
  children: React.ReactNode
  border?: boolean
}

export function InfoRow({ label, children, border = true }: InfoRowProps) {
  return (
    <div
      className="flex items-start gap-3 py-2.5"
      style={{ borderBottom: border ? '1px solid var(--border)' : 'none' }}
    >
      <span
        className="shrink-0 text-[13px] pt-0.5"
        style={{ width: 130, color: 'var(--text-muted)' }}
      >
        {label}
      </span>
      <div className="flex-1">{children}</div>
    </div>
  )
}
