import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'flex h-8 w-full rounded-md px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    style={{
      background: 'var(--surface2)',
      border: '1px solid var(--border)',
      color: 'var(--text)',
      ...(props.style ?? {}),
    }}
    {...props}
  />
))
Input.displayName = 'Input'

export { Input }
