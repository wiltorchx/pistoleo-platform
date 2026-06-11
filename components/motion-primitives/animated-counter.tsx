'use client'

import { useEffect, useState } from 'react'
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion'

interface AnimatedCounterProps {
  value: number
  duration?: number
}

export function AnimatedCounter({ value }: AnimatedCounterProps) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => Math.round(latest as number))
  const [displayValue, setDisplayValue] = useState('0')

  const spring = useSpring(count, {
    damping: 30,
    stiffness: 100,
    restDelta: 0.001,
  })

  useEffect(() => {
    spring.set(value)
  }, [value, spring])

  useEffect(() => {
    const unsubscribe = rounded.onChange((latest) => {
      setDisplayValue(latest.toLocaleString())
    })
    return () => unsubscribe()
  }, [rounded])

  return <motion.span>{displayValue}</motion.span>
}
