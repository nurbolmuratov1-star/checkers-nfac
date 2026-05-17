import { useEffect, useRef, useState } from "react"
import "./playerTopbarStats.css"

const presetFallbacks = {
  mint: { colors: ["#2dd4bf", "#38bdf8"], symbol: null },
  amber: { colors: ["#fbbf24", "#fb7185"], symbol: null },
  violet: { colors: ["#a78bfa", "#38bdf8"], symbol: null },
  steel: { colors: ["#e2e8f0", "#64748b"], symbol: null },
  royal: { colors: ["#facc15", "#7c3aed"], symbol: "♛" },
  focus: { colors: ["#2dd4bf", "#0e7490"], symbol: "🎯" },
  spark: { colors: ["#f97316", "#ef4444"], symbol: "⚡" },
  night: { colors: ["#38bdf8", "#1e1b4b"], symbol: "★" },
}

function getAvatarBackground(avatar) {
  if (avatar?.type === "image") {
    return undefined
  }

  const fallback = presetFallbacks[avatar?.id] ?? presetFallbacks.mint
  const colors = avatar?.colors ?? fallback.colors
  const gradient = avatar?.gradient ?? "135deg"

  return `linear-gradient(${gradient}, ${colors[0]}, ${colors[1]})`
}

function getAvatarSymbol(avatar, initial) {
  if (avatar?.type === "custom") {
    return avatar.symbol || initial
  }

  if (avatar?.type === "preset") {
    return avatar.symbol || presetFallbacks[avatar.id]?.symbol || initial
  }

  return initial
}

function RatingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 4H4a2 2 0 00-2 2v1a3 3 0 003 3M19 4h1a2 2 0 012 2v1a3 3 0 01-3 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CoinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 7.5v9M9.2 9.5h4.2a1.8 1.8 0 010 3.6H9.2M9.2 14.5h5.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function PlayerTopbarStats({ rating, coins, coinPulseKey = 0, displayName, avatar, onProfileClick }) {
  const initial = displayName?.[0]?.toUpperCase() || "?"

  return (
    <div className="playerTopbarStats">
      <div className="playerWallet" aria-label="Player stats">
        <div className="playerWalletStat">
          <span className="playerWalletIcon playerWalletIcon--rating">
            <RatingIcon />
          </span>
          <span className="playerWalletCopy">
            <small>Rating</small>
            <strong>{rating}</strong>
          </span>
        </div>
        <span className="playerWalletDivider" aria-hidden="true" />
        <div
          className={[
            "playerWalletStat",
            "playerWalletStat--coins",
          ]
            .filter(Boolean)
            .join(" ")}
          data-coins-counter
        >
          {coinPulseKey > 0 && <span key={coinPulseKey} className="coinPulseRing" aria-hidden="true" />}
          <span className="playerWalletIcon playerWalletIcon--coins">
            <CoinIcon />
          </span>
          <span className="playerWalletCopy">
            <small>Coins</small>
            <strong>
              <AnimatedCoins value={coins} />
            </strong>
          </span>
        </div>
      </div>

      <div className="playerAccount">
        <span className="playerAccountCopy">
          <small>Player</small>
          <strong>{displayName}</strong>
        </span>
        <button
          type="button"
          className={[
            "playerAccountAvatar",
            avatar?.type === "image" ? "playerAccountAvatar--image" : "",
            avatar?.type === "preset" ? `playerAccountAvatar--${avatar.id}` : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={getAvatarBackground(avatar) ? { background: getAvatarBackground(avatar) } : undefined}
          onClick={onProfileClick}
          aria-label="Open profile"
        >
          {avatar?.type === "image" ? (
            <img
              src={avatar.src}
              alt=""
              style={{
                objectPosition: `${avatar.positionX ?? 50}% ${avatar.positionY ?? 50}%`,
                transform: `scale(${avatar.zoom ?? 1})`,
                transformOrigin: `${avatar.positionX ?? 50}% ${avatar.positionY ?? 50}%`,
              }}
            />
          ) : (
            getAvatarSymbol(avatar, initial)
          )}
        </button>
      </div>
    </div>
  )
}

function AnimatedCoins({ value }) {
  const [displayValue, setDisplayValue] = useState(value)
  const currentValue = useRef(value)

  useEffect(() => {
    const startValue = currentValue.current
    const difference = value - startValue

    if (difference === 0) {
      return undefined
    }

    const duration = 1250
    const startTime = performance.now()
    let animationFrame = 0

    function tick(now) {
      const progress = Math.min(1, (now - startTime) / duration)
      const easedProgress =
        progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2
      const nextValue = Math.round(startValue + difference * easedProgress)

      setDisplayValue(nextValue)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(tick)
        return
      }

      currentValue.current = value
    }

    animationFrame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(animationFrame)
      currentValue.current = value
    }
  }, [value])

  return displayValue
}
