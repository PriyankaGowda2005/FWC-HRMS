import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'

/**
 * PageTransition Component - FWC Design System
 * Provides smooth page transitions for better UX
 */
const PageTransition = ({ children }) => {
  const location = useLocation()

  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
      scale: 0.98
    },
    in: {
      opacity: 1,
      y: 0,
      scale: 1
    },
    out: {
      opacity: 0,
      y: -20,
      scale: 1.02
    }
  }

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.3
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

export default PageTransition
