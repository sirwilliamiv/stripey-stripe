"use client"
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDVR } from '@/engine/dvr'
import { deriveComplianceResult } from '@/engine/compliance'

export function ComplianceBorder() {
  const currentEvent = useDVR((s) => s.currentEvent)
  const [color, setColor] = useState('#22C55E')
  const [label, setLabel] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const states = currentEvent?.complianceStates ?? ['idle']
    const result = deriveComplianceResult(states)
    const newColor = result.color

    if (newColor !== color) {
      setLabel(result.label)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        setColor(newColor)
        timeoutRef.current = setTimeout(() => setLabel(null), 2000)
      }, 800)
    }
  }, [currentEvent, color])

  return (
    <>
      {/* Border ring */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-50"
        animate={{ boxShadow: `inset 0 0 0 4px ${color}` }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />
      {/* State label overlay */}
      <AnimatePresence>
        {label && (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="pointer-events-none fixed top-14 left-1/2 z-50 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-mono font-semibold text-white shadow-lg"
            style={{ backgroundColor: color }}
          >
            entering {label.toLowerCase()}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
