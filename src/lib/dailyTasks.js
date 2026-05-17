import { getUserStorageId, getUserStorageKey } from "./userStorage.js"

const CLAIMS_KEY_PREFIX = "damalab-daily-task-claims"
const BONUS_COINS_KEY_PREFIX = "damalab-bonus-coins"

export const DAILY_TASKS = [
  {
    id: "play-3-matches",
    title: "Play 3 matches",
    description: "Complete three matches today.",
    reward: 45,
    goal: 3,
    getProgress: ({ todayRecords }) => todayRecords.length,
  },
  {
    id: "hard-ai-win",
    title: "Win against hard AI",
    description: "Beat the computer on hard mode.",
    reward: 90,
    goal: 1,
    getProgress: ({ todayRecords }) =>
      todayRecords.some(
        (record) =>
          record.result === "win" &&
          record.opponentType === "AI" &&
          record.difficulty === "hard",
      )
        ? 1
        : 0,
  },
  {
    id: "win-2-games",
    title: "Win 2 games",
    description: "Win any two matches today.",
    reward: 70,
    goal: 2,
    getProgress: ({ todayRecords }) => todayRecords.filter((record) => record.result === "win").length,
  },
  {
    id: "king-5-moves",
    title: "Play 5 moves with kings",
    description: "Use crowned pieces across today's matches.",
    reward: 60,
    goal: 5,
    getProgress: ({ todayRecords }) =>
      todayRecords.reduce((total, record) => total + (record.kingMoveCount ?? 0), 0),
  },
  {
    id: "login-today",
    title: "Login today",
    description: "Open the arena and check in.",
    reward: 25,
    goal: 1,
    getProgress: () => 1,
  },
]

export function getTodayKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

export { getUserStorageId }

export function loadClaimedTaskIds(user, todayKey = getTodayKey()) {
  try {
    const saved = localStorage.getItem(getClaimsStorageKey(user, todayKey))
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

export function saveClaimedTaskIds(user, claimedTaskIds, todayKey = getTodayKey()) {
  localStorage.setItem(getClaimsStorageKey(user, todayKey), JSON.stringify(claimedTaskIds))
}

export function loadBonusCoins(user) {
  try {
    return Number(localStorage.getItem(getBonusCoinsStorageKey(user))) || 0
  } catch {
    return 0
  }
}

export function saveBonusCoins(user, coins) {
  localStorage.setItem(getBonusCoinsStorageKey(user), String(coins))
}

export function getDailyTaskProgress(records, claimedTaskIds, todayKey = getTodayKey()) {
  const claimedSet = new Set(claimedTaskIds)
  const todayRecords = records.filter((record) => isTodayRecord(record, todayKey))

  return DAILY_TASKS.map((task) => {
    const progress = Math.min(task.goal, task.getProgress({ records, todayRecords }))
    const isComplete = progress >= task.goal
    const isClaimed = claimedSet.has(task.id)

    return {
      ...task,
      progress,
      isComplete,
      isClaimed,
      progressLabel: `${progress}/${task.goal}`,
    }
  })
}

function getClaimsStorageKey(user, todayKey) {
  return getUserStorageKey(user, CLAIMS_KEY_PREFIX, todayKey)
}

function getBonusCoinsStorageKey(user) {
  return getUserStorageKey(user, BONUS_COINS_KEY_PREFIX)
}

function isTodayRecord(record, todayKey) {
  if (!record.createdAt) {
    return false
  }

  return getTodayKey(new Date(record.createdAt)) === todayKey
}
