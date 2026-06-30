"use client"
import { useDVR } from '@/engine/dvr'
import { deriveComplianceResult } from '@/engine/compliance'
import { motion } from 'framer-motion'

interface Props {
  children: React.ReactNode
}

export function ComplianceBorder({ children }: Props) {
  const currentEvent = useDVR((s) => s.currentEvent)
  const states = currentEvent?.complianceStates ?? []
  const result = deriveComplianceResult(states)

  return (
    <motion.div
      className="relative w-full h-full"
      animate={{ boxShadow: `0 0 0 3px ${result.color}` }}
      transition={{ duration: 0.4 }}
      style={{ borderRadius: 8 }}
    >
      <div
        className="absolute inset-0 pointer-events-none rounded-lg transition-all duration-400"
        style={{ border: `3px solid ${result.color}` }}
        aria-label={`Compliance state: ${result.label}`}
      />
      {children}
    </motion.div>
  )
}
