'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { UserButton } from '@clerk/nextjs';

import { MagpieLogo } from '@/app/components/ui/MagpieLogo';

import { dashboardNavItems } from './navItems';

interface SidebarProps {
  firstName?: string | null;
}

export function Sidebar({ firstName }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-full flex-col justify-between px-4 py-6">
      <div className="space-y-8">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <MagpieLogo className="h-8 w-8" />
          <span className="text-lg font-semibold text-slate-900">magpie</span>
        </Link>
        <nav className="space-y-1">
          {dashboardNavItems.map((item) => {
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
                className={`relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isActive ? (
                  <motion.span
                    layoutId="sidebar-pill"
                    className="absolute inset-0 rounded-xl bg-blue-50"
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                ) : null}
                <Icon className="relative z-10 h-4 w-4" />
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-3 border-t border-slate-200 pt-4">
        <UserButton appearance={{ elements: { avatarBox: 'h-9 w-9' } }} />
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {firstName ?? 'Student'}
          </p>
          <p className="text-xs text-slate-500">Account</p>
        </div>
      </div>
    </div>
  );
}
