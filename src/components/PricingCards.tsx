import {Link} from 'react-router-dom';
import {Check, Sparkles, Zap} from 'lucide-react';

const FREE_FEATURES = [
  'Custom Handle (clouskee.pp/username)',
  'Up to 10 Social Media Links',
  'Basic View Counter & Analytics',
  'File Upload Hosting (up to 100MB per file)',
  'Standard Theme Color Options',
];

const PREMIUM_FEATURES = [
  {text: 'Everything in Free Plan', bold: true},
  {text: 'Exclusive Verified & VIP Profile Badges', bold: false},
  {text: 'Background Music & Audio Autoplay', bold: false},
  {text: 'Typewriter Animated Bio & Custom Fonts', bold: false},
  {text: '5GB File Upload Hosting & Direct CDN', bold: false},
  {text: 'Zero Branding Watermarks', bold: false},
];

export function PricingCards() {
  return (
    <section
      id="pricing"
      className="relative max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-24"
    >
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#1a0d30] border border-purple-500/35 px-3.5 py-1 text-xs font-medium text-purple-200 shadow-[0_0_20px_rgba(139,92,246,0.18)]">
          <Zap className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
          <span>Simple Lifetime Pricing</span>
        </div>

        <h2 className="mt-5 text-3xl sm:text-[42px] font-extrabold tracking-tight text-white">
          Choose your plan.
        </h2>
        <p className="mt-3 text-sm sm:text-base text-[#b2abc4] leading-relaxed">
          No monthly recurring fees for Premium. Pay once and keep your
          <br className="hidden sm:inline" /> lifetime perks forever.
        </p>
      </div>

      {/* 2-Column Pricing Cards */}
      <div className="mt-14 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Left Card: Free Plan */}
        <div className="rounded-2xl bg-[#0c0617]/95 border border-purple-500/20 p-7 sm:p-8 flex flex-col justify-between shadow-[0_16px_48px_rgba(4,2,10,0.65)]">
          <div>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-bold text-white">Free Plan</h3>
              <span className="rounded-full bg-[#191528] border border-slate-700/70 px-3 py-1 text-[11px] font-medium text-slate-300">
                Standard
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-4xl font-extrabold text-white tabular-nums">
                0€
              </span>
              <span className="text-xs font-medium text-slate-400">
                / Lifetime
              </span>
            </div>

            <p className="mt-4 text-sm text-[#b2abc4] leading-relaxed">
              Perfect for getting started with your personal link-in-bio page.
            </p>

            <ul className="mt-7 space-y-3.5 text-sm text-slate-300">
              {FREE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <Check
                    className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <Link
            to="/signup?plan=free"
            className="mt-8 w-full inline-flex items-center justify-center rounded-xl bg-[#182232] hover:bg-[#202d42] border border-slate-700/60 py-3 px-4 text-sm font-semibold text-white transition-colors"
          >
            Sign Up for Free
          </Link>
        </div>

        {/* Right Card: Premium */}
        <div className="relative rounded-2xl bg-gradient-to-b from-[#17092b] via-[#110721] to-[#0c0518] border border-purple-500/50 p-7 sm:p-8 flex flex-col justify-between shadow-[0_0_55px_rgba(124,58,237,0.22),inset_0_1px_0_rgba(255,255,255,0.08)]">
          {/* Overlapping Top-Right MOST POPULAR Pill */}
          <div className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#9333ea] px-3.5 py-1 text-[10.5px] font-bold tracking-wider uppercase text-white shadow-[0_4px_18px_rgba(139,92,246,0.55)]">
            MOST POPULAR
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <h3 className="inline-flex items-center gap-1.5 text-xl font-bold text-white">
                <span>Premium</span>
                <Sparkles
                  className="w-4 h-4 text-purple-300"
                  aria-hidden="true"
                />
              </h3>
              <span className="rounded-full bg-purple-950/90 border border-purple-400/35 px-3 py-1 text-[11px] font-medium text-purple-200">
                One-Time Fee
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-4xl font-extrabold text-white tabular-nums">
                7,99€
              </span>
              <span className="text-xs font-medium text-purple-300/90">
                / Lifetime
              </span>
            </div>

            <p className="mt-4 text-sm text-[#c7bfdc] leading-relaxed">
              Unlock all elite customizations, exclusive badges, audio player,
              and zero limits.
            </p>

            <ul className="mt-7 space-y-3.5 text-sm text-slate-200">
              {PREMIUM_FEATURES.map((feature) => (
                <li key={feature.text} className="flex items-start gap-2.5">
                  <Check
                    className="w-4 h-4 text-purple-400 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span className={feature.bold ? 'font-bold text-white' : ''}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <Link
            to="/signup?plan=premium"
            className="mt-8 w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#5b21b6] via-[#6d28d9] to-[#7c3aed] hover:brightness-110 border border-purple-400/35 py-3 px-4 text-sm font-semibold text-white shadow-[0_0_26px_rgba(124,58,237,0.45)] transition-all"
          >
            Get Premium Access (7,99€)
          </Link>
        </div>
      </div>
    </section>
  );
}
