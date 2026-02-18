'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Menu, X } from 'lucide-react';

import { MagpieLogo } from '@/app/components/ui/MagpieLogo';

import { Sidebar } from './Sidebar';
import { dashboardNavItems } from './navItems';

interface DashboardShellProps {
  children: ReactNode;
  firstName?: string | null;
}

export function DashboardShell({ children, firstName }: DashboardShellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-60 flex-col border-r border-slate-200 bg-white md:flex">
        <Sidebar firstName={firstName} />
      </aside>

      <div className="flex min-h-screen flex-1 flex-col md:h-screen">
        <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <MagpieLogo className="h-7 w-7" />
            <span className="text-base font-semibold text-slate-900">magpie</span>
          </Link>
          <button
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={isOpen}
            className="inline-flex items-center justify-center rounded-full p-2 text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            onClick={() => setIsOpen((open) => !open)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <main
          id="main-content"
          className="flex-1 overflow-y-auto px-4 pb-24 pt-6 md:px-8 md:pb-8"
        >
          {children}
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white md:hidden">
        <div className="flex items-center justify-around px-3 py-2">
          {dashboardNavItems
            .filter((item) => item.showInBottomNav)
            .map((item) => {
              const isActive =
                item.href === '/dashboard'
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
                    isActive ? 'text-blue-600' : 'text-slate-500'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
        </div>
      </nav>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            className="fixed inset-0 z-50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
          >
            <div
              className="absolute inset-0 bg-slate-900/30"
              role="button"
              tabIndex={0}
              aria-label="Close navigation"
              onClick={() => setIsOpen(false)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setIsOpen(false);
              }}
            />
            <motion.aside
              className="relative h-full w-72 bg-white shadow-xl"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.3, ease: 'easeOut' }}
            >
              <Sidebar firstName={firstName} />
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
