import { AnimatePresence, motion } from 'framer-motion'
import { Outlet, useRouterState } from '@tanstack/react-router'

export function PageTransition() {
  const { location } = useRouterState()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex-1 flex flex-col"
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  )
}
