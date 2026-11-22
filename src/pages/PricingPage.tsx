import {useState} from 'react';
import {Link} from 'react-router-dom';
import {
  Award,
  Check,
  ChevronDown,
  Gift,
  HardDrive,
  Shield,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';

const FREE_PLAN_FEATURES = [
  'Basic Customization',
  'Profile Analytics',
  'Basic Effects',
  'Add Your Socials',
];

const PREMIUM_PLAN_FEATURES = [
  'Exclusive Badge',
  'Profile Layouts',
  'Custom Fonts',
  'Typewriter Animation',
  'Special Profile Effects',
  'Advanced Customization',
  'Metadata & SEO Customization',
];

interface FeatureRow {
  name: string;
  description: string;
  freeValue: boolean | string;
  premiumValue: boolean | string;
  detail: string;
}

const FEATURE_MATRIX: FeatureRow[] = [
  {
    name: 'Profile Layouts',
    description: 'Choose from a variety of profile layouts.',
    freeValue: false,
    premiumValue: true,
    detail:
      'Switch effortlessly between centered cards, split bento profiles, and minimal floating dock layouts.',
  },
  {
    name: 'Exclusive Badge',
    description: 'Add custom profile badges for distinction.',
    freeValue: false,
    premiumValue: true,
    detail:
      'Display Verified, VIP, Booster, and seasonal badges directly beneath your profile handle.',
  },
  {
    name: 'Layout Customization',
    description: 'Fully adjust card radius, borders, and position.',
    freeValue: false,
    premiumValue: true,
    detail:
      'Dial in glass blur intensity, border thickness, card width, and container alignment.',
  },
  {
    name: 'Text Fonts',
    description: 'Access all Google Fonts & custom typography.',
    freeValue: false,
    premiumValue: true,
    detail:
      'Pair expressive display fonts with monospace bio accents and custom font weights.',
  },
  {
    name: 'Cursor Effects',
    description: 'Add interactive trail & custom cursor animations.',
    freeValue: false,
    premiumValue: true,
    detail:
      'Choose from glowing particle trails, sparkles, or custom PNG/SVG pointer overlays.',
  },
  {
    name: 'Profile Widgets',
    description: 'Embed music, video, and dynamic status cards.',
    freeValue: false,
    premiumValue: true,
    detail:
      'Integrate live Discord presence, Spotify/custom audio players, and featured asset cards.',
  },
  {
    name: 'Metadata & SEO Customization',
    description:
      'Customize meta titles, descriptions, and OpenGraph preview images.',
    freeValue: false,
    premiumValue: true,
    detail:
      'Control exactly how your link renders when shared on Discord, X, and Telegram.',
  },
  {
    name: 'Typewriter Description',
    description: 'Animate your bio with modern typewriter text effects.',
    freeValue: false,
    premiumValue: true,
    detail:
      'Rotate multiple bio phrases with customizable typing speed and blinking cursor colors.',
  },
  {
    name: 'Exclusive Profile Preferences',
    description:
      'Fine-tune ambient lighting, particles, and glass transparency.',
    freeValue: false,
    premiumValue: true,
    detail:
      'Access granular backdrop opacity, vignette strength, and subtle parallax tilt settings.',
  },
  {
    name: 'Background Effects',
    description:
      'Immersive ambient particle animations and dynamic gradients.',
    freeValue: 'Basic',
    premiumValue: 'Advanced HQ',
    detail:
      'Unlock high-framerate starfields, snow, rain, and animated mesh gradients.',
  },
  {
    name: 'Profile Analytics',
    description: 'Track detailed visitor statistics and click-through rates.',
    freeValue: 'Basic Views',
    premiumValue: 'Advanced Insights',
    detail:
      'See referrer breakdowns, per-link click heatmaps, and geographic visitor trends.',
  },
  {
    name: 'Username Effects',
    description:
      'Glowing gradients, rainbow effects, and floating animations.',
    freeValue: false,
    premiumValue: true,
    detail:
      'Apply animated shimmer, neon glow, or multi-stop gradient fills to your display name.',
  },
  {
    name: 'Color Customization',
    description: 'Unlimited color palettes and custom accent lighting.',
    freeValue: 'Standard',
    premiumValue: 'Unlimited Custom',
    detail:
      'Pick any hex or gradient stop for cards, buttons, icons, and ambient radial glows.',
  },
  {
    name: 'Social Links',
    description: 'Connect and showcase your online presence.',
    freeValue: 'Up to 10',
    premiumValue: 'Unlimited',
    detail:
      'Add unlimited social icons, custom labels, and direct file drop links.',
  },
];

const ADDON_PRODUCTS = [
  {
    slug: 'custom-badge',
    title: 'Custom Badge',
    isNew: true,
    price: 'LKR 500',
    description:
      'Create your own custom badge with a unique icon and name.',
    bullets: ['Custom Icon & Name', 'Exclusive Appearance', 'Editable Anytime'],
    buttonText: 'Get Custom Badge (LKR 500)',
    icon: Award,
    iconStyle: 'bg-purple-600/20 border-purple-400/30 text-purple-300',
  },
  {
    slug: 'image-host',
    title: 'Image Host',
    isNew: false,
    price: 'LKR 750',
    description:
      'Upload and share images instantly with custom domains and an image gallery.',
    bullets: [
      'Add Custom Image Host Domain',
      'Public Domains',
      'Exclusive Badge',
      'Fast & Secure Uploads',
      'Advanced Image Gallery',
      'Create & Share Text Pastes',
    ],
    buttonText: 'Get Image Host (LKR 750)',
    icon: HardDrive,
    iconStyle: 'bg-indigo-600/20 border-indigo-400/30 text-indigo-300',
  },
  {
    slug: 'verified-badge',
    title: 'Verified Badge',
    isNew: false,
    price: 'LKR 1,500',
    description: 'Enhance Your Profile with the Clouskee PP Verified Badge.',
    bullets: [
      'Exclusive Verified Badge',
      'Special Discord Server Role',
      'Trust & Credibility',
    ],
    buttonText: 'Get Verified Badge (LKR 1,500)',
    icon: Shield,
    iconStyle: 'bg-emerald-600/20 border-emerald-400/30 text-emerald-300',
  },
];

export function PricingPage() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#07030d] px-4 sm:px-6 pt-32 sm:pt-36 pb-24 relative overflow-hidden">
      {/* Radial Background Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[820px] h-[420px] rounded-full blur-[120px] opacity-60"
        style={{
          background:
            'radial-gradient(circle, rgba(124, 58, 237, 0.22) 0%, rgba(7, 3, 13, 0) 72%)',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* 1. Top Pricing Plans Section */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#1a0d30] border border-purple-500/35 px-4 py-1.5 text-xs font-medium text-purple-200 shadow-[0_0_20px_rgba(139,92,246,0.18)]">
            <Zap className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span>Exclusive Offers &amp; Lifetime Plans</span>
          </div>

          <h1 className="mt-6 text-[clamp(2.2rem,4.6vw,3.5rem)] font-extrabold tracking-[-0.03em] leading-[1.08] text-white text-balance">
            Unlock more with our exclusive offers
          </h1>

          <p className="mt-3.5 text-sm sm:text-base text-[#b2abc4]">
            Get to a new level of creativity with Clouskee PP Premium
          </p>
        </div>

        {/* 2-Column Plan Cards */}
        <div className="mt-14 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Free Plan */}
          <div className="rounded-2xl bg-[#0c0617]/95 border border-purple-500/20 p-7 sm:p-8 flex flex-col justify-between shadow-[0_16px_48px_rgba(4,2,10,0.65)]">
            <div>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-white">Free Plan</h2>
                <span className="rounded-full bg-[#191528] border border-slate-700/70 px-3 py-1 text-[11px] font-medium text-slate-300">
                  Standard
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-white tabular-nums">
                  LKR 0
                </span>
                <span className="text-xs font-medium text-slate-400">
                  /Lifetime
                </span>
              </div>

              <p className="mt-4 text-sm text-[#b2abc4] leading-relaxed">
                For beginners, link all your socials in one place.
              </p>

              <ul className="mt-7 space-y-3 text-sm text-slate-300">
                {FREE_PLAN_FEATURES.map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <Check
                      className="w-4 h-4 text-emerald-400 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              to="/signup?plan=free"
              className="mt-8 w-full inline-flex items-center justify-center rounded-xl bg-[#182232] hover:bg-[#202d42] border border-slate-700/60 py-3 px-4 text-sm font-semibold text-white transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Premium Plan */}
          <div className="relative rounded-2xl bg-gradient-to-b from-[#17092b] via-[#110721] to-[#0c0518] border border-purple-500/50 p-7 sm:p-8 flex flex-col justify-between shadow-[0_0_55px_rgba(124,58,237,0.22),inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#9333ea] px-3.5 py-1 text-[10.5px] font-bold tracking-wider uppercase text-white shadow-[0_4px_18px_rgba(139,92,246,0.55)]">
              MOST POPULAR
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <h2 className="inline-flex items-center gap-1.5 text-xl font-bold text-white">
                  <span>Premium Plan</span>
                  <Sparkles
                    className="w-4 h-4 text-purple-300"
                    aria-hidden="true"
                  />
                </h2>
                <span className="rounded-full bg-purple-950/90 border border-purple-400/35 px-3 py-1 text-[11px] font-medium text-purple-200">
                  Lifetime Access
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-white tabular-nums">
                  LKR 1,000
                </span>
                <span className="text-xs font-medium text-purple-300/90">
                  /Lifetime
                </span>
              </div>

              <p className="mt-1.5 font-mono text-[11px] text-purple-300/90">
                Pay once. Keep it forever.
              </p>

              <p className="mt-4 text-sm text-[#c7bfdc] leading-relaxed">
                The perfect plan to discover your creativity &amp; unlock more
                features.
              </p>

              <ul className="mt-6 space-y-3 text-sm text-slate-200">
                {PREMIUM_PLAN_FEATURES.map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <Check
                      className="w-4 h-4 text-purple-400 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              to="/signup?plan=premium"
              className="mt-8 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5b21b6] via-[#6d28d9] to-[#7c3aed] hover:brightness-110 border border-purple-400/35 py-3 px-4 text-sm font-semibold text-white shadow-[0_0_26px_rgba(124,58,237,0.45)] transition-all"
            >
              <Gift className="w-4 h-4 text-amber-300" aria-hidden="true" />
              <span>Purchase</span>
            </Link>
          </div>
        </div>

        {/* 2. Feature Comparison Rows Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <div className="rounded-2xl bg-[#0c0617]/95 border border-purple-500/25 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Here are some great features...
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Compare what is included in Free vs Premium.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                to="/signup?plan=free"
                className="rounded-xl bg-[#182232] hover:bg-[#202d42] border border-slate-700/60 px-4 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap"
              >
                Free (LKR 0)
              </Link>
              <Link
                to="/signup?plan=premium"
                className="rounded-xl bg-gradient-to-r from-[#5b21b6] to-[#7c3aed] hover:brightness-110 border border-purple-400/35 px-4 py-2 text-xs font-semibold text-white shadow-[0_0_18px_rgba(124,58,237,0.35)] transition-all whitespace-nowrap"
              >
                Premium (LKR1,000)
              </Link>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            {FEATURE_MATRIX.map((row) => {
              const isExpanded = expandedRow === row.name;
              return (
                <div
                  key={row.name}
                  className="rounded-xl bg-[#0b0615]/90 border border-purple-500/20 hover:border-purple-400/35 transition-colors"
                >
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() =>
                      setExpandedRow(isExpanded ? null : row.name)
                    }
                    className="w-full px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left cursor-pointer"
                  >
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {row.name}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-400">
                        {row.description}
                      </div>
                    </div>

                    <div className="flex items-center gap-5 shrink-0 text-xs">
                      <span className="inline-flex items-center gap-1.5 text-slate-400">
                        <span>Free:</span>
                        {typeof row.freeValue === 'boolean' ? (
                          row.freeValue ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-slate-500" />
                          )
                        ) : (
                          <span className="text-slate-300 font-medium">
                            {row.freeValue}
                          </span>
                        )}
                      </span>

                      <span className="inline-flex items-center gap-1.5 text-purple-200 font-semibold">
                        <span>Premium:</span>
                        {typeof row.premiumValue === 'boolean' ? (
                          row.premiumValue ? (
                            <Check className="w-3.5 h-3.5 text-purple-400" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-slate-500" />
                          )
                        ) : (
                          <span className="text-purple-300">
                            {row.premiumValue}
                          </span>
                        )}
                      </span>

                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 text-purple-300' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-4 pt-1 text-xs text-[#b2abc4] border-t border-purple-500/10">
                      <p className="pt-2.5">{row.detail}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Add-on Products Section */}
        <div className="mt-24">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#1a0d30] border border-purple-500/35 px-4 py-1 text-xs font-medium text-purple-200">
              <span aria-hidden="true">✨</span>
              <span>Extra Enhancements</span>
            </div>

            <h2 className="mt-5 text-3xl sm:text-[36px] font-extrabold tracking-tight text-white">
              Discover More of Our Exciting Products
            </h2>
            <p className="mt-2.5 text-xs sm:text-sm text-[#b2abc4]">
              Supercharge your Clouskee PP profile with specialized lifetime
              add-ons.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {ADDON_PRODUCTS.map((addon) => {
              const Icon = addon.icon;
              return (
                <article
                  key={addon.slug}
                  className="relative rounded-2xl bg-[#0c0617]/95 border border-purple-500/20 p-6 sm:p-7 flex flex-col justify-between hover:border-purple-400/35 transition-colors"
                >
                  {addon.isNew && (
                    <span className="absolute top-5 right-5 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#a855f7] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      NEW!
                    </span>
                  )}

                  <div>
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center ${addon.iconStyle}`}
                    >
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>

                    <h3 className="mt-5 text-lg font-bold text-white">
                      {addon.title}
                    </h3>

                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-white tabular-nums">
                        {addon.price}
                      </span>
                      <span className="text-xs text-slate-400">/Lifetime</span>
                    </div>

                    <p className="mt-1 font-mono text-[11px] text-purple-300/90">
                      Pay once. Keep it forever.
                    </p>

                    <p className="mt-4 text-xs sm:text-[13px] text-[#b2abc4] leading-relaxed">
                      {addon.description}
                    </p>

                    <ul className="mt-5 space-y-2.5 text-xs text-slate-200">
                      {addon.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-2">
                          <Check
                            className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    to={`/signup?addon=${encodeURIComponent(addon.slug)}`}
                    className="mt-7 w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#4c1d95] via-[#5b21b6] to-[#6d28d9] hover:brightness-115 border border-purple-400/30 py-2.5 px-3 text-xs font-semibold text-white shadow-[0_0_20px_rgba(124,58,237,0.28)] transition-all whitespace-nowrap"
                  >
                    <span>{addon.buttonText}</span>
                    <span aria-hidden="true">🎁</span>
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
