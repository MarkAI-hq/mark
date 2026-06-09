'use client'

import { useCallback } from 'react'

export function useCelebration() {
  const celebrate = useCallback(async (type: 'cert' | 'plan' | 'milestone' = 'plan') => {
    try {
      const confetti = (await import('canvas-confetti')).default
      const opts = {
        cert: {
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#C9A84C', '#F0D080', '#FFFFFF', '#1E293B'],
        },
        plan: {
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#10B981', '#34D399', '#6EE7B7'],
        },
        milestone: {
          particleCount: 200,
          spread: 100,
          origin: { y: 0.5 },
          colors: ['#F59E0B', '#EF4444', '#3B82F6', '#10B981'],
          startVelocity: 40,
        },
      }
      confetti(opts[type])
    } catch {
      // confetti is optional — silently fail
    }
  }, [])

  return { celebrate }
}
