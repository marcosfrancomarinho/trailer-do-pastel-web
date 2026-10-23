/** Símbolo náutico do Trailer do Pastel: âncora em medalhão. */
export default function AnchorLogo({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      width="64"
      height="64"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Âncora do Trailer do Pastel"
    >
      <defs>
        <linearGradient id="anchor-medal-gold" x1="8" y1="4" x2="71" y2="78" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFE899" />
          <stop offset=".48" stopColor="#FFCB39" />
          <stop offset="1" stopColor="#E79817" />
        </linearGradient>
        <linearGradient id="anchor-navy" x1="19" y1="16" x2="61" y2="71" gradientUnits="userSpaceOnUse">
          <stop stopColor="#124E6B" />
          <stop offset="1" stopColor="#061E34" />
        </linearGradient>
      </defs>
      <circle cx="40" cy="40" r="37" fill="#062136" />
      <circle cx="40" cy="40" r="33.5" fill="url(#anchor-medal-gold)" stroke="#FFEFC0" strokeWidth="1.5" />
      <circle cx="40" cy="40" r="28.5" stroke="#865119" strokeOpacity=".45" strokeWidth="1" />
      <circle cx="40" cy="19.5" r="6.4" fill="#FFF6D7" stroke="url(#anchor-navy)" strokeWidth="4.2" />
      <path d="M40 26.5V62" stroke="url(#anchor-navy)" strokeWidth="7" strokeLinecap="round" />
      <path d="M25 37.5H55" stroke="url(#anchor-navy)" strokeWidth="7" strokeLinecap="round" />
      <path d="M18.5 49.5C20.2 59.7 28.7 67.8 40 67.8C51.3 67.8 59.8 59.7 61.5 49.5" stroke="url(#anchor-navy)" strokeWidth="7" strokeLinecap="round" />
      <path d="M12.5 54L18.3 45.5L27 52" stroke="#092B43" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M67.5 54L61.7 45.5L53 52" stroke="#092B43" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M40 29V59M27 37.5H53" stroke="#4F8BA5" strokeWidth="1.5" strokeLinecap="round" opacity=".75" />
      <path d="M17.5 20.5C19 17 21 14.5 24 12.5M56 12.5C59 14.5 61 17 62.5 20.5" stroke="#FFF7CE" strokeWidth="2" strokeLinecap="round" opacity=".9" />
    </svg>
  )
}
