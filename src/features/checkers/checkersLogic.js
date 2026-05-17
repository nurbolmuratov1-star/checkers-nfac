export const SIDES = {
  RED: "red",
  BLACK: "black",
}

export const SIDE_LABELS = {
  [SIDES.RED]: "White",
  [SIDES.BLACK]: "Black",
}

const BOARD_SIZE = 8
const DIAGONALS = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
]

const FORWARD_DIRECTIONS = {
  [SIDES.RED]: [
    [-1, -1],
    [-1, 1],
  ],
  [SIDES.BLACK]: [
    [1, -1],
    [1, 1],
  ],
}

const RULE_SETS = {
  CLASSIC: "classic",
  BRITISH: "british",
}

export function createInitialBoard() {
  return Array.from({ length: BOARD_SIZE }, (_, row) =>
    Array.from({ length: BOARD_SIZE }, (_, col) => {
      if (!isDarkSquare(row, col)) {
        return null
      }

      if (row < 3) {
        return createPiece(SIDES.BLACK, row, col)
      }

      if (row > 4) {
        return createPiece(SIDES.RED, row, col)
      }

      return null
    }),
  )
}

function createPiece(side, row, col) {
  return {
    id: `${side}-${row}-${col}`,
    side,
    king: false,
  }
}

export function isDarkSquare(row, col) {
  return (row + col) % 2 === 1
}

export function getOpponent(side) {
  return side === SIDES.RED ? SIDES.BLACK : SIDES.RED
}

export function cloneBoard(board) {
  return board.map((row) => row.map((piece) => (piece ? { ...piece } : null)))
}

function isInside(row, col) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE
}

function isPromotionRow(side, row) {
  return (side === SIDES.RED && row === 0) || (side === SIDES.BLACK && row === BOARD_SIZE - 1)
}

export function getLegalMoves(board, side, ruleSet = RULE_SETS.CLASSIC, mandatoryCapture = true) {
  const captures = []
  const quietMoves = []

  forEachPiece(board, side, (piece, row, col) => {
    captures.push(...getCaptureMovesForPiece(board, piece, row, col, ruleSet))
    quietMoves.push(...getQuietMovesForPiece(board, piece, row, col, ruleSet))
  })

  if (captures.length === 0) {
    return quietMoves
  }

  return mandatoryCapture ? captures : [...captures, ...quietMoves]
}

export function getLegalMovesForPiece(
  board,
  side,
  row,
  col,
  ruleSet = RULE_SETS.CLASSIC,
  mandatoryCapture = true,
) {
  const piece = board[row]?.[col]

  if (!piece || piece.side !== side) {
    return []
  }

  const allMoves = getLegalMoves(board, side, ruleSet, mandatoryCapture)
  return allMoves.filter((move) => move.from.row === row && move.from.col === col)
}

function forEachPiece(board, side, callback) {
  board.forEach((rowValues, row) => {
    rowValues.forEach((piece, col) => {
      if (piece?.side === side) {
        callback(piece, row, col)
      }
    })
  })
}

function getQuietMovesForPiece(board, piece, row, col, ruleSet) {
  if (piece.king) {
    return ruleSet === RULE_SETS.BRITISH
      ? getBritishKingQuietMoves(board, piece, row, col)
      : getFlyingKingQuietMoves(board, piece, row, col)
  }

  return FORWARD_DIRECTIONS[piece.side]
    .map(([rowDelta, colDelta]) => ({
      row: row + rowDelta,
      col: col + colDelta,
    }))
    .filter((target) => isInside(target.row, target.col) && !board[target.row][target.col])
    .map((target) => createMove(piece, { row, col }, [target], [], piece.king))
}

function getBritishKingQuietMoves(board, piece, row, col) {
  return DIAGONALS.map(([rowDelta, colDelta]) => ({
    row: row + rowDelta,
    col: col + colDelta,
  }))
    .filter((target) => isInside(target.row, target.col) && !board[target.row][target.col])
    .map((target) => createMove(piece, { row, col }, [target], [], piece.king))
}

function getFlyingKingQuietMoves(board, piece, row, col) {
  const moves = []

  DIAGONALS.forEach(([rowDelta, colDelta]) => {
    let nextRow = row + rowDelta
    let nextCol = col + colDelta

    while (isInside(nextRow, nextCol) && !board[nextRow][nextCol]) {
      moves.push(createMove(piece, { row, col }, [{ row: nextRow, col: nextCol }], [], piece.king))
      nextRow += rowDelta
      nextCol += colDelta
    }
  })

  return moves
}

function getCaptureMovesForPiece(board, piece, row, col, ruleSet) {
  const captureOptions = piece.king
    ? getKingCaptureOptions(board, piece, row, col, ruleSet)
    : getManCaptureOptions(board, piece, row, col)

  return captureOptions.map((option) =>
    createMove(piece, { row, col }, [option.landing], [option.capture], piece.king),
  )
}

function getManCaptureOptions(board, piece, row, col) {
  const opponent = getOpponent(piece.side)

  return DIAGONALS.flatMap(([rowDelta, colDelta]) => {
    const enemyRow = row + rowDelta
    const enemyCol = col + colDelta
    const landingRow = row + rowDelta * 2
    const landingCol = col + colDelta * 2
    const enemyPiece = board[enemyRow]?.[enemyCol]

    if (
      isInside(landingRow, landingCol) &&
      enemyPiece?.side === opponent &&
      !board[landingRow][landingCol]
    ) {
      return [
        {
          capture: { row: enemyRow, col: enemyCol },
          landing: { row: landingRow, col: landingCol },
        },
      ]
    }

    return []
  })
}

function getKingCaptureOptions(board, piece, row, col, ruleSet) {
  if (ruleSet === RULE_SETS.BRITISH) {
    return getBritishKingCaptureOptions(board, piece, row, col)
  }

  return getFlyingKingCaptureOptions(board, piece, row, col)
}

function getBritishKingCaptureOptions(board, piece, row, col) {
  const opponent = getOpponent(piece.side)

  return DIAGONALS.flatMap(([rowDelta, colDelta]) => {
    const enemyRow = row + rowDelta
    const enemyCol = col + colDelta
    const landingRow = row + rowDelta * 2
    const landingCol = col + colDelta * 2
    const enemyPiece = board[enemyRow]?.[enemyCol]

    if (
      isInside(landingRow, landingCol) &&
      enemyPiece?.side === opponent &&
      !board[landingRow][landingCol]
    ) {
      return [
        {
          capture: { row: enemyRow, col: enemyCol },
          landing: { row: landingRow, col: landingCol },
        },
      ]
    }

    return []
  })
}

function getFlyingKingCaptureOptions(board, piece, row, col) {
  const opponent = getOpponent(piece.side)
  const options = []

  DIAGONALS.forEach(([rowDelta, colDelta]) => {
    let scanRow = row + rowDelta
    let scanCol = col + colDelta
    let capturedPiece = null

    while (isInside(scanRow, scanCol)) {
      const scannedPiece = board[scanRow][scanCol]

      if (!capturedPiece && !scannedPiece) {
        scanRow += rowDelta
        scanCol += colDelta
        continue
      }

      if (!capturedPiece && scannedPiece?.side === piece.side) {
        break
      }

      if (!capturedPiece && scannedPiece?.side === opponent) {
        capturedPiece = { row: scanRow, col: scanCol }
        scanRow += rowDelta
        scanCol += colDelta
        continue
      }

      if (capturedPiece && !scannedPiece) {
        options.push({
          capture: capturedPiece,
          landing: { row: scanRow, col: scanCol },
        })
        scanRow += rowDelta
        scanCol += colDelta
        continue
      }

      break
    }
  })

  return options
}

function createMove(piece, origin, path, captures, startedAsKing = piece.king) {
  const to = path[path.length - 1]

  return {
    id: `${piece.id}:${origin.row},${origin.col}->${path
      .map((step) => `${step.row},${step.col}`)
      .join("|")}:${captures.map((capture) => `${capture.row},${capture.col}`).join("|")}`,
    pieceId: piece.id,
    side: piece.side,
    from: origin,
    to,
    path,
    captures,
    isCapture: captures.length > 0,
    startedAsKing,
    becomesKing: !startedAsKing && isPromotionRow(piece.side, to.row),
  }
}

export function applyMove(board, move) {
  const nextBoard = cloneBoard(board)
  const piece = nextBoard[move.from.row][move.from.col]

  if (!piece) {
    return board
  }

  nextBoard[move.from.row][move.from.col] = null
  move.captures.forEach((capture) => {
    nextBoard[capture.row][capture.col] = null
  })

  nextBoard[move.to.row][move.to.col] = {
    ...piece,
    king: piece.king || isPromotionRow(piece.side, move.to.row),
  }

  return nextBoard
}

export function getGameStatus(board, currentTurn, ruleSet = RULE_SETS.CLASSIC, mandatoryCapture = true) {
  const redCount = countPieces(board, SIDES.RED)
  const blackCount = countPieces(board, SIDES.BLACK)

  if (redCount === 0) {
    return { winner: SIDES.BLACK, reason: `${SIDE_LABELS[SIDES.RED]} has no pieces left` }
  }

  if (blackCount === 0) {
    return { winner: SIDES.RED, reason: `${SIDE_LABELS[SIDES.BLACK]} has no pieces left` }
  }

  const currentMoves = getLegalMoves(board, currentTurn, ruleSet, mandatoryCapture)

  if (currentMoves.length === 0) {
    return {
      winner: getOpponent(currentTurn),
      reason: `${SIDE_LABELS[currentTurn]} has no legal moves`,
    }
  }

  return { winner: null, reason: "" }
}

export function countPieces(board, side) {
  return board.flat().filter((piece) => piece?.side === side).length
}

export function countKings(board, side) {
  return board.flat().filter((piece) => piece?.side === side && piece.king).length
}

export function squareName(row, col) {
  const file = String.fromCharCode(97 + col)
  return `${file}${BOARD_SIZE - row}`
}

export function describeMove(move) {
  const route = [move.from, ...move.path].map((square) => squareName(square.row, square.col)).join(" -> ")
  const crown = move.becomesKing ? " crown" : ""
  const capture = move.captures.length > 0 ? ` x${move.captures.length}` : ""

  return `${SIDE_LABELS[move.side]} ${route}${capture}${crown}`
}
