import { useEffect, useRef } from 'react'
import { useInView, useMotionValue, useSpring } from 'framer-motion'
import { cn } from '@/lib/utils'

interface NumberTickerProps {
  value: number
  className?: string
  decimalPlaces?: number
}

export function NumberTicker({ value, className, decimalPlaces = 0 }: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(0)
  // BUG-3: было { damping:60, stiffness:100 } → ζ≈3 (сильно overdamped),
  // счётчик полз к значению 10-20с, на Railway cold-start выглядело как
  // «застрявший 0». Новые параметры: ζ≈1.37 (без overshoot, settle ~0.8с).
  const springValue = useSpring(motionValue, { damping: 30, stiffness: 120 })
  const isInView = useInView(ref, { once: true, margin: '0px' })

  useEffect(() => {
    if (isInView) motionValue.set(value)
  }, [isInView, motionValue, value])

  useEffect(() => {
    return springValue.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent = Intl.NumberFormat('ru-RU').format(
          parseFloat(latest.toFixed(decimalPlaces)),
        )
      }
    })
  }, [springValue, decimalPlaces])

  return <span ref={ref} className={cn('tabular-nums', className)}>0</span>
}
