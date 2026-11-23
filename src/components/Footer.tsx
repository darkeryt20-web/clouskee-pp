import {useState} from 'react';
import {Link} from 'react-router-dom';
import {ExternalLink, Github, MessageCircle, X} from 'lucide-react';

const LOGO_URL =
  'https://res.cloudinary.com/dz7jkt7gx/image/upload/v1794018458/Clous_Kee_Logo_BW_bektaf.png';
const DISCORD_URL = 'https://discord.gg/FDQrVXEdbK';

const LEGAL_TOPICS: Record<string, {title: string; body: string}> = {
  terms: {
    title: 'Terms of Service',
    body: 'Clouskee PP accounts grant a personal, non-transferable license to publish link-in-bio profiles and host lawful digital assets up to plan limits. Abuse, malware distribution, or automated scraping results in immediate suspension.',
  },
  privacy: {
    title: 'Privacy Policy',
    body: 'We collect only account email, chosen handle, and privacy-respecting aggregate view metrics. Clouskee PP does not embed third-party ad tracking cookies on creator profile pages.',
  },
  dmca: {
    title: 'DMCA Notice',
    body: 'Copyright holders may submit takedown notices with specific file URLs and ownership verification through our Discord support desk or security contact. Verified notices are processed within 24 hours.',
  },
  security: {
    title: 'Security Protocol',
    body: 'All hosted assets are encrypted at rest (AES-256) and served over TLS 1.3 via our global edge network. Optional passcode gates use hashed token verification before issuing signed download streams.',
  },
};

export function Footer() {
  const [logoError, setLogoError] = useState(false);
  const [activeLegalKey, setActiveLegalKey] = useState<string | null>(null);

  const activeLegal = activeLegalKey ? LEGAL_TOPICS[activeLegalKey] : null;

  return (
    <footer className="border-t border-purple-500/15 bg-[#07030d]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-14 pb-10">
        {/* 4-Column Top Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Col 1: Brand */}
          <div className="lg:col-span-5">
            <Link to="/" className="inline-flex items-center gap-2.5">
              {!logoError ? (
                <img
                  src={LOGO_URL}
                  alt="Clouskee PP logo"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoError(true)}
                  className="w-7 h-7 object-contain rounded-md"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="w-7 h-7 rounded-md bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white text-xs font-extrabold"
                >
                  C
                </span>
              )}
              <span className="text-base font-bold tracking-tight text-white">
                Clouskee <span className="text-[#a855f7]">PP</span>
              </span>
            </Link>

            <p className="mt-4 max-w-xs text-xs sm:text-[13px] leading-relaxed text-slate-400">
              Clouskee PP is your go-to for modern, feature-rich link-in-bio
              profile pages, interactive music backgrounds, custom badges, and
              fast, secure media hosting.
            </p>
          </div>

          {/* Col 2: NAVIGATION */}
          <div className="lg:col-span-2">
            <h3 className="text-[11px] font-bold tracking-wider uppercase text-white">
              NAVIGATION
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs sm:text-[13px] text-slate-400">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/pricing"
                  className="hover:text-white transition-colors"
                >
                  Pricing &amp; Plans
                </Link>
              </li>
              <li>
                <Link
                  to="/leaderboard"
                  className="hover:text-white transition-colors"
                >
                  Top Leaderboard
                </Link>
              </li>
              <li>
                <Link
                  to="/compare"
                  className="hover:text-white transition-colors"
                >
                  Compare vs Guns.lol
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: COMMUNITY */}
          <div className="lg:col-span-2">
            <h3 className="text-[11px] font-bold tracking-wider uppercase text-white">
              COMMUNITY
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs sm:text-[13px] text-slate-400">
              <li>
                <a
                  href={DISCORD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-white transition-colors"
                >
                  <span>Official Discord</span>
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>
              </li>
              <li>
                <Link
                  to="/signup"
                  className="hover:text-white transition-colors"
                >
                  Claim Username
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="hover:text-white transition-colors"
                >
                  Account Login
                </Link>
              </li>
              <li>
                <Link
                  to="/compare"
                  className="hover:text-white transition-colors"
                >
                  File Hosting CDN
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: LEGAL & SECURITY */}
          <div className="lg:col-span-3">
            <h3 className="text-[11px] font-bold tracking-wider uppercase text-white">
              LEGAL &amp; SECURITY
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs sm:text-[13px] text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => setActiveLegalKey('terms')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveLegalKey('privacy')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveLegalKey('dmca')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  DMCA Notice
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveLegalKey('security')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Security Protocol
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Divider & Copyright Bar */}
        <div className="mt-12 pt-6 border-t border-purple-500/15 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © 2026 Clouskee PP. All rights reserved.
          </p>

          <div className="flex items-center gap-2.5">
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Clouskee PP Discord"
              className="w-9 h-9 rounded-full bg-[#130a24] border border-purple-500/25 hover:border-purple-400/50 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
            </a>
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Clouskee PP on X"
              className="w-9 h-9 rounded-full bg-[#130a24] border border-purple-500/25 hover:border-purple-400/50 flex items-center justify-center text-slate-300 hover:text-white transition-colors text-xs font-bold"
            >
              𝕏
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Clouskee PP on GitHub"
              className="w-9 h-9 rounded-full bg-[#130a24] border border-purple-500/25 hover:border-purple-400/50 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            >
              <Github className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      {/* Legal & Security Summary Modal */}
      {activeLegal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
          onClick={() => setActiveLegalKey(null)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-[#110820] border border-purple-400/30 p-6 shadow-[0_24px_80px_rgba(7,3,13,0.9)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveLegalKey(null)}
              aria-label="Close legal dialog"
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-purple-500/15 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3
              id="legal-modal-title"
              className="text-lg font-bold text-white"
            >
              {activeLegal.title}
            </h3>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              {activeLegal.body}
            </p>
            <button
              type="button"
              onClick={() => setActiveLegalKey(null)}
              className="mt-5 w-full rounded-xl bg-purple-600 hover:bg-purple-500 py-2.5 text-sm font-semibold text-white transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </footer>
  );
}
