import Nav from './components/Nav';
import CTASection from './components/sections/CTASection';
import FeaturesSection from './components/sections/FeaturesSection';
import Hero from './components/sections/Hero';
import ProblemSection from './components/sections/ProblemSection';
import TestimonialsSection from './components/sections/TestimonialsSection';
import { MagpieLogo } from './components/ui/MagpieLogo';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <main id="main-content" className="pt-16">
        <Hero />
        <ProblemSection />
        <FeaturesSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <footer className="bg-slate-900 px-4 py-12 text-slate-400">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-3 text-white">
            <MagpieLogo className="h-8 w-8" />
            <span className="text-lg font-semibold">magpie</span>
          </div>
          <div className="flex flex-col gap-3 text-sm md:flex-row md:items-center md:gap-6">
            <a
              href="#"
              className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              Privacy
            </a>
            <a
              href="#"
              className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              Terms
            </a>
            <a
              href="mailto:hello@magpie.com"
              className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              Contact
            </a>
          </div>
          <div className="text-xs text-slate-500">
            © 2026 Magpie. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
