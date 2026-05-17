import {
  SIDES,
  applyMove,
  countKings,
  countPieces,
  getGameStatus,
  getLegalMoves,
  getLegalMovesForPiece,
  getOpponent,
} from "./checkersLogic"

const AI_SETTINGS = {
  easy: {
    depth: 1,
    randomMoveChance: 0.42,
    mistakeChance: 0.38,
    topMovePool: 5,
    noise: 95,
    delay: [850, 1350],
    weights: {
      piece: 75,
      king: 45,
      mobility: 2,
      position: 0.55,
      advancement: 1.2,
      safety: 4,
      capturePotential: 8,
      vulnerability: 14,
      immediateCapture: 24,
      multiJump: 12,
      promotion: 24,
      danger: 38,
    },
  },
  medium: {
    depth: 2,
    randomMoveChance: 0.08,
    mistakeChance: 0.16,
    topMovePool: 3,
    noise: 34,
    delay: [560, 900],
    weights: {
      piece: 110,
      king: 85,
      mobility: 7,
      position: 1,
      advancement: 2.8,
      safety: 13,
      capturePotential: 18,
      vulnerability: 26,
      immediateCapture: 62,
      multiJump: 34,
      promotion: 54,
      danger: 76,
    },
  },
  hard: {
    depth: 4,
    randomMoveChance: 0.01,
    mistakeChance: 0.025,
    topMovePool: 2,
    noise: 7,
    delay: [680, 1120],
    weights: {
      piece: 128,
      king: 125,
      mobility: 10,
      position: 1.35,
      advancement: 4,
      safety: 24,
      capturePotential: 30,
      vulnerability: 42,
      immediateCapture: 88,
      multiJump: 58,
      promotion: 82,
      danger: 118,
    },
  },
}

const CENTER = 3.5

export function getAiThinkDelay(difficulty = "medium") {
  const [minDelay, maxDelay] = getSettings(difficulty).delay
  return Math.round(minDelay + Math.random() * (maxDelay - minDelay))
}

export function chooseAiMove(board, side, difficulty = "medium", ruleSet = "classic", mandatoryCapture = true) {
  const legalMoves = getLegalMoves(board, side, ruleSet, mandatoryCapture)

  if (legalMoves.length === 0) {
    return null
  }

  const settings = getSettings(difficulty)

  if (Math.random() < settings.randomMoveChance) {
    return chooseHumanLikeRandomMove(legalMoves, settings)
  }

  const scoredMoves = scoreMoves(legalMoves, board, side, ruleSet, mandatoryCapture, settings, settings.noise)

  if (Math.random() < settings.mistakeChance) {
    return chooseMistake(scoredMoves, difficulty, settings)
  }

  return scoredMoves[0].move
}

export function chooseHintMove(
  board,
  side,
  difficulty = "medium",
  ruleSet = "classic",
  mandatoryCapture = true,
  candidateMoves = null,
) {
  const legalMoves = candidateMoves ?? getLegalMoves(board, side, ruleSet, mandatoryCapture)

  if (legalMoves.length === 0) {
    return null
  }

  const captureMoves = legalMoves.filter((move) => move.isCapture)

  if (difficulty === "easy") {
    return [...(captureMoves.length > 0 ? captureMoves : legalMoves)].sort(
      (a, b) => basicHintScore(b, side) - basicHintScore(a, side),
    )[0]
  }

  const settings = difficulty === "hard" ? AI_SETTINGS.hard : AI_SETTINGS.medium
  const scoredMoves = scoreMoves(
    captureMoves.length > 0 ? captureMoves : legalMoves,
    board,
    side,
    ruleSet,
    mandatoryCapture,
    settings,
    0,
  )

  return scoredMoves[0].move
}

function scoreMoves(moves, board, side, ruleSet, mandatoryCapture, settings, noise) {
  return moves
    .map((move) => {
      const nextBoard = applyMove(board, move)
      const nextTurn = getNextTurnAfterMove(nextBoard, side, move, ruleSet)
      const searchScore = minimax(
        nextBoard,
        nextTurn,
        side,
        settings.depth - 1,
        -Infinity,
        Infinity,
        ruleSet,
        mandatoryCapture,
        settings,
      )
      const score =
        searchScore +
        immediateMoveScore(board, nextBoard, move, side, ruleSet, settings) +
        randomNoise(noise)

      return { move, score }
    })
    .sort((a, b) => b.score - a.score)
}

function basicHintScore(move, side) {
  const advancement = side === SIDES.RED ? 7 - move.to.row : move.to.row

  return move.captures.length * 100 + (move.becomesKing ? 55 : 0) + advancement * 3
}

function minimax(board, turn, aiSide, depth, alpha, beta, ruleSet, mandatoryCapture, settings) {
  const status = getGameStatus(board, turn, ruleSet, mandatoryCapture)

  if (status.winner) {
    return status.winner === aiSide ? 100000 + depth * 100 : -100000 - depth * 100
  }

  if (depth <= 0) {
    return evaluateBoard(board, aiSide, ruleSet, mandatoryCapture, settings)
  }

  const moves = orderMoves(getLegalMoves(board, turn, ruleSet, mandatoryCapture), board, turn, ruleSet, settings)

  if (turn === aiSide) {
    let bestScore = -Infinity

    for (const move of moves) {
      const nextBoard = applyMove(board, move)
      const nextTurn = getNextTurnAfterMove(nextBoard, turn, move, ruleSet)
      const score = minimax(
        nextBoard,
        nextTurn,
        aiSide,
        depth - 1,
        alpha,
        beta,
        ruleSet,
        mandatoryCapture,
        settings,
      )
      bestScore = Math.max(bestScore, score)
      alpha = Math.max(alpha, score)

      if (beta <= alpha) {
        break
      }
    }

    return bestScore
  }

  let bestScore = Infinity

  for (const move of moves) {
    const nextBoard = applyMove(board, move)
    const nextTurn = getNextTurnAfterMove(nextBoard, turn, move, ruleSet)
    const score = minimax(
      nextBoard,
      nextTurn,
      aiSide,
      depth - 1,
      alpha,
      beta,
      ruleSet,
      mandatoryCapture,
      settings,
    )
    bestScore = Math.min(bestScore, score)
    beta = Math.min(beta, score)

    if (beta <= alpha) {
      break
    }
  }

  return bestScore
}

function evaluateBoard(board, aiSide, ruleSet, mandatoryCapture, settings) {
  const opponent = getOpponent(aiSide)
  const weights = settings.weights
  const aiPieces = countPieces(board, aiSide)
  const opponentPieces = countPieces(board, opponent)
  const aiKings = countKings(board, aiSide)
  const opponentKings = countKings(board, opponent)
  const aiMobility = getLegalMoves(board, aiSide, ruleSet, mandatoryCapture).length
  const opponentMobility = getLegalMoves(board, opponent, ruleSet, mandatoryCapture).length

  return (
    (aiPieces - opponentPieces) * weights.piece +
    (aiKings - opponentKings) * weights.king +
    (aiMobility - opponentMobility) * weights.mobility +
    (sideStructureScore(board, aiSide, weights) - sideStructureScore(board, opponent, weights)) +
    (capturePotential(board, aiSide, ruleSet) - capturePotential(board, opponent, ruleSet)) *
      weights.capturePotential -
    (vulnerabilityScore(board, aiSide, ruleSet) - vulnerabilityScore(board, opponent, ruleSet)) *
      weights.vulnerability
  )
}

function sideStructureScore(board, side, weights) {
  let score = 0

  board.forEach((rowValues, row) => {
    rowValues.forEach((piece, col) => {
      if (piece?.side !== side) {
        return
      }

      const centerDistance = Math.abs(CENTER - row) + Math.abs(CENTER - col)
      const advancement = side === SIDES.RED ? 7 - row : row
      const isBackRow = (side === SIDES.RED && row === 7) || (side === SIDES.BLACK && row === 0)
      const isEdge = col === 0 || col === 7

      score += Math.max(0, 8 - centerDistance * 1.4) * weights.position
      score += piece.king ? 0 : advancement * weights.advancement
      score += isEdge ? weights.safety : 0
      score += isBackRow && !piece.king ? weights.safety * 0.65 : 0
    })
  })

  return score
}

function immediateMoveScore(board, nextBoard, move, side, ruleSet, settings) {
  const weights = settings.weights
  const followUpCaptures = move.isCapture
    ? getLegalMovesForPiece(nextBoard, side, move.to.row, move.to.col, ruleSet, true).filter(
        (nextMove) => nextMove.isCapture,
      ).length
    : 0
  const dangerPenalty = isLandingThreatened(nextBoard, move, side, ruleSet) ? weights.danger : 0
  const advancement = side === SIDES.RED ? 7 - move.to.row : move.to.row

  return (
    move.captures.length * weights.immediateCapture +
    followUpCaptures * weights.multiJump +
    (move.becomesKing ? weights.promotion : 0) +
    (move.startedAsKing ? weights.safety * 0.4 : advancement * weights.advancement) -
    dangerPenalty
  )
}

function getNextTurnAfterMove(board, side, move, ruleSet) {
  if (!move.isCapture || (ruleSet === "british" && move.becomesKing)) {
    return getOpponent(side)
  }

  const followUpCaptures = getLegalMovesForPiece(board, side, move.to.row, move.to.col, ruleSet, true).filter(
    (nextMove) => nextMove.isCapture,
  )

  return followUpCaptures.length > 0 ? side : getOpponent(side)
}

function orderMoves(moves, board, side, ruleSet, settings) {
  return [...moves].sort(
    (a, b) =>
      immediateMoveScore(board, applyMove(board, b), b, side, ruleSet, settings) -
      immediateMoveScore(board, applyMove(board, a), a, side, ruleSet, settings),
  )
}

function capturePotential(board, side, ruleSet) {
  return getLegalMoves(board, side, ruleSet, false).filter((move) => move.isCapture).length
}

function vulnerabilityScore(board, side, ruleSet) {
  const opponent = getOpponent(side)

  return getLegalMoves(board, opponent, ruleSet, false).reduce(
    (total, move) => total + move.captures.filter((capture) => board[capture.row]?.[capture.col]?.side === side).length,
    0,
  )
}

function isLandingThreatened(board, move, side, ruleSet) {
  const opponent = getOpponent(side)

  return getLegalMoves(board, opponent, ruleSet, false).some((opponentMove) =>
    opponentMove.captures.some((capture) => capture.row === move.to.row && capture.col === move.to.col),
  )
}

function chooseHumanLikeRandomMove(moves, settings) {
  if (Math.random() < 0.55) {
    return chooseRandomMove(moves)
  }

  const captures = moves.filter((move) => move.isCapture)
  const quietMoves = moves.filter((move) => !move.isCapture)
  const pool = quietMoves.length > 0 && Math.random() < 0.65 ? quietMoves : captures.length > 0 ? captures : moves
  const limitedPool = pool.slice(0, Math.max(settings.topMovePool, pool.length))

  return chooseRandomMove(limitedPool)
}

function chooseMistake(scoredMoves, difficulty, settings) {
  if (scoredMoves.length === 1) {
    return scoredMoves[0].move
  }

  if (difficulty === "easy") {
    const start = Math.floor(scoredMoves.length * 0.35)
    return chooseRandomMove(scoredMoves.slice(start).map((item) => item.move))
  }

  if (difficulty === "medium") {
    return chooseRandomMove(scoredMoves.slice(1, Math.min(scoredMoves.length, settings.topMovePool + 2)).map((item) => item.move))
  }

  return scoredMoves[Math.min(1, scoredMoves.length - 1)].move
}

function randomNoise(amount) {
  return (Math.random() - 0.5) * amount
}

function getSettings(difficulty) {
  return AI_SETTINGS[difficulty] ?? AI_SETTINGS.medium
}

function chooseRandomMove(moves) {
  return moves[Math.floor(Math.random() * moves.length)]
}
