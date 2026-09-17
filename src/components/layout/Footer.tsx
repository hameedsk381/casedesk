import React from 'react';

const footerLinks = [
  {
    heading: 'Product',
    links: [
      { label: 'Product', href: '#product' },
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'Features', href: '#features' },
      { label: 'For Teams', href: '#teams' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'Security', href: '#security' },
      { label: 'Contact', href: '#cta' },
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
    ],
  },
];

const socials = [
  { label: 'Instagram', href: 'https://www.instagram.com/OPENVAARTHA/' },
  { label: 'Facebook', href: 'https://www.facebook.com/openvaartha/' },
  { label: 'YouTube', href: 'https://youtube.com/@openvaartha' },
  { label: 'X', href: 'https://x.com/openvaartha' },
];

export default function Footer() {
  return (
    <footer className="bg-navy text-white" role="contentinfo">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16">
          {/* Brand */}
          <div className="md:col-span-5 lg:col-span-6">
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-xl font-bold tracking-tight">CaseDesk</span>
              <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-electric-blue-light">
                Open Vaartha
              </span>
            </div>
            <p className="text-sm text-slate-light leading-relaxed max-w-sm">
              People&apos;s stories. Real impact.
            </p>
            <p className="text-xs text-slate-light mt-3">
              Part of{' '}
              <a
                href="https://openvaartha.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white font-semibold hover:underline transition-colors"
              >
                Open Vaartha
              </a>{' '}
              — independent public-interest journalism from Andhra Pradesh.
            </p>
            <div className="flex gap-4 mt-6">
              {socials.map((platform) => (
                <a
                  key={platform.label}
                  href={platform.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-light hover:text-white transition-colors"
                >
                  {platform.label}
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {footerLinks.map((group) => (
            <div key={group.heading} className="md:col-span-3 lg:col-span-3">
              <h3 className="text-xs font-bold tracking-[0.15em] uppercase text-slate-light mb-4">
                {group.heading}
              </h3>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-slate-light hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-light">
            © 2026 Open Vaartha · CaseDesk. All rights reserved.
          </p>
          <p className="text-xs text-slate-light">
            Built for public-interest creators.
          </p>
        </div>
      </div>
    </footer>
  );
}
