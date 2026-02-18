'use client';

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

type ClerkButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  redirectUrl?: string | null;
  forceRedirectUrl?: string | null;
  fallbackRedirectUrl?: string | null;
  component?: string | null;
  afterSignUpUrl?: string | null;
  afterSignInUrl?: string | null;
  mode?: string | null;
  signUpUrl?: string | null;
  signInUrl?: string | null;
};

export const ClerkButton = forwardRef<HTMLButtonElement, ClerkButtonProps>(
  (
    {
      redirectUrl,
      forceRedirectUrl,
      fallbackRedirectUrl,
      component,
      afterSignUpUrl,
      afterSignInUrl,
      mode,
      signUpUrl,
      signInUrl,
      ...props
    },
    ref
  ) => <button ref={ref} {...props} />
);

ClerkButton.displayName = 'ClerkButton';
