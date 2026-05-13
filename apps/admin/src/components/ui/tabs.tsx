import { createContext, useContext, useId, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

// ADMIN-A11Y-TABS-OTP-001: a11y Tabs primitive.
//
// Минимальный набор без зависимостей от Radix — для admin'а достаточно
// role=tablist + role=tab + aria-selected + roving-tabindex (через keyboard).
// Управление состоянием — controlled (родитель держит value/onValueChange).

interface TabsCtxValue<T extends string = string> {
  value: T
  onValueChange: (v: T) => void
  baseId: string
}
const TabsCtx = createContext<TabsCtxValue<string> | null>(null)

function useTabsCtx(): TabsCtxValue<string> {
  const ctx = useContext(TabsCtx)
  if (!ctx) throw new Error('Tabs.* must be used inside <Tabs>')
  return ctx
}

export function Tabs<T extends string>({
  value,
  onValueChange,
  children,
  className,
}: {
  value: T
  onValueChange: (v: T) => void
  children: ReactNode
  className?: string
}) {
  const baseId = useId()
  // Внутри context'а используем `string`-сигнатуру (тип-параметр T нужен только
  // в публичном API для удобства родителя). Каст безопасен — `(v: T) => void`
  // совместим с `(v: string) => void` контравариантно для T extends string.
  return (
    <TabsCtx.Provider value={{ value, onValueChange: onValueChange as (v: string) => void, baseId }}>
      <div className={className}>{children}</div>
    </TabsCtx.Provider>
  )
}

export function TabsList({ children, className, ariaLabel }: {
  children: ReactNode
  className?: string
  ariaLabel?: string
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn('flex gap-2 flex-wrap', className)}>
      {children}
    </div>
  )
}

export function TabsTrigger({
  value: triggerValue,
  children,
  className,
  style,
}: {
  value: string
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const { value, onValueChange, baseId } = useTabsCtx()
  const isSelected = value === triggerValue
  return (
    <button
      role="tab"
      type="button"
      id={`${baseId}-trigger-${triggerValue}`}
      aria-selected={isSelected}
      aria-controls={`${baseId}-panel-${triggerValue}`}
      tabIndex={isSelected ? 0 : -1}
      onClick={() => onValueChange(triggerValue)}
      onKeyDown={(e) => {
        // Стрелки переключают вкладки (roving-tabindex).
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
        e.preventDefault()
        const tablist = e.currentTarget.parentElement
        if (!tablist) return
        const tabs = Array.from(tablist.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
        const idx = tabs.indexOf(e.currentTarget)
        const next = e.key === 'ArrowLeft'
          ? (idx - 1 + tabs.length) % tabs.length
          : (idx + 1) % tabs.length
        tabs[next]?.focus()
        tabs[next]?.click()
      }}
      className={className}
      style={style}
    >
      {children}
    </button>
  )
}

export function TabsContent({
  value: panelValue,
  children,
  className,
}: {
  value: string
  children: ReactNode
  className?: string
}) {
  const { value, baseId } = useTabsCtx()
  if (value !== panelValue) return null
  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${panelValue}`}
      aria-labelledby={`${baseId}-trigger-${panelValue}`}
      tabIndex={0}
      className={className}
    >
      {children}
    </div>
  )
}
