import {Link} from 'react-router-dom';
import {ArrowRight, Check, Zap} from 'lucide-react';

interface CompetitorCard {
  title: string;
  competitorPrice: string;
  description: string;
  bullets: string[];
  highlighted?: boolean;
}

const COMPETITOR_CARDS: CompetitorCard[] = [
  {
    title: 'Clouskee PP vs guns.lol',
    competitorPrice: '7,99€ / lifetime',
    description:
      'guns.lol charges in Euros for lifetime access. Clouskee PP offers full custom bio-link features designed for local users at just LKR 1,000 lifetime.',
    bullets: [
      'Local LKR pricing (LKR 1,000 vs €7.99)',
      '3D Astronaut Hero Scene Integration',
      'Custom 3D Pill Geometry Buttons',
      'Optimized for fast local CDN delivery',
    ],
    highlighted: true,
  },
  {
    title: 'Clouskee PP vs Linktree',
    competitorPrice: '$5 - $24 / month',
    description:
      'Linktree charges recurring monthly subscription fees. Clouskee PP gives you lifetime access with a single payment.',
    bullets: [
      'Zero monthly subscription traps',
      'Advanced background audio player',
      'Typewriter bio animations',
      'Exclusive verified badges included',
    ],
  },
  {
    title: 'Clouskee PP vs Beacons',
    competitorPrice: '$10 - $90 / month',
    description:
      'Beacons forces heavy monthly fees for advanced link-in-bio analytics and custom branding.',
    bullets: [
      'One-time LKR 1,000 lifetime payment',
      'Zero transaction fees on file hosting',
      'Cleaner glassmorphism UI design',
      'Full custom CSS & themes',
    ],
  },
  {
    title: 'Clouskee PP vs Carrd',
    competitorPrice: '$9 - $49 / year',
    description:
      'Carrd requires annual renewals for multi-page features and custom domains.',
    bullets: [
      'Lifetime ownership with no annual renewals',
      'Built-in secure file hosting up to 5GB',
      'Instant profile setup in under 30 seconds',
      'Active community support via Discord',
    ],
  },
];

export function ComparePage() {
  const scrollToCards = () => {
    const target = document.getElementById('comparison-grid');
    target?.scrollIntoView({behavior: 'smooth', block: 'start'});
  };

  return (
    <div className="min-h-screen bg-[#07030d] px-4 sm:px-6 pt-32 sm:pt-36 pb-24 relative overflow-hidden">
      {/* Subtle Top Radial Purple Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[820px] h-[420px] rounded-full blur-[120px] opacity-60"
        style={{
          background:
            'radial-gradient(circle, rgba(124, 58, 237, 0.22) 0%, rgba(7, 3, 13, 0) 72%)',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#1a0d30] border border-purple-500/35 px-4 py-1.5 text-xs font-medium text-purple-200 shadow-[0_0_20px_rgba(139,92,246,0.18)]">
            <Zap className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span>Competitor Analysis &amp; Comparison</span>
          </div>

          <h1 className="mt-6 text-[clamp(2.2rem,4.6vw,3.6rem)] font-extrabold tracking-[-0.03em] leading-[1.08] text-white text-balance">
            See how Clouskee PP compares to the alternatives
          </h1>

          <p className="mt-4 max-w-2xl mx-auto text-sm sm:text-base text-[#b2abc4] leading-relaxed">
            Compare pricing, customization, analytics, and features side by
            side, and see where Clouskee PP is the better fit.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <button
              type="button"
              onClick={scrollToCards}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#6d28d9] via-[#7c3aed] to-[#6d28d9] hover:from-[#7c3aed] hover:to-[#9333ea] px-6 py-3 text-sm font-semibold text-white border border-purple-300/25 shadow-[0_0_28px_rgba(139,92,246,0.45)] transition-all cursor-pointer"
            >
              <span>Compare with guns.lol</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>

            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-full bg-[#130b22]/90 hover:bg-[#1c1133] border border-purple-400/25 hover:border-purple-400/45 px-6 py-3 text-sm font-semibold text-slate-100 transition-colors"
            >
              Create your Clouskee PP
            </Link>
          </div>
        </div>

        {/* Sub-heading & 2x2 Comparison Grid */}
        <div id="comparison-grid" className="mt-20 sm:mt-24 scroll-mt-28">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-[32px] font-extrabold tracking-tight text-white">
              How Clouskee PP stacks up
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#9c95ae]">
              Side-by-side comparison with leading alternative profile
              platforms.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            {COMPETITOR_CARDS.map((card) => (
              <article
                key={card.title}
                className={`rounded-2xl p-6 sm:p-7 flex flex-col justify-between border transition-colors ${
                  card.highlighted
                    ? 'bg-gradient-to-b from-[#130926] to-[#0b0616] border-purple-500/40 shadow-[0_0_45px_rgba(124,58,237,0.14)]'
                    : 'bg-[#0b0615]/95 border-purple-500/20 hover:border-purple-400/35'
                }`}
              >
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="text-lg sm:text-xl font-bold text-white">
                      {card.title}
                    </h3>
                    <span className="rounded-full bg-[#210f42] border border-purple-400/30 px-3 py-1 font-mono text-[11px] font-medium text-purple-200 whitespace-nowrap">
                      LKR 1,000 / lifetime
                    </span>
                  </div>

                  <p className="mt-2 font-mono text-xs text-slate-400">
                    Competitor:{' '}
                    <span className="text-rose-400 font-medium">
                      {card.competitorPrice}
                    </span>
                  </p>

                  <p className="mt-4 text-xs sm:text-sm text-[#b2abc4] leading-relaxed">
                    {card.description}
                  </p>

                  <ul className="mt-5 space-y-2.5 text-xs sm:text-[13px] text-slate-200">
                    {card.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2.5">
                        <Check
                          className="w-4 h-4 text-purple-400 shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  to="/signup?plan=premium"
                  className="mt-7 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4c1d95] via-[#5b21b6] to-[#6d28d9] hover:brightness-115 border border-purple-400/30 py-3 px-4 text-xs sm:text-sm font-semibold text-white shadow-[0_0_20px_rgba(124,58,237,0.28)] transition-all"
                >
                  <span>Get Clouskee PP (LKR 1,000)</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
