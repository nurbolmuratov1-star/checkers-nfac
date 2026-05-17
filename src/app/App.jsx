import { useEffect, useMemo, useRef, useState } from "react"
import { AuthPage } from "../features/auth/AuthPage"
import { CheckersApp } from "../features/checkers/CheckersApp"
import { ArenaHome } from "../features/home/ArenaHome"
import { ensureUserProfile } from "../lib/authProfile"
import {
  getGameplayCosmeticStyle,
  loadCosmeticInventory,
  saveCosmeticInventory,
} from "../lib/cosmetics.js"
import { addGameRecord, loadGameRecords } from "../lib/gameArchive"
import {
  applyCompletedMatchToProgress,
  getDisplayStats,
  getLeaderboardEntries,
  loadPlayerProgress,
  registerLeaderboardPlayer,
} from "../lib/playerProgress.js"
import { supabase } from "../lib/supabaseClient"
import { getUserStorageId, getUserStorageKey } from "../lib/userStorage.js"

const NAVIGATION_STATE_NAMESPACE = "navigation-state"
const ACTIVE_GAME_NAMESPACE = "active-game"
const DEMO_USER_STORAGE_KEY = "damalab:demo-user-active"
const DEMO_USER = {
  email: "guest@checkers.flow",
  user_metadata: { username: "Guest" },
}
const DEFAULT_GAME_CONFIG = {
  gameMode: "ai",
  difficulty: "medium",
  playerSide: "red",
  ruleSet: "classic",
  mandatoryCapture: true,
}

const validScreens = new Set(["dashboard", "play", "leaderboard", "shop", "inventory", "history", "profile", "game"])

export default function App() {
  const [user, setUser] = useState(null)
  const [demoUser, setDemoUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [screen, setScreen] = useState("dashboard")
  const [navigationHydratedFor, setNavigationHydratedFor] = useState("")
  const [restoreSavedGame, setRestoreSavedGame] = useState(true)
  const [recordsVersion, setRecordsVersion] = useState(0)
  const [progressVersion, setProgressVersion] = useState(0)
  const [cosmeticsVersion, setCosmeticsVersion] = useState(0)
  const [gameConfig, setGameConfig] = useState(DEFAULT_GAME_CONFIG)
  const [hasActiveGame, setHasActiveGame] = useState(false)
  const [isActiveGameUnfinished, setIsActiveGameUnfinished] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState(null)
  const allowHistoryNavigation = useRef(false)
  const activeUser = user ?? demoUser
  const activeUserStorageId = activeUser ? getUserStorageId(activeUser) : ""
  const activeRecords = useMemo(() => {
    void recordsVersion
    return activeUser ? loadGameRecords(activeUser) : []
  }, [activeUser, recordsVersion])
  const activeProgress = useMemo(() => {
    void progressVersion
    return loadPlayerProgress(activeUser)
  }, [activeUser, progressVersion])
  const activeStats = useMemo(() => getDisplayStats(activeProgress), [activeProgress])
  const leaderboardEntries = useMemo(
    () => getLeaderboardEntries(activeUser, activeProgress),
    [activeProgress, activeUser],
  )
  const cosmeticInventory = useMemo(() => {
    void cosmeticsVersion
    return loadCosmeticInventory(activeUser)
  }, [activeUser, cosmeticsVersion])
  const gameplayCosmeticStyle = useMemo(
    () => getGameplayCosmeticStyle(cosmeticInventory),
    [cosmeticInventory],
  )

  useEffect(() => {
    let isMounted = true

    async function loadSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        await ensureUserProfile(user)
      }

      if (isMounted) {
        setUser(user)
        setDemoUser(user ? null : loadDemoUser())
        setIsLoading(false)
      }
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUser = session?.user ?? null

      if (nextUser) {
        void ensureUserProfile(nextUser)
      }

      setUser(nextUser)

      if (nextUser) {
        setDemoUser(null)
        clearDemoUser()
      }

      if (event === "SIGNED_OUT") {
        setDemoUser(null)
        clearDemoUser()
        setScreen("dashboard")
        setHasActiveGame(false)
        setIsActiveGameUnfinished(false)
        setRestoreSavedGame(true)
        setNavigationHydratedFor("")
      }

      setIsLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    registerLeaderboardPlayer(activeUser)
  }, [activeUser])

  useEffect(() => {
    let isCurrent = true

    if (!activeUser) {
      queueMicrotask(() => {
        if (isCurrent) {
          setNavigationHydratedFor("")
        }
      })

      return () => {
        isCurrent = false
      }
    }

    const savedState = loadNavigationState(activeUser)
    const nextScreen = savedState.screen ?? "dashboard"
    const savedGameExists = hasSavedActiveGame(activeUser)

    queueMicrotask(() => {
      if (!isCurrent) {
        return
      }

      setScreen(nextScreen)
      setGameConfig(savedState.gameConfig ?? DEFAULT_GAME_CONFIG)
      setRestoreSavedGame(nextScreen === "game" || savedGameExists)
      setHasActiveGame(nextScreen === "game" || savedGameExists)
      setIsActiveGameUnfinished(nextScreen === "game" || savedGameExists)
      setNavigationHydratedFor(activeUserStorageId)
    })

    return () => {
      isCurrent = false
    }
  }, [activeUser, activeUserStorageId])

  useEffect(() => {
    if (!activeUser || navigationHydratedFor !== activeUserStorageId) {
      return
    }

    saveNavigationState(activeUser, {
      screen,
      gameConfig,
    })
  }, [activeUser, activeUserStorageId, gameConfig, navigationHydratedFor, screen])

  const shouldProtectGameNavigation = screen === "game" && isActiveGameUnfinished

  useEffect(() => {
    if (!shouldProtectGameNavigation) {
      return undefined
    }

    function handleBeforeUnload(event) {
      if (allowHistoryNavigation.current) {
        return
      }

      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [shouldProtectGameNavigation])

  useEffect(() => {
    if (!shouldProtectGameNavigation) {
      return undefined
    }

    window.history.pushState({ checkersGameGuard: true }, "", window.location.href)

    function handlePopState() {
      if (allowHistoryNavigation.current) {
        allowHistoryNavigation.current = false
        return
      }

      window.history.pushState({ checkersGameGuard: true }, "", window.location.href)
      setPendingNavigation({ type: "history" })
    }

    window.addEventListener("popstate", handlePopState)

    return () => window.removeEventListener("popstate", handlePopState)
  }, [shouldProtectGameNavigation])

  if (isLoading) {
    return (
      <main className="screenLoader">
        <span>Loading arena...</span>
      </main>
    )
  }

  if (!activeUser) {
    return (
      <AuthPage
        onContinueAsGuest={() => {
          saveDemoUser()
          setDemoUser(DEMO_USER)
        }}
      />
    )
  }

  function handleSectionChange(nextSection) {
    if (nextSection === "play" && hasActiveGame) {
      setRestoreSavedGame(true)
      setScreen("game")
      return
    }

    if (shouldProtectGameNavigation) {
      setPendingNavigation({ type: "section", target: nextSection })
      return
    }

    setScreen(nextSection)
  }

  function handleStayInGame() {
    setPendingNavigation(null)
  }

  function handleLeaveGame() {
    const navigation = pendingNavigation

    clearSavedActiveGame(activeUser)
    setPendingNavigation(null)
    setHasActiveGame(false)
    setIsActiveGameUnfinished(false)
    setRestoreSavedGame(false)

    if (navigation?.type === "history") {
      allowHistoryNavigation.current = true
      window.history.back()
      return
    }

    setScreen(navigation?.target ?? "dashboard")
  }

  return (
    <>
      <ArenaHome
        key={activeUserStorageId}
        user={activeUser}
        records={activeRecords}
        stats={activeStats}
        leaderboardEntries={leaderboardEntries}
        cosmeticInventory={cosmeticInventory}
        onCosmeticInventoryChange={(nextInventory) => {
          saveCosmeticInventory(activeUser, nextInventory)
          setCosmeticsVersion((currentVersion) => currentVersion + 1)
        }}
        currentUserStorageId={activeUserStorageId}
        activeSection={screen}
        hasActiveGame={hasActiveGame}
        gameView={
          hasActiveGame ? (
            <CheckersApp
              key={activeUserStorageId}
              user={activeUser}
              initialConfig={gameConfig}
              restoreSavedGame={restoreSavedGame}
              cosmeticStyle={gameplayCosmeticStyle}
              onActiveGameStatusChange={setIsActiveGameUnfinished}
              onBackToSettings={() => {
                clearSavedActiveGame(activeUser)
                setHasActiveGame(false)
                setIsActiveGameUnfinished(false)
                setRestoreSavedGame(false)
                setScreen("play")
              }}
              onGameComplete={(record) => {
                setIsActiveGameUnfinished(false)
                addGameRecord(activeUser, record)
                applyCompletedMatchToProgress(activeUser, record)
                setRecordsVersion((currentVersion) => currentVersion + 1)
                setProgressVersion((currentVersion) => currentVersion + 1)
              }}
            />
          ) : null
        }
        onSectionChange={handleSectionChange}
        onStartGame={(config) => {
          setGameConfig((currentConfig) => ({ ...currentConfig, ...config }))
          setHasActiveGame(true)
          setIsActiveGameUnfinished(true)
          setRestoreSavedGame(false)
          setScreen("game")
        }}
        onLogout={async () => {
          setScreen("dashboard")
          setHasActiveGame(false)
          setIsActiveGameUnfinished(false)
          setRestoreSavedGame(true)
          setNavigationHydratedFor("")
          clearDemoUser()
          setDemoUser(null)
          await supabase.auth.signOut()
        }}
      />

      {pendingNavigation && (
        <LeaveGameModal onStay={handleStayInGame} onLeave={handleLeaveGame} />
      )}
    </>
  )
}

function LeaveGameModal({ onStay, onLeave }) {
  return (
    <div className="leaveGameOverlay" role="dialog" aria-modal="true" aria-labelledby="leave-game-title">
      <section className="leaveGameModal">
        <h2 id="leave-game-title">Leave current game?</h2>
        <p>Your current match will be ended if you leave this page.</p>
        <div className="leaveGameActions">
          <button type="button" className="leaveGameStayButton" onClick={onStay} autoFocus>
            Stay
          </button>
          <button type="button" className="leaveGameConfirmButton" onClick={onLeave}>
            Leave game
          </button>
        </div>
      </section>
    </div>
  )
}

function loadNavigationState(user) {
  try {
    const saved = localStorage.getItem(getNavigationStateKey(user))
    const parsedState = saved ? JSON.parse(saved) : null
    const screen = validScreens.has(parsedState?.screen) ? parsedState.screen : "dashboard"

    return {
      screen,
      gameConfig: normalizeGameConfig(parsedState?.gameConfig),
    }
  } catch {
    return {
      screen: "dashboard",
      gameConfig: DEFAULT_GAME_CONFIG,
    }
  }
}

function saveNavigationState(user, state) {
  localStorage.setItem(
    getNavigationStateKey(user),
    JSON.stringify({
      screen: validScreens.has(state.screen) ? state.screen : "dashboard",
      gameConfig: normalizeGameConfig(state.gameConfig),
    }),
  )
}

function normalizeGameConfig(config) {
  return {
    ...DEFAULT_GAME_CONFIG,
    ...(config ?? {}),
    mandatoryCapture:
      typeof config?.mandatoryCapture === "boolean"
        ? config.mandatoryCapture
        : DEFAULT_GAME_CONFIG.mandatoryCapture,
  }
}

function getNavigationStateKey(user) {
  return getUserStorageKey(user, NAVIGATION_STATE_NAMESPACE)
}

function hasSavedActiveGame(user) {
  try {
    return Boolean(localStorage.getItem(getUserStorageKey(user, ACTIVE_GAME_NAMESPACE)))
  } catch {
    return false
  }
}

function clearSavedActiveGame(user) {
  try {
    localStorage.removeItem(getUserStorageKey(user, ACTIVE_GAME_NAMESPACE))
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}

function loadDemoUser() {
  try {
    return localStorage.getItem(DEMO_USER_STORAGE_KEY) === "true" ? DEMO_USER : null
  } catch {
    return null
  }
}

function saveDemoUser() {
  localStorage.setItem(DEMO_USER_STORAGE_KEY, "true")
}

function clearDemoUser() {
  localStorage.removeItem(DEMO_USER_STORAGE_KEY)
}
