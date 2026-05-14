import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// ADMIN-THEME-VARS-MIGRATE-001: variants теперь используют CSS-vars из index.css,
// чтобы light theme работала автоматически. Hover/focus — через семантические
// токены (--primary, --surface2, --surface-error). Indigo-цвет primary остался
// тот же — заданный в --primary.
const buttonVariants = cva(
  'btn-base inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:   'btn-primary',
        secondary: 'btn-secondary',
        ghost:     'btn-ghost',
        danger:    'btn-danger',
        outline:   'btn-outline',
      },
      size: {
        default: 'h-8 px-3 py-1.5',
        sm:      'h-7 px-2.5 text-xs',
        lg:      'h-10 px-4',
        icon:    'h-8 w-8 p-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
