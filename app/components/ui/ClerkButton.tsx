'use client';

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

type ClerkButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  redirectUrl?: string | null;
  forceRedirectUrl?: string | null;
  fallbackRedirectUrl?: string | null;
  signInForceRedirectUrl?: string | null;
  signInFallbackRedirectUrl?: string | null;
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
      signInForceRedirectUrl,
      signInFallbackRedirectUrl,
      component,
      afterSignUpUrl,
      afterSignInUrl,
      mode,
      signUpUrl,
      signInUrl,
      ...props
    },
    ref
  ) => {
    const ignoredProps = {
      redirectUrl,
      forceRedirectUrl,
      fallbackRedirectUrl,
      signInForceRedirectUrl,
      signInFallbackRedirectUrl,
      component,
      afterSignUpUrl,
      afterSignInUrl,
      mode,
      signUpUrl,
      signInUrl
    };
    void ignoredProps;
    return <button ref={ref} {...props} />;
  }
);

ClerkButton.displayName = 'ClerkButton';
