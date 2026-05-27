import { cn } from '@/utils'

export interface FooterLink {
  label: string
  href: string
}

export interface SharkFooterProps {
  navLinks?: FooterLink[]
  legalLinks?: FooterLink[]
  logoSrc?: string
  tagline?: string
  className?: string
}

const defaultNavLinks: FooterLink[] = [
  { label: 'Event info',  href: '#event-info' },
  { label: 'Programme',   href: '#programme' },
  { label: 'Pitches',     href: '#pitches' },
  { label: 'Gallery',     href: '#gallery' },
  { label: 'FAQs',        href: '#faqs' },
  { label: 'Register',    href: '#register' },
]

const defaultLegalLinks: FooterLink[] = [
  { label: 'Privacy policy',    href: '#' },
  { label: 'Terms & conditions', href: '#' },
  { label: 'Cookie settings',   href: '#' },
]

export function SharkFooter({ navLinks = defaultNavLinks, legalLinks = defaultLegalLinks, logoSrc, tagline = 'Three days, two stages, one pack of sharks.', className }: SharkFooterProps) {
  return (
    <footer
      className={cn('bg-[#0f172a] border-t-2 border-[#fbbf24]', className)}
      role="contentinfo"
    >
      <div className="max-w-[1000px] mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-10 mb-10">
          {/* Brand column */}
          <div>
            {logoSrc ? (
              <img src={logoSrc} alt="SharkFest 2028" className="h-10 w-auto object-contain mb-3" />
            ) : (
              <span className="font-display text-white text-2xl block mb-3">SharkFest 2028</span>
            )}
            <p className="text-sm text-white/50 font-body leading-relaxed">{tagline}</p>
            <p className="mt-4 text-xs text-white/30 font-body">Organised by Torbay Sharks RFC</p>
          </div>

          {/* Navigation column */}
          <div>
            <h3 className="font-display text-white/80 text-xs tracking-[0.2em] uppercase mb-4">Navigation</h3>
            <ul className="space-y-2" role="list">
              {navLinks.map(link => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-white/60 hover:text-white font-body transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal column */}
          <div>
            <h3 className="font-display text-white/80 text-xs tracking-[0.2em] uppercase mb-4">Legal</h3>
            <ul className="space-y-2" role="list">
              {legalLinks.map(link => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-white/60 hover:text-white font-body transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-xs text-white/30 font-body">
            &copy; {new Date().getFullYear()} SharkFest. All rights reserved.
          </p>
          <p className="text-xs text-white/20 font-mono">
            sharkfest2028.co.uk
          </p>
        </div>
      </div>
    </footer>
  )
}
