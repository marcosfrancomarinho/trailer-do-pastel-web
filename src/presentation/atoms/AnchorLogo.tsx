/** Identidade náutica original: âncora lúdica inspirada em cenários submarinos. */
export default function AnchorLogo({ className = '' }: { className?: string }) {
  return <svg className={className} width="42" height="42" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="32" cy="32" r="29" fill="#FFD437" stroke="#062D4A" strokeWidth="4"/>
    <circle cx="32" cy="16" r="6" fill="#32C8DD" stroke="#07334A" strokeWidth="4"/>
    <path d="M32 23v27M22 30h20M14 41c3 11 10 15 18 15s15-4 18-15" stroke="#07334A" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="m11 44 3-8 7 5M53 44l-3-8-7 5" stroke="#07334A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M32 25v24M22 30h20" stroke="#FFF4D0" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="48" cy="15" r="3" fill="#F47E5D"/>
    <path d="M13 18l2-4 2 4 4 2-4 2-2 4-2-4-4-2z" fill="#3FCAE1"/>
  </svg>
}
