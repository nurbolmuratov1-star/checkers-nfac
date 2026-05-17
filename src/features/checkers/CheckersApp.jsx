import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { getUserStorageKey } from "../../lib/userStorage.js"
import { chooseAiMove, chooseHintMove, getAiThinkDelay } from "./aiPlayer"
import {
  SIDE_LABELS,
  SIDES,
  applyMove,
  countKings,
  countPieces,
  createInitialBoard,
  describeMove,
  getGameStatus,
  getLegalMoves,
  getLegalMovesForPiece,
  getOpponent,
  isDarkSquare,
  squareName,
} from "./checkersLogic"
import "./checkers.css"

const ACTIVE_GAME_NAMESPACE = "active-game"
const HINTS_PER_MATCH = 3

const difficultyOptions = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
]

function normalizeDifficulty(value) {
  return difficultyOptions.some((option) => option.value === value) ? value : "medium"
}

function createFreshGame() {
  return {
    board: createInitialBoard(),
    turn: SIDES.RED,
    history: [],
    lastMove: null,
    startedAt: Date.now(),
  }
}

function loadSavedGame(user) {
  try {
    if (!user) {
      return null
    }

    const saved = localStorage.getItem(getActiveGameStorageKey(user))
    const parsedGame = saved ? JSON.parse(saved) : null
    return parsedGame ? { ...parsedGame, startedAt: parsedGame.startedAt ?? Date.now() } : null
  } catch {
    return null
  }
}

export function CheckersApp({
  user,
  initialConfig = {},
  restoreSavedGame = false,
  cosmeticStyle = {},
  onActiveGameStatusChange,
  onBackToSettings,
  onGameComplete,
}) {
  const completionSent = useRef(false)
  const hintTimer = useRef(null)
  const hintCooldownTimer = useRef(null)
  const [initialGame] = useState(() => {
    const savedGame = restoreSavedGame ? loadSavedGame(user) : null
    return savedGame ? { ...savedGame, wasRestored: true } : createFreshGame()
  })
  const initialSettings = initialGame.wasRestored ? initialGame : { ...initialGame, ...initialConfig }
  const [board, setBoard] = useState(initialGame.board)
  const [turn, setTurn] = useState(initialGame.turn)
  const [history, setHistory] = useState(initialGame.history)
  const [lastMove, setLastMove] = useState(initialGame.lastMove)
  const [matchStartedAt, setMatchStartedAt] = useState(initialGame.startedAt)
  const [selectedSquare, setSelectedSquare] = useState(initialGame.selectedSquare ?? null)
  const [forcedCaptureSquare, setForcedCaptureSquare] = useState(initialGame.forcedCaptureSquare ?? null)
  const [gameMode, setGameMode] = useState(initialSettings.gameMode ?? "ai")
  const [difficulty, setDifficulty] = useState(
    normalizeDifficulty(initialSettings.difficulty),
  )
  const [playerSide, setPlayerSide] = useState(initialSettings.playerSide ?? SIDES.RED)
  const [ruleSet, setRuleSet] = useState(initialSettings.ruleSet ?? "classic")
  const [mandatoryCapture, setMandatoryCapture] = useState(
    initialSettings.mandatoryCapture ?? true,
  )
  const [showHints, setShowHints] = useState(initialGame.showHints ?? true)
  const [kingToast, setKingToast] = useState(null)
  const [showRestartConfirm, setShowRestartConfirm] = useState(false)
  const [hintMove, setHintMove] = useState(null)
  const [hintCooldown, setHintCooldown] = useState(false)
  const [hintsRemaining, setHintsRemaining] = useState(initialGame.hintsRemaining ?? HINTS_PER_MATCH)

  const legalMoves = useMemo(
    () => getLegalMoves(board, turn, ruleSet, mandatoryCapture),
    [board, mandatoryCapture, ruleSet, turn],
  )
  const gameStatus = useMemo(
    () => getGameStatus(board, turn, ruleSet, mandatoryCapture),
    [board, mandatoryCapture, ruleSet, turn],
  )
  const isAiTurn = gameMode === "ai" && turn !== playerSide && !gameStatus.winner
  const aiThinking = isAiTurn
  const selectedMoves = selectedSquare
      ? getLegalMovesForPiece(
          board,
          turn,
          selectedSquare.row,
          selectedSquare.col,
          ruleSet,
          forcedCaptureSquare ? true : mandatoryCapture,
        ).filter((move) => (forcedCaptureSquare ? move.isCapture : true))
    : []

  useEffect(() => {
    onActiveGameStatusChange?.(!gameStatus.winner)
  }, [gameStatus.winner, onActiveGameStatusChange])

  useEffect(() => {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0 })
    })

    return () => {
      window.clearTimeout(hintTimer.current)
      window.clearTimeout(hintCooldownTimer.current)
    }
  }, [])

  useEffect(() => {
    const payload = {
      board,
      turn,
      history,
      lastMove,
      selectedSquare,
      forcedCaptureSquare,
      startedAt: matchStartedAt,
      gameMode,
      difficulty,
      playerSide,
      ruleSet,
      mandatoryCapture,
      showHints,
      hintsRemaining,
    }

    if (user) {
      localStorage.setItem(getActiveGameStorageKey(user), JSON.stringify(payload))
    }
  }, [
    board,
    difficulty,
    gameMode,
    history,
    forcedCaptureSquare,
    hintsRemaining,
    lastMove,
    mandatoryCapture,
    matchStartedAt,
    playerSide,
    ruleSet,
    selectedSquare,
    showHints,
    turn,
    user,
  ])

  useEffect(() => {
    if (!gameStatus.winner || completionSent.current) {
      return
    }

    completionSent.current = true
    onGameComplete?.({
      id: crypto.randomUUID(),
      opponentType: gameMode === "ai" ? "AI" : "Local player",
      difficulty,
      result:
        gameMode === "ai" ? (gameStatus.winner === playerSide ? "win" : "loss") : "draw",
      winner: gameStatus.winner,
      moveCount: history.length,
      moves: history.map((entry) => entry.label),
      kingMoveCount: history.filter((entry) => entry.move.startedAsKing).length,
      durationMs: Date.now() - matchStartedAt,
      createdAt: new Date().toISOString(),
    })
  }, [difficulty, gameMode, gameStatus.winner, history, matchStartedAt, onGameComplete, playerSide])

  const playMove = useCallback(
    (move, actor = "human") => {
      window.clearTimeout(hintTimer.current)
      setHintMove(null)

      const nextBoard = applyMove(board, move)
      const followUpCaptures = move.isCapture
        ? getLegalMovesForPiece(nextBoard, turn, move.to.row, move.to.col, ruleSet, true).filter(
            (nextMove) => nextMove.isCapture,
          )
        : []
      const mustContinueCapture = followUpCaptures.length > 0 && !(ruleSet === "british" && move.becomesKing)

      setBoard(nextBoard)
      setTurn(mustContinueCapture ? turn : getOpponent(turn))
      setSelectedSquare(mustContinueCapture ? move.to : null)
      setForcedCaptureSquare(mustContinueCapture ? move.to : null)
      setLastMove(move)
      setHistory((currentHistory) => [
        ...currentHistory,
        {
          id: `${Date.now()}-${move.id}`,
          actor,
          move,
          boardBefore: board,
          turnBefore: turn,
          label: describeMove(move),
        },
      ])

      if (move.becomesKing) {
        setKingToast({
          id: `${Date.now()}-${move.id}`,
          message: `${SIDE_LABELS[move.side]} crowned a king`,
        })
      }
    },
    [board, ruleSet, turn],
  )

  useEffect(() => {
    if (!isAiTurn) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      const aiMove = chooseAiMove(board, turn, difficulty, ruleSet, mandatoryCapture)

      if (aiMove) {
        playMove(aiMove, "ai")
      }
    }, getAiThinkDelay(difficulty))

    return () => window.clearTimeout(timer)
  }, [board, difficulty, isAiTurn, mandatoryCapture, playMove, ruleSet, turn])

  useEffect(() => {
    if (!kingToast) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      setKingToast(null)
    }, 1200)

    return () => window.clearTimeout(timer)
  }, [kingToast])

  useEffect(() => {
    if (!showRestartConfirm) {
      return undefined
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setShowRestartConfirm(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [showRestartConfirm])

  function resetGame(nextSettings = {}) {
    const nextGame = createFreshGame()

    completionSent.current = false
    window.clearTimeout(hintTimer.current)
    setHintMove(null)
    setBoard(nextGame.board)
    setTurn(nextGame.turn)
    setHistory(nextGame.history)
    setLastMove(nextGame.lastMove)
    setMatchStartedAt(nextGame.startedAt)
    setSelectedSquare(null)
    setForcedCaptureSquare(null)
    setHintsRemaining(HINTS_PER_MATCH)

    if (nextSettings.gameMode) {
      setGameMode(nextSettings.gameMode)
    }

    if (nextSettings.difficulty) {
      setDifficulty(nextSettings.difficulty)
    }

    if (nextSettings.playerSide) {
      setPlayerSide(nextSettings.playerSide)
    }

    if (nextSettings.ruleSet) {
      setRuleSet(nextSettings.ruleSet)
    }

    if (typeof nextSettings.mandatoryCapture === "boolean") {
      setMandatoryCapture(nextSettings.mandatoryCapture)
    }
  }

  function handleSquareClick(row, col) {
    window.clearTimeout(hintTimer.current)
    setHintMove(null)

    if (gameStatus.winner || isAiTurn || aiThinking || !isDarkSquare(row, col)) {
      return
    }

    const piece = board[row][col]
    const clickedMove = selectedMoves.find((move) => move.to.row === row && move.to.col === col)

    if (clickedMove) {
      playMove(clickedMove)
      return
    }

    if (forcedCaptureSquare) {
      const isForcedPiece = forcedCaptureSquare.row === row && forcedCaptureSquare.col === col

      if (isForcedPiece) {
        setSelectedSquare(forcedCaptureSquare)
      }

      return
    }

    if (piece?.side === turn) {
      const pieceMoves = getLegalMovesForPiece(board, turn, row, col, ruleSet, mandatoryCapture)
      setSelectedSquare(pieceMoves.length > 0 ? { row, col } : null)
      return
    }

    setSelectedSquare(null)
  }

  function handleHintRequest() {
    if (gameStatus.winner || isAiTurn || aiThinking || hintCooldown || hintsRemaining <= 0) {
      return
    }

    const candidateMoves = forcedCaptureSquare
      ? getLegalMovesForPiece(board, turn, forcedCaptureSquare.row, forcedCaptureSquare.col, ruleSet, true).filter(
          (move) => move.isCapture,
        )
      : null
    const recommendedMove = chooseHintMove(
      board,
      turn,
      difficulty,
      ruleSet,
      forcedCaptureSquare ? true : mandatoryCapture,
      candidateMoves,
    )

    if (!recommendedMove) {
      return
    }

    window.clearTimeout(hintTimer.current)
    window.clearTimeout(hintCooldownTimer.current)
    setHintMove(recommendedMove)
    setHintsRemaining((currentHints) => Math.max(0, currentHints - 1))
    setHintCooldown(true)

    hintTimer.current = window.setTimeout(() => {
      setHintMove(null)
    }, 5200)

    hintCooldownTimer.current = window.setTimeout(() => {
      setHintCooldown(false)
    }, 1800)
  }

  const redPieces = countPieces(board, SIDES.RED)
  const blackPieces = countPieces(board, SIDES.BLACK)
  const redKings = countKings(board, SIDES.RED)
  const blackKings = countKings(board, SIDES.BLACK)
  const movableSquares = useMemo(
    () => new Set(legalMoves.map((move) => `${move.from.row}-${move.from.col}`)),
    [legalMoves],
  )

  return (
    <section className="gameShell" style={cosmeticStyle}>
      {kingToast && (
        <div className="kingToast" role="status" key={kingToast.id}>
          <span>♛</span>
          <strong>{kingToast.message}</strong>
        </div>
      )}

      {gameStatus.winner && (
        <div className="gameOverOverlay" role="dialog" aria-modal="true" aria-labelledby="game-over-title">
          <section className="gameOverCard">
            <p className="eyebrow">Game over</p>
            <h2 id="game-over-title">{SIDE_LABELS[gameStatus.winner]} wins</h2>
            <p>{gameStatus.reason}</p>
            <div className="gameOverActions">
              <button className="restartButton" onClick={() => resetGame()}>
                Restart game
              </button>
            </div>
          </section>
        </div>
      )}

      {showRestartConfirm && !gameStatus.winner && (
        <div
          className="gameOverOverlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="restart-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowRestartConfirm(false)
            }
          }}
        >
          <section className="gameOverCard restartConfirmCard">
            <button
              type="button"
              className="modalCloseButton"
              onClick={() => setShowRestartConfirm(false)}
              aria-label="Close restart confirmation"
              autoFocus
            >
              ×
            </button>
            <p className="eyebrow">Restart game</p>
            <h2 id="restart-title">Are you sure?</h2>
            <p>You can change match settings or continue with the current setup.</p>
            <div className="gameOverActions">
              <button className="backHomeButton" onClick={onBackToSettings}>
                Change settings
              </button>
              <button
                className="restartButton"
                onClick={() => {
                  setShowRestartConfirm(false)
                  resetGame()
                }}
              >
                Continue current
              </button>
            </div>
          </section>
        </div>
      )}

      <section className="gameLayout">
        <section className="boardStage" aria-label="Checkers board">
          <div className="boardWrap">
            <div className="board" role="grid" aria-label="Playable checkers board">
              {hintMove && <HintPath move={hintMove} />}
              {board.map((rowValues, row) =>
                rowValues.map((piece, col) => {
                  const squareMove = selectedMoves.find((move) => move.to.row === row && move.to.col === col)
                  const isSelected = selectedSquare?.row === row && selectedSquare?.col === col
                  const isLastFrom = lastMove?.from.row === row && lastMove?.from.col === col
                  const isLastTo = lastMove?.to.row === row && lastMove?.to.col === col
                  const isHintFrom = hintMove?.from.row === row && hintMove?.from.col === col
                  const isHintTo = hintMove?.to.row === row && hintMove?.to.col === col
                  const isCaptured = lastMove?.captures.some(
                    (capture) => capture.row === row && capture.col === col,
                  )
                  const canMovePiece =
                    showHints &&
                    !gameStatus.winner &&
                    !isAiTurn &&
                    !selectedSquare &&
                    piece?.side === turn &&
                    (forcedCaptureSquare
                      ? forcedCaptureSquare.row === row && forcedCaptureSquare.col === col
                      : movableSquares.has(`${row}-${col}`))

                  return (
                    <button
                      key={`${row}-${col}`}
                      className={[
                        "square",
                        isDarkSquare(row, col) ? "darkSquare" : "lightSquare",
                        isSelected ? "selected" : "",
                        squareMove && showHints ? "moveTarget" : "",
                        squareMove?.isCapture && showHints ? "captureTarget" : "",
                        isLastFrom || isLastTo ? "lastMove" : "",
                        isHintFrom ? "hintSourceSquare" : "",
                        isHintTo ? "hintTargetSquare" : "",
                        isCaptured ? "capturedSquare" : "",
                        canMovePiece ? "movablePieceSquare" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => handleSquareClick(row, col)}
                      role="gridcell"
                      aria-label={squareName(row, col)}
                    >
                      {piece && <Piece piece={piece} />}
                    </button>
                  )
                }),
              )}
            </div>
          </div>

          <div className="matchHud" aria-label="Current match state">
            <div className="turnPanel">
              <span className={`turnStone ${turn}`} />
              <div>
                <p className="eyebrow">Turn</p>
                <h2>{gameStatus.winner ? `${SIDE_LABELS[gameStatus.winner]} wins` : aiThinking ? "AI thinking" : SIDE_LABELS[turn]}</h2>
              </div>
            </div>

            <div className="scoreStrip">
              <ScoreBadge side={SIDES.RED} pieces={redPieces} kings={redKings} />
              <ScoreBadge side={SIDES.BLACK} pieces={blackPieces} kings={blackKings} />
            </div>

            <label className="toggleRow">
              <input
                type="checkbox"
                checked={showHints}
                onChange={(event) => setShowHints(event.target.checked)}
              />
              <span>Hints</span>
            </label>

            <button
              type="button"
              className={hintMove ? "hintButton active" : "hintButton"}
              onClick={handleHintRequest}
              disabled={gameStatus.winner || isAiTurn || aiThinking || hintCooldown || hintsRemaining <= 0}
              title={hintsRemaining > 0 ? "Get a recommended move" : "No hints left"}
              aria-label="Get a recommended move"
            >
              <LightbulbIcon />
              <span>{hintCooldown ? "Cooldown" : "Hint"}</span>
              <span className="hintCounter" aria-label={`${hintsRemaining} hints left`}>
                {hintsRemaining}/{HINTS_PER_MATCH}
              </span>
            </button>

            <button className="restartButton" onClick={() => setShowRestartConfirm(true)}>
              Restart game
            </button>
          </div>
        </section>
      </section>
    </section>
  )
}

function getActiveGameStorageKey(user) {
  return getUserStorageKey(user, ACTIVE_GAME_NAMESPACE)
}

function HintPath({ move }) {
  const fromX = move.from.col + 0.5
  const fromY = move.from.row + 0.5
  const toX = move.to.col + 0.5
  const toY = move.to.row + 0.5

  return (
    <svg className="hintPathOverlay" viewBox="0 0 8 8" aria-hidden="true">
      <defs>
        <marker
          id="hintArrowHead"
          markerWidth="0.7"
          markerHeight="0.7"
          refX="0.55"
          refY="0.35"
          orient="auto"
        >
          <path d="M0 0 L0.7 0.35 L0 0.7 Z" />
        </marker>
      </defs>
      <line className="hintPathGlow" x1={fromX} y1={fromY} x2={toX} y2={toY} />
      <line
        className="hintPathLine"
        x1={fromX}
        y1={fromY}
        x2={toX}
        y2={toY}
        markerEnd="url(#hintArrowHead)"
      />
    </svg>
  )
}

function LightbulbIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 18h6M10 22h4M8.4 14.7A6 6 0 1115.6 14.7c-.7.5-1.1 1.3-1.1 2.1h-5c0-.8-.4-1.6-1.1-2.1z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Piece({ piece }) {
  return (
    <span className={`piece ${piece.side} ${piece.king ? "king" : ""}`}>
      <span>{piece.king ? "♛" : ""}</span>
    </span>
  )
}

function ScoreBadge({ side, pieces, kings }) {
  return (
    <div className="scoreBadge">
      <span className={`historyDot ${side}`} />
      <div>
        <strong>{SIDE_LABELS[side]}</strong>
        <small>
          {pieces} pieces, {kings} kings
        </small>
      </div>
    </div>
  )
}
