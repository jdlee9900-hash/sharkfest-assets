'use client'

import { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils'

export interface StepConfig {
  label: string
  description?: string
}

export interface SharkFormStepProps {
  steps: StepConfig[]
  currentStep: number
  onNext: () => void
  onBack: () => void
  onSubmit?: () => void
  children: ReactNode
  className?: string
}

export function SharkFormStep({ steps, currentStep, onNext, onBack, onSubmit, children, className }: SharkFormStepProps) {
  const isFirst = currentStep === 0
  const isLast = currentStep === steps.length - 1

  return (
    <div className={cn('w-full max-w-lg', className)}>
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center gap-0 mb-3">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-body font-semibold flex-none transition-all duration-300',
                  i < currentStep
                    ? 'bg-[#22c55e] text-white'
                    : i === currentStep
                    ? 'bg-[#0f172a] text-white ring-4 ring-[rgba(15,23,42,0.15)]'
                    : 'bg-[#f1f5f9] text-[#94a3b8]',
                )}
              >
                {i < currentStep ? (
                  <svg width="12" height="9" viewBox="0 0 12 9" fill="none"><path d="M1 4.5l3.5 3.5L11 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ) : (
                  i + 1
                )}
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-1 transition-colors duration-300" style={{ backgroundColor: i < currentStep ? '#22c55e' : '#e2e8f0' }} />
              )}
            </div>
          ))}
        </div>
        <div>
          <p className="text-xs text-[#94a3b8] font-body">
            Step {currentStep + 1} of {steps.length}
          </p>
          <p className="font-display text-[#0f172a] text-2xl">
            {steps[currentStep]?.label}
          </p>
          {steps[currentStep]?.description && (
            <p className="text-sm text-[#64748b] mt-1">{steps[currentStep].description}</p>
          )}
        </div>
      </div>

      {/* Step content with slide animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
          className="mb-8"
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-[#f1f5f9]">
        <button
          type="button"
          onClick={onBack}
          disabled={isFirst}
          className="text-sm font-body font-medium text-[#64748b] hover:text-[#0f172a] disabled:opacity-0 disabled:pointer-events-none transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={isLast ? onSubmit : onNext}
          className="inline-flex items-center gap-2 bg-[#0f172a] text-white font-body font-semibold text-sm px-6 py-2.5 rounded-[8px] hover:bg-[#1e293b] transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[rgba(251,191,36,0.4)]"
        >
          {isLast ? 'Submit registration' : 'Continue'}
        </button>
      </div>
    </div>
  )
}
