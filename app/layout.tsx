import './globals.css';

import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'Magpie — Win local scholarships faster',
  description:
    'Magpie finds local scholarships with real win rates and eliminates repetitive applications. Upload once, apply in minutes, and track every deadline.',
  metadataBase: new URL('https://magpie.com'),
  openGraph: {
    title: 'Magpie — Win local scholarships faster',
    description:
      'Find local scholarships with fewer applicants and auto-fill your profile to apply in minutes.',
    type: 'website'
  }
};

export default function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.variable}>
        <body className="font-sans">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-900 focus:ring-2 focus:ring-blue-600"
          >
            Skip to content
          </a>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
