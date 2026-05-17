import { getUserStorageKey } from "./userStorage.js"

const RECORDS_NAMESPACE = "game-records"

export function loadGameRecords(user) {
  try {
    if (!user) {
      return []
    }

    const saved = localStorage.getItem(getGameRecordsKey(user))
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

export function addGameRecord(user, record) {
  if (!user) {
    return []
  }

  const records = loadGameRecords(user)
  const nextRecords = [record, ...records].slice(0, 30)
  localStorage.setItem(getGameRecordsKey(user), JSON.stringify(nextRecords))
  return nextRecords
}

export function clearGameRecords(user) {
  if (!user) {
    return
  }

  localStorage.removeItem(getGameRecordsKey(user))
}

export function getPlayerStats(records) {
  const wins = records.filter((record) => record.result === "win").length
  const losses = records.filter((record) => record.result === "loss").length
  const draws = records.filter((record) => record.result === "draw").length
  const total = records.length
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0

  return {
    wins,
    losses,
    draws,
    total,
    winRate,
    rating: 0,
  }
}

function getGameRecordsKey(user) {
  return getUserStorageKey(user, RECORDS_NAMESPACE)
}
