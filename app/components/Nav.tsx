'use client';

import { SignUpButton } from '@clerk/nextjs';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

import { MagpieLogo } from './ui/MagpieLogo';
import { ClerkButton } from './ui/ClerkButton';

export default function Nav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 lg:px-8">
        <a
          href="#"
          className="flex items-center gap-2 text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <MagpieLogo className="h-8 w-8" />
          <span className="text-lg font-semibold">magpie</span>
        </a>
        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#how-it-works"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            How it works
          </a>
          <SignUpButton
            mode="modal"
            forceRedirectUrl="/onboarding"
            signInForceRedirectUrl="/onboarding"
          >
            <ClerkButton
              type="button"
              className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              Get Started
            </ClerkButton>
          </SignUpButton>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full p-2 text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 md:hidden"
          aria-label="Toggle menu"
          aria-expanded={isOpen}
          aria-controls="mobile-nav"
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {isOpen ? (
        <div
          id="mobile-nav"
          className="border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-md md:hidden"
        >
          <div className="flex flex-col gap-4">
            <a
              href="#how-it-works"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              onClick={() => setIsOpen(false)}
            >
              How it works
            </a>
            <SignUpButton
              mode="modal"
              forceRedirectUrl="/onboarding"
              signInForceRedirectUrl="/onboarding"
            >
              <ClerkButton
                type="button"
                className="w-full rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                Get Started
              </ClerkButton>
            </SignUpButton>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
