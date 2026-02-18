import { BookOpen, DollarSign, Home, Settings, ShoppingCart } from 'lucide-react';

export const dashboardNavItems = [
  {
    label: 'Home',
    href: '/dashboard',
    icon: Home,
    showInBottomNav: true
  },
  {
    label: 'Find Money',
    href: '/dashboard/search',
    icon: DollarSign,
    showInBottomNav: true
  },
  {
    label: 'My Knowledge Base',
    href: '/dashboard/knowledge',
    icon: BookOpen,
    showInBottomNav: true
  },
  {
    label: 'Cart',
    href: '/dashboard/cart',
    icon: ShoppingCart,
    showInBottomNav: true
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    showInBottomNav: false
  }
] as const;

export type DashboardNavItem = (typeof dashboardNavItems)[number];
