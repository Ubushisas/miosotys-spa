'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IconLayoutDashboard,
  IconUsers,
  IconCalendar,
  IconBriefcase,
  IconRobot,
  IconSettings,
  IconSparkles,
  IconCalendarEvent,
  IconMessageCircle,
} from '@tabler/icons-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const navItems = [
    { href: '/admin/settings', icon: IconSettings, label: 'Configuración' },
  ]

  const getColorClasses = (isActive: boolean) => {
    if (!isActive) {
      return 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
    }
    return 'bg-primary text-primary-foreground border-l-4 border-foreground'
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <motion.aside
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-64 bg-card border-r border-border flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-border">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <IconSparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Miosotys
                </h1>
                <p className="text-xs text-muted-foreground">Gestión de Spa</p>
              </div>
            </motion.div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <AnimatePresence>
              {navItems.map((item, index) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <motion.div
                    key={item.href}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${getColorClasses(isActive)}`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs text-muted-foreground font-medium">Sistema Activo</p>
              <p className="text-xs text-muted-foreground mt-0.5">Todas las funciones disponibles</p>
            </div>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-muted/30">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="min-h-full p-6 md:p-8"
          >
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
