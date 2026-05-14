import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// ADMIN-THEME-VARS-MIGRATE-001: Badge переведён на CSS-vars (см. index.css
// `.badge-*` классы). Light theme работает автоматически.
const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:   'badge-default',
        success:   'badge-success',
        warning:   'badge-warning',
        danger:    'badge-danger',
        info:      'badge-info',
        muted:     'badge-muted',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
