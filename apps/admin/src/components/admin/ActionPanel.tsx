interface ActionPanelProps {
  title?: string
  children: React.ReactNode
}

export function ActionPanel({ title = 'Действия', children }: ActionPanelProps) {
  return (
    <div
      className="rounded-xl p-6"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      <h3 className="m-0 mb-4 text-[15px] font-bold" style={{ color: 'var(--text)' }}>
        {title}
      </h3>
      <div className="flex flex-col gap-2.5">
        {children}
      </div>
    </div>
  )
}
