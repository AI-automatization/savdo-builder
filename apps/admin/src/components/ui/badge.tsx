import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:   'bg-zinc-800 text-zinc-300 border border-zinc-700',
        success:   'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        warning:   'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        danger:    'bg-red-500/10 text-red-400 border border-red-500/20',
        info:      'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
        muted:     'bg-zinc-900 text-zinc-500 border border-zinc-800',
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
