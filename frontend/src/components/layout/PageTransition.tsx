import { AnimatePresence, motion } from 'framer-motion'
import { Outlet, useRouterState } from '@tanstack/react-router'

export function PageTransition() {
  const { location } = useRouterState()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: 'easeInOut' }}
        style={{ willChange: 'opacity' }}
        className="flex-1 flex flex-col"
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  )
}
