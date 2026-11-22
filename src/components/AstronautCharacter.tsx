export function AstronautCharacter() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none absolute -top-[68px] -left-[22px] z-20 w-[78px] h-[86px]"
    >
      {/* Soft shadow cast onto the top-left curve of the Sign Up Free button */}
      <div className="animate-astronaut-shadow absolute bottom-[9px] left-[22px] h-[9px] w-[38px] rounded-full bg-[#090314]/85 blur-[4px]" />

      {/* Floating 3D-shaded stylized astronaut sitting on the button */}
      <svg
        viewBox="0 0 120 132"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-astronaut-float w-full h-full drop-shadow-[0_10px_16px_rgba(7,3,13,0.75)]"
      >
        <defs>
          {/* Helmet & suit 3D spherical lighting */}
          <radialGradient id="astroHelmetGrad" cx="38%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#e2e8f0" />
            <stop offset="82%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#64748b" />
          </radialGradient>

          {/* Purple rim highlight on suit */}
          <radialGradient id="astroPurpleRim" cx="78%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#d8b4fe" stopOpacity="0.65" />
            <stop offset="55%" stopColor="#9333ea" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#4c1d95" stopOpacity="0" />
          </radialGradient>

          {/* Dark glossy visor */}
          <linearGradient id="astroVisorGrad" x1="25%" y1="15%" x2="80%" y2="90%">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="35%" stopColor="#090514" />
            <stop offset="75%" stopColor="#130926" />
            <stop offset="100%" stopColor="#3b0764" />
          </linearGradient>

          {/* Visor inner specular shine */}
          <linearGradient id="astroVisorShine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e9d5ff" stopOpacity="0.72" />
            <stop offset="45%" stopColor="#a855f7" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Torso 3D gradient */}
          <linearGradient id="astroSuitGrad" x1="20%" y1="10%" x2="85%" y2="95%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="50%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#7c8aa0" />
          </linearGradient>

          {/* Backpack & joints purple accent */}
          <linearGradient id="astroPackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="55%" stopColor="#6d28d9" />
            <stop offset="100%" stopColor="#3b0764" />
          </linearGradient>

          {/* Boot sole & metallic cuffs */}
          <linearGradient id="astroBootGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="55%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>

        {/* Backpack (behind torso, left side) */}
        <rect
          x="26"
          y="50"
          width="24"
          height="36"
          rx="9"
          transform="rotate(-8 26 50)"
          fill="url(#astroPackGrad)"
          stroke="#c084fc"
          strokeOpacity="0.4"
          strokeWidth="1.2"
        />
        <rect
          x="30"
          y="56"
          width="12"
          height="20"
          rx="4"
          transform="rotate(-8 30 56)"
          fill="#2e1065"
          fillOpacity="0.65"
        />

        {/* Back leg (dangling slightly behind) */}
        <g transform="rotate(6 68 90)">
          <path
            d="M64 84 C74 85, 81 91, 80 102 L77 112 L65 111 L66 96 Z"
            fill="url(#astroSuitGrad)"
          />
          {/* Knee joint purple band */}
          <rect x="65" y="99" width="14" height="4.5" rx="2.2" fill="#7c3aed" />
          {/* Back boot */}
          <path
            d="M62 110 C62 108, 78 108, 79 112 L81 118 C82 121, 79 123, 73 123 L63 123 C60 123, 59 120, 60 116 Z"
            fill="url(#astroBootGrad)"
          />
          <rect x="60" y="120" width="21" height="3.5" rx="1.75" fill="#4c1d95" />
        </g>

        {/* Seated Torso */}
        <path
          d="M40 54 C40 46, 72 46, 75 56 L77 83 C77 89, 68 92, 56 92 C44 92, 38 87, 39 78 Z"
          fill="url(#astroSuitGrad)"
        />
        <path
          d="M40 54 C40 46, 72 46, 75 56 L77 83 C77 89, 68 92, 56 92 C44 92, 38 87, 39 78 Z"
          fill="url(#astroPurpleRim)"
        />

        {/* Waist purple utility belt */}
        <path
          d="M39 80 Q58 86 76 80 L76 86 Q58 92 40 86 Z"
          fill="url(#astroPackGrad)"
        />
        <rect x="55" y="82" width="8" height="5.5" rx="2" fill="#e9d5ff" fillOpacity="0.85" />

        {/* Chest control module */}
        <rect
          x="52"
          y="58"
          width="17"
          height="14"
          rx="4"
          fill="#1e1b4b"
          stroke="#a855f7"
          strokeWidth="1.2"
        />
        <circle cx="57" cy="63" r="1.8" fill="#c084fc" />
        <circle cx="63" cy="63" r="1.8" fill="#38bdf8" />
        <rect x="55.5" y="67.5" width="9.5" height="2" rx="1" fill="#8b5cf6" />

        {/* Front leg (dangling prominently over the left edge of the button) */}
        <g>
          <path
            d="M42 84 C55 83, 64 89, 63 102 L58 115 L45 113 L48 97 C42 96, 38 92, 42 84 Z"
            fill="url(#astroSuitGrad)"
          />
          <path
            d="M42 84 C55 83, 64 89, 63 102 L58 115 L45 113 L48 97 C42 96, 38 92, 42 84 Z"
            fill="url(#astroPurpleRim)"
          />
          {/* Knee joint purple band */}
          <rect
            x="46"
            y="100"
            width="16"
            height="4.8"
            rx="2.4"
            transform="rotate(8 46 100)"
            fill="#8b5cf6"
          />
          {/* Front boot */}
          <path
            d="M43 113 C44 110, 58 111, 59 115 L62 121 C63 125, 59 127, 52 127 L41 126 C38 125, 37 122, 39 118 Z"
            fill="url(#astroBootGrad)"
          />
          <path
            d="M38.5 123 L61 124.5 C61 126.5, 57 127.5, 51 127 L40 126 C38.5 125.5, 38 124, 38.5 123 Z"
            fill="#6d28d9"
          />
        </g>

        {/* Left/Back Arm resting forward */}
        <path
          d="M71 57 C81 60, 84 71, 77 78 C73 82, 66 80, 65 75 C69 72, 72 67, 68 62 Z"
          fill="url(#astroSuitGrad)"
        />
        <circle cx="72" cy="77" r="5" fill="url(#astroPackGrad)" />

        {/* Right/Front Arm resting near knee */}
        <path
          d="M43 56 C33 61, 32 74, 41 80 C46 83, 52 80, 52 75 C46 73, 44 68, 47 62 Z"
          fill="url(#astroSuitGrad)"
        />
        <path
          d="M43 56 C33 61, 32 74, 41 80 C46 83, 52 80, 52 75 C46 73, 44 68, 47 62 Z"
          fill="url(#astroPurpleRim)"
        />
        {/* Purple cuff & glove */}
        <rect
          x="39"
          y="72"
          width="9"
          height="4"
          rx="2"
          transform="rotate(24 39 72)"
          fill="#8b5cf6"
        />
        <circle cx="48" cy="78.5" r="5.5" fill="url(#astroBootGrad)" />

        {/* Neck Collar Ring */}
        <ellipse
          cx="58"
          cy="50"
          rx="16.5"
          ry="5.5"
          fill="url(#astroPackGrad)"
          stroke="#d8b4fe"
          strokeOpacity="0.45"
          strokeWidth="1"
        />

        {/* Helmet */}
        <g>
          {/* Ear communication pods */}
          <rect x="30" y="24" width="8" height="16" rx="4" fill="url(#astroPackGrad)" />
          <circle cx="33.5" cy="32" r="2.2" fill="#e9d5ff" />
          <rect x="78" y="24" width="8" height="16" rx="4" fill="url(#astroPackGrad)" />
          <circle cx="82.5" cy="32" r="2.2" fill="#c084fc" />

          {/* Main Helmet Sphere */}
          <rect
            x="33"
            y="8"
            width="50"
            height="43"
            rx="21"
            fill="url(#astroHelmetGrad)"
          />
          <rect
            x="33"
            y="8"
            width="50"
            height="43"
            rx="21"
            fill="url(#astroPurpleRim)"
          />

          {/* Top helmet crest detail */}
          <path
            d="M49 9.5 Q58 7.5 67 9.5 L65 13.5 Q58 12.2 51 13.5 Z"
            fill="#8b5cf6"
            fillOpacity="0.7"
          />

          {/* Glossy Dark Visor */}
          <rect
            x="40"
            y="16"
            width="39"
            height="27"
            rx="13.5"
            fill="url(#astroVisorGrad)"
            stroke="#c084fc"
            strokeOpacity="0.32"
            strokeWidth="1.2"
          />

          {/* Visor inner star reflection */}
          <circle cx="67" cy="24" r="1.1" fill="#e9d5ff" fillOpacity="0.7" />
          <circle cx="71.5" cy="28" r="0.8" fill="#c084fc" fillOpacity="0.6" />

          {/* Visor curved specular glass highlight */}
          <path
            d="M45 25 C46 19, 53 17.5, 62 18.5 C55 20.5, 49 23.5, 46.5 30 C44.5 29, 44.5 27, 45 25 Z"
            fill="url(#astroVisorShine)"
          />
          <path
            d="M66 38 C71 37, 74.5 34.5, 76 31"
            stroke="#a855f7"
            strokeOpacity="0.45"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}
