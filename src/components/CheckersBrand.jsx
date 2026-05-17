import "./checkersBrand.css"

export function CheckersBrand({ className = "", onClick }) {
  return (
    <button type="button" className={`checkersBrand ${className}`.trim()} onClick={onClick}>
      <span className="checkersBrandMark" aria-hidden="true">
        <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="checkersBrandFrame" x1="6" y1="4" x2="38" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#2dd4bf" />
              <stop offset="1" stopColor="#38bdf8" />
            </linearGradient>
            <linearGradient id="checkersBrandLightPiece" x1="10" y1="22" x2="20" y2="34" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fff8e7" />
              <stop offset="1" stopColor="#c4a574" />
            </linearGradient>
            <linearGradient id="checkersBrandDarkPiece" x1="24" y1="10" x2="34" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#57534e" />
              <stop offset="1" stopColor="#0c0a09" />
            </linearGradient>
          </defs>
          <rect x="1" y="1" width="42" height="42" rx="13" fill="url(#checkersBrandFrame)" />
          <rect x="7" y="7" width="30" height="30" rx="6" fill="#1a2e1f" />
          <rect x="7" y="7" width="15" height="15" rx="2" fill="#d9cfb6" />
          <rect x="22" y="22" width="15" height="15" rx="2" fill="#d9cfb6" />
          <rect x="22" y="7" width="15" height="15" rx="2" fill="#243428" />
          <rect x="7" y="22" width="15" height="15" rx="2" fill="#243428" />
          <circle cx="16" cy="29" r="6.2" fill="url(#checkersBrandLightPiece)" stroke="#8b7355" strokeWidth="1.2" />
          <circle cx="16" cy="29" r="3.4" fill="none" stroke="rgba(255, 255, 255, 0.35)" strokeWidth="1" />
          <circle cx="28" cy="15" r="6.2" fill="url(#checkersBrandDarkPiece)" stroke="#44403c" strokeWidth="1.2" />
          <circle cx="28" cy="15" r="3.4" fill="none" stroke="rgba(255, 255, 255, 0.18)" strokeWidth="1" />
        </svg>
      </span>
      <strong>Checkers</strong>
    </button>
  )
}
