import { getUserStorageId, getUserStorageKey } from "./userStorage.js"

const PLAYER_PROGRESS_NAMESPACE = "player-progress"
const LEADERBOARD_KEY = "damalab:leaderboard:players"
const MIN_COMPETITIVE_MOVES = 8
const MIN_COMPETITIVE_DURATION_MS = 20_000

const AI_RATING_REWARDS = {
  easy: 5,
  medium: 10,
  hard: 20,
}

const AI_RATING_PENALTIES = {
  easy: 0,
  medium: -4,
  hard: -8,
}

export function getDefaultPlayerProgress() {
  return {
    rating: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    total: 0,
    competitiveWins: 0,
    competitiveLosses: 0,
    competitiveTotal: 0,
    ratingDeltaTotal: 0,
    lastMatchAt: null,
  }
}

export function loadPlayerProgress(user) {
  try {
    if (!user) {
      return getDefaultPlayerProgress()
    }

    const saved = localStorage.getItem(getPlayerProgressKey(user))
    return normalizeProgress(saved ? JSON.parse(saved) : null)
  } catch {
    return getDefaultPlayerProgress()
  }
}

export function savePlayerProgress(user, progress) {
  if (!user) {
    return getDefaultPlayerProgress()
  }

  const nextProgress = normalizeProgress(progress)
  localStorage.setItem(getPlayerProgressKey(user), JSON.stringify(nextProgress))
  syncLeaderboardPlayer(user, nextProgress)

  return nextProgress
}

export function registerLeaderboardPlayer(user) {
  if (!isLeaderboardEligibleUser(user)) {
    return
  }

  syncLeaderboardPlayer(user, loadPlayerProgress(user))
}

export function applyCompletedMatchToProgress(user, record) {
  const currentProgress = loadPlayerProgress(user)
  const ratingDelta = getRatingDelta(record)
  const isCompetitive = ratingDelta !== 0 || isValidCompetitiveLoss(record)
  const resultCounts = getResultCounts(record.result)
  const nextProgress = normalizeProgress({
    ...currentProgress,
    rating: Math.max(0, currentProgress.rating + ratingDelta),
    wins: currentProgress.wins + resultCounts.wins,
    losses: currentProgress.losses + resultCounts.losses,
    draws: currentProgress.draws + resultCounts.draws,
    total: currentProgress.total + 1,
    competitiveWins: currentProgress.competitiveWins + (isCompetitive && record.result === "win" ? 1 : 0),
    competitiveLosses: currentProgress.competitiveLosses + (isCompetitive && record.result === "loss" ? 1 : 0),
    competitiveTotal: currentProgress.competitiveTotal + (isCompetitive ? 1 : 0),
    ratingDeltaTotal: currentProgress.ratingDeltaTotal + ratingDelta,
    lastMatchAt: record.createdAt ?? new Date().toISOString(),
  })

  savePlayerProgress(user, nextProgress)

  return {
    progress: nextProgress,
    ratingDelta,
    isCompetitive,
  }
}

export function getLeaderboardEntries(currentUser = null, currentProgress = null) {
  const currentEntry =
    isLeaderboardEligibleUser(currentUser) && currentProgress
      ? normalizeLeaderboardEntry({
          storageId: getUserStorageId(currentUser),
          username: getUserDisplayName(currentUser),
          ...currentProgress,
        })
      : null
  const savedEntries = loadLeaderboardPlayers()
  const entries = currentEntry
    ? [currentEntry, ...savedEntries.filter((entry) => entry.storageId !== currentEntry.storageId)]
    : savedEntries

  return entries
    .sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating
      if (b.competitiveWins !== a.competitiveWins) return b.competitiveWins - a.competitiveWins
      return a.username.localeCompare(b.username)
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
      winRate: entry.competitiveTotal > 0 ? Math.round((entry.competitiveWins / entry.competitiveTotal) * 100) : 0,
    }))
}

export function getDisplayStats(progress) {
  const normalizedProgress = normalizeProgress(progress)
  const winRate =
    normalizedProgress.total > 0 ? Math.round((normalizedProgress.wins / normalizedProgress.total) * 100) : 0
  const competitiveWinRate =
    normalizedProgress.competitiveTotal > 0
      ? Math.round((normalizedProgress.competitiveWins / normalizedProgress.competitiveTotal) * 100)
      : 0

  return {
    ...normalizedProgress,
    winRate,
    competitiveWinRate,
  }
}

function getRatingDelta(record) {
  if (!isValidCompetitiveMatch(record)) {
    return 0
  }

  if (record.result === "win") {
    return AI_RATING_REWARDS[record.difficulty] ?? AI_RATING_REWARDS.medium
  }

  if (record.result === "loss") {
    return AI_RATING_PENALTIES[record.difficulty] ?? AI_RATING_PENALTIES.medium
  }

  return 0
}

function isValidCompetitiveLoss(record) {
  return isValidCompetitiveMatch(record) && record.result === "loss"
}

function isValidCompetitiveMatch(record) {
  return (
    record?.opponentType === "AI" &&
    (record.result === "win" || record.result === "loss") &&
    Number(record.moveCount) >= MIN_COMPETITIVE_MOVES &&
    Number(record.durationMs) >= MIN_COMPETITIVE_DURATION_MS
  )
}

function getResultCounts(result) {
  return {
    wins: result === "win" ? 1 : 0,
    losses: result === "loss" ? 1 : 0,
    draws: result === "draw" ? 1 : 0,
  }
}

function syncLeaderboardPlayer(user, progress) {
  if (!isLeaderboardEligibleUser(user)) {
    return
  }

  const entries = loadLeaderboardPlayers()
  const storageId = getUserStorageId(user)
  const nextEntry = {
    storageId,
    username: getUserDisplayName(user),
    rating: progress.rating,
    wins: progress.wins,
    losses: progress.losses,
    total: progress.total,
    competitiveWins: progress.competitiveWins,
    competitiveLosses: progress.competitiveLosses,
    competitiveTotal: progress.competitiveTotal,
    updatedAt: new Date().toISOString(),
  }
  const nextEntries = [nextEntry, ...entries.filter((entry) => entry.storageId !== storageId)]

  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(nextEntries))
}

function loadLeaderboardPlayers() {
  try {
    const saved = localStorage.getItem(LEADERBOARD_KEY)
    return saved ? JSON.parse(saved).map(normalizeLeaderboardEntry).filter(Boolean) : []
  } catch {
    return []
  }
}

function normalizeLeaderboardEntry(entry) {
  if (!entry?.storageId || !entry?.username) {
    return null
  }

  return {
    storageId: entry.storageId,
    username: entry.username,
    rating: Number(entry.rating) || 0,
    wins: Number(entry.wins) || 0,
    losses: Number(entry.losses) || 0,
    total: Number(entry.total) || 0,
    competitiveWins: Number(entry.competitiveWins) || 0,
    competitiveLosses: Number(entry.competitiveLosses) || 0,
    competitiveTotal: Number(entry.competitiveTotal) || 0,
    updatedAt: entry.updatedAt ?? null,
  }
}

function normalizeProgress(progress) {
  const defaults = getDefaultPlayerProgress()

  return {
    rating: Number(progress?.rating) || defaults.rating,
    wins: Number(progress?.wins) || defaults.wins,
    losses: Number(progress?.losses) || defaults.losses,
    draws: Number(progress?.draws) || defaults.draws,
    total: Number(progress?.total) || defaults.total,
    competitiveWins: Number(progress?.competitiveWins) || defaults.competitiveWins,
    competitiveLosses: Number(progress?.competitiveLosses) || defaults.competitiveLosses,
    competitiveTotal: Number(progress?.competitiveTotal) || defaults.competitiveTotal,
    ratingDeltaTotal: Number(progress?.ratingDeltaTotal) || defaults.ratingDeltaTotal,
    lastMatchAt: progress?.lastMatchAt ?? defaults.lastMatchAt,
  }
}

function getPlayerProgressKey(user) {
  return getUserStorageKey(user, PLAYER_PROGRESS_NAMESPACE)
}

function getUserDisplayName(user) {
  return user?.user_metadata?.username || user?.email?.split("@")[0] || "Player"
}

function isLeaderboardEligibleUser(user) {
  return Boolean(user?.id)
}
