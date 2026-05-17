import { useEffect, useMemo, useRef, useState } from "react"
import { CheckersBrand } from "../../components/CheckersBrand"
import { PlayerTopbarStats } from "../../components/PlayerTopbarStats"
import {
  equipCosmeticItem,
  getCosmeticCollections,
  getEquippedCosmetics,
  getInventoryItems,
  isCosmeticEquipped,
  isCosmeticOwned,
  purchaseCosmeticItem,
} from "../../lib/cosmetics.js"
import {
  getDailyTaskProgress,
  getTodayKey,
  getUserStorageId,
  loadBonusCoins,
  loadClaimedTaskIds,
  saveBonusCoins,
  saveClaimedTaskIds,
} from "../../lib/dailyTasks"
import { getUserStorageKey } from "../../lib/userStorage.js"
import "./arenaHome.css"

const navItems = [
  { id: "dashboard", label: "Home" },
  { id: "play", label: "Play" },
  { id: "leaderboard", label: "Rating" },
  { id: "shop", label: "Shop" },
  { id: "inventory", label: "Inventory" },
  { id: "history", label: "History" },
  { id: "profile", label: "Profile" },
]

const AVATAR_STORAGE_KEY_PREFIX = "damalab-profile-avatar"

const avatarPresets = [
  { id: "mint", name: "Mint", colors: ["#2dd4bf", "#38bdf8"], symbol: null },
  { id: "amber", name: "Amber", colors: ["#fbbf24", "#fb7185"], symbol: null },
  { id: "violet", name: "Violet", colors: ["#a78bfa", "#38bdf8"], symbol: null },
  { id: "steel", name: "Steel", colors: ["#e2e8f0", "#64748b"], symbol: null },
  { id: "royal", name: "Royal", colors: ["#facc15", "#7c3aed"], symbol: "♛" },
  { id: "focus", name: "Focus", colors: ["#2dd4bf", "#0e7490"], symbol: "🎯" },
  { id: "spark", name: "Spark", colors: ["#f97316", "#ef4444"], symbol: "⚡" },
  { id: "night", name: "Night", colors: ["#38bdf8", "#1e1b4b"], symbol: "★" },
]

const defaultAvatar = {
  type: "preset",
  id: "mint",
  colors: avatarPresets[0].colors,
  symbol: avatarPresets[0].symbol,
}

const customAvatarDefaults = {
  type: "custom",
  id: "custom",
  colors: ["#2dd4bf", "#60a5fa"],
  symbol: "😎",
  gradient: "135deg",
}

const avatarSymbols = ["😎", "🔥", "⭐", "🎯", "♛", "⚡", "💎", "🚀", "🧠", "🎲", "🏆", "✦"]

const difficultyLabels = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
}

const ruleLabels = {
  classic: "Classic Rules",
  british: "British / American Rules",
}

const ruleDetailsContent = {
  classic: {
    summary: "Fast-paced rules with long-range kings and captures in every direction.",
    points: [
      { title: "Pawns", text: "Move diagonally and capture forward or backward." },
      { title: "Kings", text: "Fly any distance along an open diagonal." },
      { title: "Crowning", text: "If a pawn becomes a king during a capture chain, it keeps moving as a king." },
    ],
  },
  british: {
    summary: "Traditional English draughts with shorter king movement.",
    points: [
      { title: "Pawns", text: "Move forward only, but capture forward and backward." },
      { title: "Kings", text: "Move one square diagonally in any direction." },
      { title: "Crowning", text: "A pawn crowned mid-chain does not continue as a king in that same turn." },
    ],
  },
}

const REWARD_ARRIVAL_DELAY_MS = 1680
const REWARD_CLEANUP_DELAY_MS = 2200

export function ArenaHome({
  user,
  records,
  stats,
  leaderboardEntries,
  cosmeticInventory,
  onCosmeticInventoryChange,
  currentUserStorageId,
  activeSection,
  hasActiveGame = false,
  gameView = null,
  onSectionChange,
  onStartGame,
  onLogout,
}) {
  const [playSettings, setPlaySettings] = useState({
    ruleSet: "classic",
    mandatoryCapture: true,
    gameMode: "ai",
    difficulty: "medium",
    playerSide: "red",
  })
  const [showRuleDetails, setShowRuleDetails] = useState(false)
  const displayName = user?.user_metadata?.username || user?.email?.split("@")[0] || "Player"
  const avatarStorageKey = getAvatarStorageKey(user)
  const todayKey = getTodayKey()
  const missionStorageId = getUserStorageId(user)
  const [avatarState, setAvatarState] = useState(() => ({
    storageKey: avatarStorageKey,
    value: loadAvatar(user),
  }))
  const [missionState, setMissionState] = useState(() => ({
    storageId: missionStorageId,
    todayKey,
    claimedTaskIds: loadClaimedTaskIds(user, todayKey),
    bonusCoins: loadBonusCoins(user),
  }))
  const [rewardFlights, setRewardFlights] = useState([])
  const [claimingTaskId, setClaimingTaskId] = useState(null)
  const [coinPulseKey, setCoinPulseKey] = useState(0)
  const rewardFlightId = useRef(0)
  const avatar = avatarState.storageKey === avatarStorageKey ? avatarState.value : loadAvatar(user)
  const activeMissionState =
    missionState.storageId === missionStorageId && missionState.todayKey === todayKey
      ? missionState
      : {
          storageId: missionStorageId,
          todayKey,
          claimedTaskIds: loadClaimedTaskIds(user, todayKey),
          bonusCoins: loadBonusCoins(user),
        }
  const dailyTasks = useMemo(
    () => getDailyTaskProgress(records, activeMissionState.claimedTaskIds, todayKey),
    [activeMissionState.claimedTaskIds, records, todayKey],
  )
  const earnedCoins = 320 + stats.wins * 45 + stats.total * 12 + activeMissionState.bonusCoins
  const coins = Math.max(0, earnedCoins - cosmeticInventory.spentCoins)
  const equippedCosmetics = useMemo(() => getEquippedCosmetics(cosmeticInventory), [cosmeticInventory])

  useEffect(() => {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0 })
    })
  }, [activeSection])

  function updatePlaySetting(key, value) {
    setPlaySettings((currentSettings) => ({
      ...currentSettings,
      [key]: value,
    }))
  }

  function updateAvatar(nextAvatar) {
    setAvatarState({ storageKey: avatarStorageKey, value: nextAvatar })
    saveAvatar(user, nextAvatar)
  }

  function claimDailyTask(taskId, sourceElement) {
    const task = dailyTasks.find((item) => item.id === taskId)

    if (!task || !task.isComplete || task.isClaimed || claimingTaskId) {
      return
    }

    setClaimingTaskId(task.id)
    launchRewardFlight(sourceElement, task.reward)

    const nextClaimedTaskIds = [...activeMissionState.claimedTaskIds, task.id]
    const nextBonusCoins = activeMissionState.bonusCoins + task.reward
    saveClaimedTaskIds(user, nextClaimedTaskIds, todayKey)
    saveBonusCoins(user, nextBonusCoins)

    window.setTimeout(() => {
      setMissionState({
        storageId: missionStorageId,
        todayKey,
        claimedTaskIds: nextClaimedTaskIds,
        bonusCoins: nextBonusCoins,
      })
      setCoinPulseKey((currentKey) => currentKey + 1)
      setClaimingTaskId(null)
    }, REWARD_ARRIVAL_DELAY_MS)
  }

  function launchRewardFlight(sourceElement, reward) {
    const sourceRect = sourceElement?.closest(".missionCard")?.getBoundingClientRect()
    const targetRect = document.querySelector("[data-coins-counter]")?.getBoundingClientRect()

    if (!sourceRect || !targetRect) {
      return
    }

    const startX = sourceRect.left + sourceRect.width / 2
    const startY = sourceRect.top + 48
    const endX = targetRect.left + targetRect.width / 2
    const endY = targetRect.top + targetRect.height / 2
    const deltaX = endX - startX
    const deltaY = endY - startY
    const arcHeight = Math.min(190, Math.max(86, Math.abs(deltaX) * 0.12 + Math.abs(deltaY) * 0.18))
    const id = rewardFlightId.current + 1
    rewardFlightId.current = id

    setRewardFlights((currentFlights) => [
      ...currentFlights,
      {
        id,
        reward,
        startX,
        startY,
        deltaX,
        deltaY,
        controlX: deltaX * 0.46,
        controlY: deltaY * 0.46 - arcHeight,
        particles: Array.from({ length: 7 }, (_, index) => ({
          id: `${id}-${index}`,
          offsetX: (index - 3) * 8,
          offsetY: index % 2 === 0 ? -8 : 8,
          controlOffsetX: (index - 3) * 18,
          controlOffsetY: index % 2 === 0 ? -24 : 18,
          delay: 220 + index * 72,
        })),
      },
    ])

    window.setTimeout(() => {
      setRewardFlights((currentFlights) => currentFlights.filter((flight) => flight.id !== id))
    }, REWARD_CLEANUP_DELAY_MS)
  }

  function handlePurchaseCosmetic(type, itemId) {
    const result = purchaseCosmeticItem(cosmeticInventory, type, itemId, coins)

    if (result.status === "purchased") {
      onCosmeticInventoryChange(result.inventory)
    }
  }

  function handleEquipCosmetic(type, itemId) {
    const result = equipCosmeticItem(cosmeticInventory, type, itemId)

    if (result.status === "equipped") {
      onCosmeticInventoryChange(result.inventory)
    }
  }

  return (
    <main className="productShell">
      <header className="appTopbar">
        <CheckersBrand className="productBrand" onClick={() => onSectionChange("dashboard")} />

        <nav className="sideNav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={activeSection === item.id || (activeSection === "game" && item.id === "play") ? "active" : ""}
              onClick={() => onSectionChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="topbarCluster">
          <PlayerTopbarStats
            rating={stats.rating}
            coins={coins}
            coinPulseKey={coinPulseKey}
            displayName={displayName}
            avatar={avatar}
            onProfileClick={() => onSectionChange("profile")}
          />
        </div>
      </header>

      <section className={activeSection === "game" ? "appMain appMain--game" : "appMain"}>
        {gameView && (
          <div hidden={activeSection !== "game"}>
            {gameView}
          </div>
        )}

        {activeSection === "dashboard" && (
          <HomeView
            stats={stats}
            coins={coins}
            dailyTasks={dailyTasks}
            onClaimTask={claimDailyTask}
            claimingTaskId={claimingTaskId}
            onPlayNow={() => onSectionChange(hasActiveGame ? "game" : "play")}
          />
        )}

        {activeSection === "play" && (
          <PlayView
            playSettings={playSettings}
            updatePlaySetting={updatePlaySetting}
            showRuleDetails={showRuleDetails}
            setShowRuleDetails={setShowRuleDetails}
            onStartGame={() => onStartGame(playSettings)}
          />
        )}

        {activeSection === "history" && <HistoryView records={records} />}
        {activeSection === "leaderboard" && (
          <LeaderboardView
            entries={leaderboardEntries}
            currentUserStorageId={currentUserStorageId}
            currentAvatar={avatar}
          />
        )}
        {activeSection === "shop" && (
          <ShopView
            coins={coins}
            inventory={cosmeticInventory}
            onBuy={handlePurchaseCosmetic}
            onEquip={handleEquipCosmetic}
          />
        )}
        {activeSection === "inventory" && (
          <InventoryView
            inventory={cosmeticInventory}
            equippedCosmetics={equippedCosmetics}
            onEquip={handleEquipCosmetic}
          />
        )}
        {activeSection === "profile" && (
          <ProfileView
            user={user}
            stats={stats}
            records={records}
            coins={coins}
            avatar={avatar}
            onAvatarChange={updateAvatar}
            onLogout={onLogout}
          />
        )}
      </section>
      <RewardFlightLayer flights={rewardFlights} />
    </main>
  )
}

function getAvatarStorageKey(user) {
  return getUserStorageKey(user, AVATAR_STORAGE_KEY_PREFIX)
}

function loadAvatar(user) {
  try {
    const saved = localStorage.getItem(getAvatarStorageKey(user))
    return saved ? JSON.parse(saved) : getProviderAvatar(user) ?? defaultAvatar
  } catch {
    return getProviderAvatar(user) ?? defaultAvatar
  }
}

function saveAvatar(user, avatar) {
  try {
    localStorage.setItem(getAvatarStorageKey(user), JSON.stringify(avatar))
  } catch {
    // Large custom images can exceed localStorage in some browsers.
  }
}

function getProviderAvatar(user) {
  const src = user?.user_metadata?.avatar_url || user?.user_metadata?.picture

  return src
    ? {
        type: "image",
        id: "provider",
        src,
        zoom: 1,
        positionX: 50,
        positionY: 50,
      }
    : null
}

function loadAvatarByStorageId(storageId) {
  try {
    const saved = localStorage.getItem(`damalab:user:${storageId}:${AVATAR_STORAGE_KEY_PREFIX}`)
    return saved ? JSON.parse(saved) : defaultAvatar
  } catch {
    return defaultAvatar
  }
}

function getPresetAvatar(id) {
  return avatarPresets.find((preset) => preset.id === id) ?? avatarPresets[0]
}

function getAvatarBackground(avatar) {
  if (avatar?.type === "custom") {
    const [from, to] = avatar.colors ?? customAvatarDefaults.colors
    return `linear-gradient(${avatar.gradient ?? customAvatarDefaults.gradient}, ${from}, ${to})`
  }

  if (avatar?.type === "preset") {
    const preset = getPresetAvatar(avatar.id)
    return `linear-gradient(135deg, ${preset.colors[0]}, ${preset.colors[1]})`
  }

  return undefined
}

function getAvatarSymbol(avatar, initial) {
  if (avatar?.type === "custom") {
    return avatar.symbol || initial
  }

  if (avatar?.type === "preset") {
    return getPresetAvatar(avatar.id).symbol || initial
  }

  return initial
}

function HomeView({ stats, coins, dailyTasks, onClaimTask, claimingTaskId, onPlayNow }) {
  return (
    <div className="dashboardGrid">
      <section className="homeHero">
        <div className="heroCopy">
          <h2>Old game. New dominance.</h2>
          <p className="heroLine">Classic rules. Zero mercy.</p>
          <p>
            Train smarter, climb the rating, earn coins, unlock board styles, and make every
            captured piece feel intentional.
          </p>
          <div className="launchActions">
            <button className="primaryAction heroPlayButton" onClick={onPlayNow}>
              <span aria-hidden="true">▶</span>
              Play now
            </button>
          </div>
        </div>

        <div className="heroBoardWrap">
          <MiniBoard variant="hero" />
          <div className="heroStats">
            <span>{stats.rating} rating</span>
            <span>{coins} coins</span>
            <span>{stats.winRate}% win rate</span>
          </div>
        </div>
      </section>

      <DailyMissions tasks={dailyTasks} onClaimTask={onClaimTask} claimingTaskId={claimingTaskId} />
    </div>
  )
}

function DailyMissions({ tasks, onClaimTask, claimingTaskId }) {
  const completedCount = tasks.filter((task) => task.isClaimed).length

  return (
    <section className="dailyMissions" aria-label="Daily missions">
      <div className="missionsHeader">
        <div>
          <p className="sectionLabel">Daily tasks</p>
          <h2>Missions</h2>
        </div>
        <span>
          {completedCount}/{tasks.length} claimed
        </span>
      </div>

      <div className="missionGrid">
        {tasks.map((task) => (
          <MissionCard
            key={task.id}
            task={task}
            isClaiming={claimingTaskId === task.id}
            isClaimLocked={Boolean(claimingTaskId)}
            onClaim={(sourceElement) => onClaimTask(task.id, sourceElement)}
          />
        ))}
      </div>
    </section>
  )
}

function MissionCard({ task, isClaiming, isClaimLocked, onClaim }) {
  const progressPercent = Math.min(100, Math.round((task.progress / task.goal) * 100))
  const buttonLabel = task.isClaimed ? "Claimed" : isClaiming ? "Claiming" : task.isComplete ? "Claim" : "Locked"

  return (
    <article
      className={[
        "missionCard",
        task.isClaimed ? "missionCard--claimed" : "",
        isClaiming ? "missionCard--claiming" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="missionCardTop">
        <span className="missionIcon" aria-hidden="true">
          {task.isClaimed ? "✓" : task.isComplete ? "!" : "•"}
        </span>
        <span className="missionReward">+{task.reward}</span>
      </div>
      <h3>{task.title}</h3>
      <p>{task.description}</p>
      <div className="missionProgressRow">
        <span>Progress</span>
        <strong>{task.progressLabel}</strong>
      </div>
      <div className="missionProgressBar" aria-hidden="true">
        <span style={{ width: `${progressPercent}%` }} />
      </div>
      <button
        type="button"
        onClick={(event) => onClaim(event.currentTarget)}
        disabled={!task.isComplete || task.isClaimed || isClaimLocked}
      >
        {buttonLabel}
      </button>
    </article>
  )
}

function RewardFlightLayer({ flights }) {
  if (flights.length === 0) {
    return null
  }

  return (
    <div className="rewardFlightLayer" aria-hidden="true">
      {flights.map((flight) => (
        <div key={flight.id} className="rewardFlight">
          <span
            className="rewardFlightAmount"
            style={{
              left: flight.startX,
              top: flight.startY,
              "--reward-dx": `${flight.deltaX}px`,
              "--reward-dy": `${flight.deltaY}px`,
              "--reward-mid-x": `${flight.controlX}px`,
              "--reward-mid-y": `${flight.controlY}px`,
            }}
          >
            +{flight.reward}
          </span>
          {flight.particles.map((particle) => (
            <span
              key={particle.id}
              className="rewardParticle"
              style={{
                left: flight.startX + particle.offsetX,
                top: flight.startY + particle.offsetY,
                animationDelay: `${particle.delay}ms`,
                "--reward-dx": `${flight.deltaX - particle.offsetX}px`,
                "--reward-dy": `${flight.deltaY - particle.offsetY}px`,
                "--reward-mid-x": `${flight.controlX + particle.controlOffsetX}px`,
                "--reward-mid-y": `${flight.controlY + particle.controlOffsetY}px`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function PlayView({ playSettings, updatePlaySetting, showRuleDetails, setShowRuleDetails, onStartGame }) {
  function toggleRuleSet() {
    updatePlaySetting("ruleSet", playSettings.ruleSet === "classic" ? "british" : "classic")
  }

  return (
    <div className="playArena">
      <section className="selectedRules">
        <div>
          <span>Selected rules:</span>
          <strong>{ruleLabels[playSettings.ruleSet]}</strong>
        </div>
        <button
          className="rulesInfoButton"
          onClick={() => setShowRuleDetails(true)}
          aria-label="Show selected rules"
        >
          i
        </button>
      </section>

      <section className="playSetup">
        <div>
          <p className="sectionLabel">Match setup</p>
          <h2>Choose your rules before the first move.</h2>
        </div>

        <SettingGroup title="Rules">
          <button className="ruleSelectButton" onClick={toggleRuleSet} aria-label="Change rules">
            <b aria-hidden="true">←</b>
            <span>
              <RuleIcon ruleSet={playSettings.ruleSet} mode="select" />
              <strong>{ruleLabels[playSettings.ruleSet]}</strong>
            </span>
            <b aria-hidden="true">→</b>
          </button>
        </SettingGroup>

        <SettingGroup title="Mandatory captures">
          <button
            className={playSettings.mandatoryCapture ? "toggleButton active" : "toggleButton"}
            onClick={() => updatePlaySetting("mandatoryCapture", !playSettings.mandatoryCapture)}
            aria-pressed={playSettings.mandatoryCapture}
          >
            <span>{playSettings.mandatoryCapture ? "On" : "Off"}</span>
            <strong>Mandatory captures: {playSettings.mandatoryCapture ? "enabled" : "disabled"}</strong>
          </button>
        </SettingGroup>

        <SettingGroup title="Game type">
          <div className="optionGrid twoColumns">
            <button
              className={playSettings.gameMode === "local" ? "optionButton active" : "optionButton"}
              onClick={() => updatePlaySetting("gameMode", "local")}
            >
              <strong>Local 2 players</strong>
              <span>Same screen duel</span>
            </button>
            <button
              className={playSettings.gameMode === "ai" ? "optionButton active" : "optionButton"}
              onClick={() => updatePlaySetting("gameMode", "ai")}
            >
              <strong>Vs computer</strong>
              <span>Pick AI strength</span>
            </button>
          </div>
        </SettingGroup>

        {playSettings.gameMode === "ai" && (
          <SettingGroup title="AI difficulty">
            <div className="difficultyPicker" aria-label="AI difficulty">
              {Object.entries(difficultyLabels).map(([value, label]) => (
                <button
                  key={value}
                  className={playSettings.difficulty === value ? "active" : ""}
                  onClick={() => updatePlaySetting("difficulty", value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </SettingGroup>
        )}

        {playSettings.gameMode === "ai" && (
          <SettingGroup title="Your side">
            <div className="difficultyPicker sidePicker" aria-label="Player side">
              <button
                className={playSettings.playerSide === "red" ? "active" : ""}
                onClick={() => updatePlaySetting("playerSide", "red")}
              >
                White
              </button>
              <button
                className={playSettings.playerSide === "black" ? "active" : ""}
                onClick={() => updatePlaySetting("playerSide", "black")}
              >
                Black
              </button>
            </div>
          </SettingGroup>
        )}

        <button className="primaryAction startMatchButton" onClick={onStartGame}>
          Start game
        </button>
      </section>

      {showRuleDetails && (
        <RulesDetailsModal ruleSet={playSettings.ruleSet} onClose={() => setShowRuleDetails(false)} />
      )}
    </div>
  )
}

function RulesDetailsModal({ ruleSet, onClose }) {
  const content = ruleDetailsContent[ruleSet]

  return (
    <div
      className="rulesModalOverlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-modal-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section className="rulesModal">
        <button className="rulesModalClose" onClick={onClose} aria-label="Close rules">
          ×
        </button>

        <header className="rulesModalHeader">
          <div className="rulesModalTitleRow">
            <RuleIcon ruleSet={ruleSet} size="lg" />
            <div>
              <p className="sectionLabel">How you will play</p>
              <h2 id="rules-modal-title">{ruleLabels[ruleSet]}</h2>
            </div>
          </div>
          <p className="rulesModalSummary">{content.summary}</p>
        </header>

        <ul className="rulesModalList">
          {content.points.map((point, index) => (
            <li key={point.title}>
              <span className="rulesModalStep">{index + 1}</span>
              <div>
                <strong>{point.title}</strong>
                <p>{point.text}</p>
              </div>
            </li>
          ))}
        </ul>

        <button type="button" className="rulesModalConfirm" onClick={onClose}>
          Got it
        </button>
      </section>
    </div>
  )
}

function RuleIcon({ ruleSet, size = "md", mode = "default" }) {
  const sizeClass = size === "lg" ? "ruleCheckersIcon--lg" : ""

  if (ruleSet === "british") {
    return <i className="ruleFlags" aria-hidden="true">🇬🇧 🇺🇸</i>
  }

  if (mode === "select") {
    return null
  }

  return (
    <i className={`ruleCheckersIcon ${sizeClass}`} aria-hidden="true">
      <span />
      <span />
    </i>
  )
}

function SettingGroup({ title, children }) {
  return (
    <div className="settingGroup">
      <p>{title}</p>
      {children}
    </div>
  )
}

function HistoryView({ records }) {
  return (
    <section className="contentCard wideCard historyCard">
      <div className="cardHeader">
        <div>
          <h2>Past games</h2>
        </div>
      </div>
      <RecentGames games={records} expanded />
    </section>
  )
}

function LeaderboardView({ entries, currentUserStorageId, currentAvatar }) {
  return (
    <section className="contentCard wideCard">
      <div className="cardHeader leaderboardHeader">
        <div>
          <h2>Leaderboard</h2>
        </div>
      </div>
      {entries.length === 0 ? (
        <p className="emptyText">No ranked players yet. Sign in and complete a valid AI match to enter the board.</p>
      ) : (
        <div className="leaderboardTable">
          {entries.map((row) => {
            const isCurrentUser = row.storageId === currentUserStorageId
            const playerAvatar = isCurrentUser ? currentAvatar : loadAvatarByStorageId(row.storageId)
            const initial = row.username[0]?.toUpperCase() || "?"

            return (
              <article
                key={row.storageId}
                className={isCurrentUser ? "leaderboardRow--current" : ""}
              >
                <span className="leaderboardRank">#{row.rank}</span>
                <div className="leaderboardPlayer">
                  <AvatarPreview avatar={playerAvatar} initial={initial} className="leaderboardAvatar" />
                  <strong>{row.username}</strong>
                </div>
                <p className="leaderboardMetric">
                  <small>Rating</small>
                  <b>{row.rating}</b>
                </p>
                <p className="leaderboardMetric">
                  <small>Wins</small>
                  <b>{row.competitiveWins}</b>
                  <span>{row.competitiveTotal} ranked</span>
                </p>
                <em>{row.winRate}%</em>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

function ShopView({ coins, inventory, onBuy, onEquip }) {
  const collections = getCosmeticCollections().filter((collection) => collection.type !== "pieceStyle")

  return (
    <section className="contentCard wideCard cosmeticStore">
      <div className="cardHeader cosmeticStoreHeader">
        <div>
          <h2>Store</h2>
          <p>Collect board themes and gameplay atmospheres for the arena.</p>
        </div>
        <span>{coins} coins</span>
      </div>

      <div className="cosmeticCollections">
        {collections.map((collection) => (
          <section key={collection.type} className="cosmeticCollection">
            <div className="cosmeticCollectionHeader">
              <div>
                <h3>{collection.title}</h3>
                <p>{collection.description}</p>
              </div>
            </div>

            <div className="cosmeticGrid">
              {collection.items.map((item) => (
                <CosmeticCard
                  key={item.id}
                  item={item}
                  type={collection.type}
                  coins={coins}
                  isOwned={isCosmeticOwned(inventory, collection.type, item.id)}
                  isEquipped={isCosmeticEquipped(inventory, collection.type, item.id)}
                  onBuy={onBuy}
                  onEquip={onEquip}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}

function InventoryView({ inventory, equippedCosmetics, onEquip }) {
  const ownedItems = getInventoryItems(inventory)

  return (
    <section className="contentCard wideCard cosmeticStore">
      <div className="cardHeader cosmeticStoreHeader">
        <div>
          <p className="sectionLabel">Your collection</p>
          <h2>Inventory</h2>
          <p>Owned cosmetics are permanent and scoped to this player account.</p>
        </div>
      </div>

      <EquippedCosmeticsSummary equippedCosmetics={equippedCosmetics} />

      <div className="cosmeticGrid inventoryCosmeticGrid">
        {ownedItems.map((item) => (
          <CosmeticCard
            key={`${item.type}-${item.id}`}
            item={item}
            type={item.type}
            coins={0}
            isOwned
            isEquipped={item.isEquipped}
            inventoryMode
            onBuy={() => {}}
            onEquip={onEquip}
          />
        ))}
      </div>
    </section>
  )
}

function EquippedCosmeticsSummary({ equippedCosmetics }) {
  return (
    <section className="equippedCosmetics" aria-label="Equipped cosmetics">
      <EquippedCosmeticSlot label="Theme" item={equippedCosmetics.theme} />
      <EquippedCosmeticSlot label="Background" item={equippedCosmetics.background} />
      <EquippedCosmeticSlot label="Pieces" item={equippedCosmetics.pieceStyle} />
    </section>
  )
}

function EquippedCosmeticSlot({ label, item }) {
  return (
    <article>
      <CosmeticPreview item={item} compact />
      <div>
        <span>{label}</span>
        <strong>{item.name}</strong>
      </div>
    </article>
  )
}

function CosmeticCard({
  item,
  type,
  coins,
  isOwned,
  isEquipped,
  inventoryMode = false,
  onBuy,
  onEquip,
}) {
  const canAfford = coins >= item.price
  const actionLabel = getCosmeticActionLabel(item, isOwned, isEquipped, canAfford, inventoryMode)
  const isDisabled = isEquipped || (!isOwned && !canAfford)
  const isInsufficientFunds = !isOwned && !canAfford && !inventoryMode
  const footerLabel = getCosmeticFooterLabel(item, isOwned, isEquipped, canAfford, inventoryMode)
  const footerClassName = inventoryMode ? "cosmeticCardFooter cosmeticCardFooter--actionsOnly" : "cosmeticCardFooter"
  const actionClassName = [
    isOwned && !isEquipped ? "secondaryAction" : "primaryAction",
    isInsufficientFunds ? "insufficientFundsButton" : "",
  ]
    .filter(Boolean)
    .join(" ")

  function handleAction() {
    if (isEquipped) {
      return
    }

    if (isOwned) {
      onEquip(type, item.id)
      return
    }

    onBuy(type, item.id)
  }

  return (
    <article className={`cosmeticCard rarity-${item.rarity.toLowerCase()}`}>
      <CosmeticPreview item={item} />
      <div className="cosmeticCardBody">
        <div className="cosmeticCardTitle">
          <span>{item.rarity}</span>
          <strong>{item.name}</strong>
        </div>
        <p>{item.tagline}</p>
      </div>
      <div className={footerClassName}>
        {!inventoryMode && <span>{footerLabel}</span>}
        <button
          type="button"
          className={actionClassName}
          onClick={handleAction}
          disabled={isDisabled}
        >
          {isInsufficientFunds && <span className="coinButtonIcon" aria-hidden="true" />}
          {actionLabel}
        </button>
      </div>
    </article>
  )
}

function CosmeticPreview({ item, compact = false }) {
  if (item.type === "background") {
    const [from, middle, to] = item.preview

    return (
      <div
        className={compact ? "cosmeticPreview compact backgroundPreview" : "cosmeticPreview backgroundPreview"}
        style={{
          "--preview-from": from,
          "--preview-middle": middle,
          "--preview-to": to,
          "--preview-glow": middle,
        }}
        aria-hidden="true"
      />
    )
  }

  if (item.type === "pieceStyle") {
    return (
      <div
        className={compact ? "cosmeticPreview compact pieceStylePreview" : "cosmeticPreview pieceStylePreview"}
        style={{
          "--preview-piece-light": item.preview.light,
          "--preview-piece-dark": item.preview.dark,
          "--preview-glow": item.preview.glow,
        }}
        aria-hidden="true"
      >
        <span />
        <span />
      </div>
    )
  }

  return (
    <div
      className={compact ? "cosmeticPreview compact themePreview" : "cosmeticPreview themePreview"}
      style={{
        "--preview-light": item.preview.light,
        "--preview-dark": item.preview.dark,
        "--preview-glow": item.preview.glow,
        "--preview-piece-light": item.preview.pieceLight,
        "--preview-piece-dark": item.preview.pieceDark,
      }}
      aria-hidden="true"
    >
      {Array.from({ length: compact ? 16 : 32 }, (_, index) => (
        <i key={index} />
      ))}
      <span className="previewPiece light" />
      <span className="previewPiece dark" />
    </div>
  )
}

function getCosmeticActionLabel(item, isOwned, isEquipped, canAfford, inventoryMode) {
  if (isEquipped) return "Equipped"
  if (isOwned) return "Equip"
  if (inventoryMode) return "Locked"
  if (!canAfford) return `${item.price} coins`
  return item.price === 0 ? "Unlock" : "Buy"
}

function getCosmeticFooterLabel(item, isOwned, isEquipped, canAfford, inventoryMode) {
  if (isEquipped) return "Equipped"
  if (isOwned) return "Owned"
  if (inventoryMode) return "Locked"
  if (!canAfford) return "Insufficient funds"
  return `${item.price} coins`
}

function ProfileView({ user, stats, records, coins, avatar, onAvatarChange, onLogout }) {
  const displayName = user?.user_metadata?.username || user?.email?.split("@")[0] || "Player"
  const initial = displayName[0]?.toUpperCase() || "?"
  const isGuest = user?.email?.includes("guest")
  const recentGames = records.slice(0, 3)
  const [avatarError, setAvatarError] = useState("")
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [avatarDraft, setAvatarDraft] = useState(avatar)

  function handlePhotoUpload(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (!file.type.startsWith("image/")) {
      setAvatarError("Choose an image file")
      return
    }

    if (file.size > 1_500_000) {
      setAvatarError("Image must be under 1.5 MB")
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      setAvatarError("")
      setAvatarDraft({
        type: "image",
        id: "custom",
        src: reader.result,
        zoom: 1,
        positionX: 50,
        positionY: 50,
      })
    }

    reader.onerror = () => {
      setAvatarError("Could not load this image")
    }

    reader.readAsDataURL(file)
    event.target.value = ""
  }

  return (
    <section className="contentCard profilePage">
      <div className="profileHero">
        <div className="profileAvatarStack">
          <button
            type="button"
            className="profileAvatarButton"
            onClick={() => {
              setAvatarDraft(avatar)
              setAvatarError("")
              setShowAvatarModal(true)
            }}
            aria-label="Edit avatar"
          >
            <AvatarPreview avatar={avatar} initial={initial} className="profileAvatar" />
            <span className="profileAvatarHint">Customize</span>
          </button>
          {isGuest && <span className="profileBadge">Guest</span>}
        </div>
        <div className="profileHeroBody">
          <p className="sectionLabel">Account</p>
          <h2>{displayName}</h2>
          <p className="profileEmail">{user?.email}</p>
          <p className="profileSummary">
            {stats.total > 0
              ? `${stats.wins} wins · ${stats.winRate}% win rate · ${stats.total} games played`
              : "Play your first match to unlock full stats."}
          </p>
        </div>
        <button type="button" className="profileLogoutButton" onClick={onLogout}>
          Log out
        </button>
      </div>

      {showAvatarModal && (
        <AvatarEditorModal
          avatar={avatarDraft}
          avatarError={avatarError}
          initial={initial}
          onAvatarChange={setAvatarDraft}
          onClose={() => {
            setAvatarError("")
            setShowAvatarModal(false)
          }}
          onPhotoUpload={handlePhotoUpload}
          onSave={() => {
            setAvatarError("")
            onAvatarChange(avatarDraft)
            setShowAvatarModal(false)
          }}
          setAvatarError={setAvatarError}
        />
      )}

      <div className="profileStatsGrid">
        <ProfileStat icon="rating" label="Rating" value={stats.rating} tone="gold" />
        <ProfileStat icon="coins" label="Coins" value={coins} tone="green" />
        <ProfileStat icon="wins" label="Wins" value={stats.wins} tone="green" />
        <ProfileStat icon="games" label="Games" value={stats.total} tone="blue" />
        <ProfileStat icon="rate" label="Win rate" value={`${stats.winRate}%`} tone="blue" />
        <ProfileStat icon="losses" label="Losses" value={stats.losses} tone="muted" />
      </div>

      {recentGames.length > 0 && (
        <div className="profileRecent">
          <p className="sectionLabel">Recent matches</p>
          <div className="profileRecentList">
            {recentGames.map((game) => (
              <article key={game.id} className={`profileRecentItem profileRecentItem--${game.result}`}>
                <strong>{formatResult(game.result)}</strong>
                <span>
                  {game.opponentType} · {game.difficulty} · {game.moveCount} moves
                </span>
                <time>{formatDate(game.createdAt)}</time>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function AvatarEditorModal({
  avatar,
  avatarError,
  initial,
  onAvatarChange,
  onClose,
  onPhotoUpload,
  onSave,
  setAvatarError,
}) {
  function updateImageSetting(key, value) {
    onAvatarChange({
      ...avatar,
      [key]: value,
    })
  }

  const customAvatar = avatar?.type === "custom" ? avatar : customAvatarDefaults

  return (
    <div
      className="avatarModalOverlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-modal-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section className="avatarModal">
        <button type="button" className="avatarModalClose" onClick={onClose} aria-label="Close avatar editor">
          ×
        </button>

        <header className="avatarModalHeader">
          <div>
            <p className="sectionLabel">Avatar</p>
            <h2 id="avatar-modal-title">Choose your look</h2>
          </div>
          <AvatarPreview avatar={avatar} initial={initial} className="avatarModalPreview" />
        </header>

        <div className="avatarUploadPanel">
          <label className="avatarUploadButton">
            <input type="file" accept="image/*" onChange={onPhotoUpload} />
            Upload photo
          </label>
          <p>Custom image</p>
        </div>

        {avatar?.type === "image" && (
          <div className="avatarCropControls">
            <label>
              <span>Zoom</span>
              <input
                type="range"
                min="1"
                max="2.4"
                step="0.05"
                value={avatar.zoom ?? 1}
                onChange={(event) => updateImageSetting("zoom", Number(event.target.value))}
              />
            </label>
            <label>
              <span>Move horizontal</span>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={avatar.positionX ?? 50}
                onChange={(event) => updateImageSetting("positionX", Number(event.target.value))}
              />
            </label>
            <label>
              <span>Move vertical</span>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={avatar.positionY ?? 50}
                onChange={(event) => updateImageSetting("positionY", Number(event.target.value))}
              />
            </label>
            <button
              type="button"
              className="avatarResetButton"
              onClick={() =>
                onAvatarChange({
                  ...avatar,
                  zoom: 1,
                  positionX: 50,
                  positionY: 50,
                })
              }
            >
              Reset crop
            </button>
          </div>
        )}

        <div className="avatarPresetGrid">
          {avatarPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={avatar?.type === "preset" && avatar.id === preset.id ? "avatarPreset active" : "avatarPreset"}
              onClick={() => {
                setAvatarError("")
                onAvatarChange({
                  type: "preset",
                  id: preset.id,
                  colors: preset.colors,
                  symbol: preset.symbol,
                })
              }}
            >
              <AvatarPreview
                avatar={{
                  type: "preset",
                  id: preset.id,
                  colors: preset.colors,
                  symbol: preset.symbol,
                }}
                initial={initial}
              />
              <span>{preset.name}</span>
            </button>
          ))}
        </div>

        <section className="avatarCustomPanel" aria-label="Build custom avatar">
          <div className="avatarCustomHeader">
            <div>
              <p className="sectionLabel">Custom</p>
              <h3>Color and symbol</h3>
            </div>
            <button
              type="button"
              className={avatar?.type === "custom" ? "avatarUseCustom active" : "avatarUseCustom"}
              onClick={() => {
                setAvatarError("")
                onAvatarChange(customAvatar)
              }}
            >
              Use custom
            </button>
          </div>

          <div className="avatarColorRow">
            <label>
              <span>Color 1</span>
              <input
                type="color"
                value={customAvatar.colors?.[0] ?? customAvatarDefaults.colors[0]}
                onChange={(event) =>
                  onAvatarChange({
                    ...customAvatar,
                    colors: [event.target.value, customAvatar.colors?.[1] ?? customAvatarDefaults.colors[1]],
                  })
                }
              />
            </label>
            <label>
              <span>Color 2</span>
              <input
                type="color"
                value={customAvatar.colors?.[1] ?? customAvatarDefaults.colors[1]}
                onChange={(event) =>
                  onAvatarChange({
                    ...customAvatar,
                    colors: [customAvatar.colors?.[0] ?? customAvatarDefaults.colors[0], event.target.value],
                  })
                }
              />
            </label>
            <label>
              <span>Gradient</span>
              <select
                value={customAvatar.gradient ?? customAvatarDefaults.gradient}
                onChange={(event) =>
                  onAvatarChange({
                    ...customAvatar,
                    gradient: event.target.value,
                  })
                }
              >
                <option value="135deg">Diagonal</option>
                <option value="90deg">Horizontal</option>
                <option value="180deg">Vertical</option>
                <option value="45deg">Reverse</option>
              </select>
            </label>
          </div>

          <div className="avatarSymbolGrid" aria-label="Avatar symbols">
            {avatarSymbols.map((symbol) => (
              <button
                key={symbol}
                type="button"
                className={
                  avatar?.type === "custom" && customAvatar.symbol === symbol
                    ? "avatarSymbolButton active"
                    : "avatarSymbolButton"
                }
                onClick={() =>
                  onAvatarChange({
                    ...customAvatar,
                    symbol,
                  })
                }
              >
                {symbol}
              </button>
            ))}
          </div>
        </section>

        {avatarError && <p className="avatarError">{avatarError}</p>}

        <div className="avatarModalActions">
          <button type="button" className="avatarCancelButton" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="avatarSaveButton" onClick={onSave}>
            Save
          </button>
        </div>
      </section>
    </div>
  )
}

function AvatarPreview({ avatar, initial, className = "" }) {
  const classNames = [
    className,
    "avatarPreview",
    avatar?.type === "image" ? "avatarPreview--image" : "",
    avatar?.type === "preset" ? `avatarPreview--${avatar.id}` : "",
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <span
      className={classNames}
      style={getAvatarBackground(avatar) ? { background: getAvatarBackground(avatar) } : undefined}
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
    </span>
  )
}


function ProfileStat({ icon, label, value, tone = "blue" }) {
  return (
    <article className={`profileStat profileStat--${tone}`}>
      <span className={`profileStatIcon profileStatIcon--${icon}`} aria-hidden="true" />
      <span className="profileStatCopy">
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
    </article>
  )
}


function MiniBoard({ variant = "default" }) {
  const pieces = new Map([
    ["0-1", "dark"],
    ["0-5", "dark"],
    ["1-2", "dark"],
    ["2-3", "red"],
    ["3-4", "dark"],
    ["4-3", "red"],
    ["5-0", "red"],
    ["6-5", "red"],
  ])

  return (
    <div className={variant === "hero" ? "miniBoard heroBoard" : "miniBoard"} aria-hidden="true">
      {Array.from({ length: 64 }, (_, index) => {
        const row = Math.floor(index / 8)
        const col = index % 8
        const piece = pieces.get(`${row}-${col}`)

        return (
          <span key={`${row}-${col}`} className={(row + col) % 2 === 0 ? "light" : "dark"}>
            {piece && <i className={piece} />}
          </span>
        )
      })}
    </div>
  )
}

function RecentGames({ games, expanded = false }) {
  if (games.length === 0) {
    return (
      <p className={expanded ? "emptyText historyEmpty" : "emptyText"}>
        {expanded ? "No matches played yet" : "No saved games yet. Start a match to create your first record."}
      </p>
    )
  }

  return (
    <div className={expanded ? "gameList expanded" : "gameList"}>
      {games.map((game) => (
        <article key={game.id} className={`gameRecord gameRecord--${game.result}`}>
          <div className="gameRecordMain">
            <strong className="matchResult">{formatResult(game.result)}</strong>
            <p>
              {game.opponentType} · {game.difficulty} · {game.moveCount} moves
            </p>
          </div>
          <time>{formatDate(game.createdAt)}</time>
        </article>
      ))}
    </div>
  )
}

function formatResult(result) {
  if (result === "win") return "Win"
  if (result === "loss") return "Loss"
  return "Draw"
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}
