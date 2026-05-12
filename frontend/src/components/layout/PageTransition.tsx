import { AnimatePresence, motion } from 'framer-motion'
import { Outlet, useRouterState } from '@tanstack/react-router'

export function PageTransition() {
  const { location } = useRouterState()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10, filter: 'blur(3px)' }}
        animate={{ opacity: 1, y: 0,  filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -6,   filter: 'blur(2px)' }}
        transition={{ duration: 0.24, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex-1 flex flex-col"
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  )
}
