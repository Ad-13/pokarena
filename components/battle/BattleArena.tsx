'use client'

import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Clock, DoorOpen, Home, RotateCcw, Shield, Shuffle, Swords, Trophy, UserRound } from 'lucide-react'
import { addBattleScore, createLeaderboardProfile, getCurrentLeaderboardEntry, type LeaderboardEntry } from '@/actions/leaderboard'
import PokemonLogo from '@/components/ui/PokemonLogo'
import type { BattleMove, BattlePokemon } from '@/lib/pokemon'

type BattleStatus = 'setup' | 'player-turn' | 'opponent-turn' | 'finished'
type BattleOutcome = 'win' | 'loss' | 'forfeit' | null
type LogKind = 'system' | 'attack' | 'damage'
type SelectMode = 'starter' | 'switch' | 'forced'

interface BattleLogEntry {
  id: string
  kind: LogKind
  text: string
}

interface Props {
  initialLeaderboard: LeaderboardEntry | null
  playerTeam: BattlePokemon[]
  opponentTeam: BattlePokemon[]
}

const TURN_LIMIT = 30
const STARTER_REVEAL_DELAY = 900
const FAINT_ANIMATION_MS = 850
const TYPE_EFFECTIVENESS: Record<string, Record<string, number>> = {
  fire: { grass: 2, ice: 2, bug: 2, steel: 2, water: 0.5, rock: 0.5, fire: 0.5, dragon: 0.5 },
  water: { fire: 2, ground: 2, rock: 2, water: 0.5, grass: 0.5, dragon: 0.5 },
  grass: { water: 2, ground: 2, rock: 2, fire: 0.5, grass: 0.5, poison: 0.5, flying: 0.5, bug: 0.5, dragon: 0.5, steel: 0.5 },
  electric: { water: 2, flying: 2, electric: 0.5, grass: 0.5, dragon: 0.5, ground: 0 },
  ice: { grass: 2, ground: 2, flying: 2, dragon: 2, fire: 0.5, water: 0.5, ice: 0.5, steel: 0.5 },
  fighting: { normal: 2, ice: 2, rock: 2, dark: 2, steel: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, fairy: 0.5, ghost: 0 },
  ground: { fire: 2, electric: 2, poison: 2, rock: 2, steel: 2, grass: 0.5, bug: 0.5, flying: 0 },
  flying: { grass: 2, fighting: 2, bug: 2, electric: 0.5, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, steel: 0.5, dark: 0 },
  bug: { grass: 2, psychic: 2, dark: 2, fire: 0.5, fighting: 0.5, poison: 0.5, flying: 0.5, ghost: 0.5, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, flying: 2, bug: 2, fighting: 0.5, ground: 0.5, steel: 0.5 },
  ghost: { psychic: 2, ghost: 2, dark: 0.5, normal: 0 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { psychic: 2, ghost: 2, fighting: 0.5, dark: 0.5, fairy: 0.5 },
  steel: { ice: 2, rock: 2, fairy: 2, fire: 0.5, water: 0.5, electric: 0.5, steel: 0.5 },
  fairy: { fighting: 2, dragon: 2, dark: 2, fire: 0.5, poison: 0.5, steel: 0.5 },
}

function cloneTeam(team: BattlePokemon[]) {
  return team.map((pokemon) => ({
    ...pokemon,
    hp: pokemon.maxHp,
    moves: pokemon.moves.map((move) => ({ ...move })),
  }))
}

function playPokemonCry(pokemon?: BattlePokemon | null) {
  if (!pokemon?.cryUrl || typeof window === 'undefined') return

  const audio = new Audio(pokemon.cryUrl)
  audio.volume = 0.42
  void audio.play().catch(() => {
    // Browsers may block audio until the user interacts with the page.
  })
}

function addLog(kind: LogKind, text: string): BattleLogEntry {
  return { id: crypto.randomUUID(), kind, text }
}

function hpPercent(pokemon?: BattlePokemon | null) {
  if (!pokemon) return 0
  return Math.max(0, Math.round((pokemon.hp / pokemon.maxHp) * 100))
}

function hpColor(percent: number) {
  if (percent > 55) return 'green'
  if (percent > 25) return 'yellow'
  return 'red'
}

function aliveCount(team: BattlePokemon[]) {
  return team.filter((pokemon) => pokemon.hp > 0).length
}

function firstAliveIndex(team: BattlePokemon[]) {
  return team.findIndex((pokemon) => pokemon.hp > 0)
}

function typeMultiplier(moveType: string, defenderTypes: string[]) {
  return defenderTypes.reduce((total, defenderType) => {
    return total * (TYPE_EFFECTIVENESS[moveType]?.[defenderType] ?? 1)
  }, 1)
}

function calculateDamage(attacker: BattlePokemon, defender: BattlePokemon, move: BattleMove) {
  const hitRoll = Math.random() * 100

  if (hitRoll > move.accuracy) {
    return { damage: 0, multiplier: 1, missed: true }
  }

  const stab = attacker.types.includes(move.type) ? 1.2 : 1
  const multiplier = typeMultiplier(move.type, defender.types)
  const randomFactor = 0.85 + Math.random() * 0.15
  const raw = (((22 * move.power * (attacker.attack / Math.max(1, defender.defense))) / 50) + 2) * stab * multiplier * randomFactor

  return {
    damage: Math.max(1, Math.round(raw)),
    multiplier,
    missed: false,
  }
}

function effectivenessText(multiplier: number) {
  if (multiplier === 0) return ' It had no effect.'
  if (multiplier >= 2) return ' It was super effective.'
  if (multiplier < 1) return ' It was not very effective.'
  return ''
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60

  return `${minutes}:${String(rest).padStart(2, '0')}`
}

function estimateDamage(attacker: BattlePokemon, defender: BattlePokemon, move: BattleMove) {
  const stab = attacker.types.includes(move.type) ? 1.2 : 1
  const multiplier = typeMultiplier(move.type, defender.types)

  return move.power * stab * multiplier * (attacker.attack / Math.max(1, defender.defense))
}

function chooseOpponentMove(attacker: BattlePokemon, defender: BattlePokemon) {
  const ranked = [...attacker.moves].sort((a, b) => estimateDamage(attacker, defender, b) - estimateDamage(attacker, defender, a))
  const bestTwo = ranked.slice(0, 2)

  return bestTwo[Math.floor(Math.random() * bestTwo.length)] ?? ranked[0]
}

function scoreForWin(playerTeam: BattlePokemon[], totalSeconds: number) {
  const aliveBonus = aliveCount(playerTeam) * 75
  const speedBonus = Math.max(0, 600 - totalSeconds)

  return 250 + aliveBonus + speedBonus
}

function BattleModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    window.setTimeout(() => setMounted(true), 0)
  }, [])

  if (!mounted) return null

  return createPortal(children, document.body)
}

export default function BattleArena({ initialLeaderboard, playerTeam, opponentTeam }: Props) {
  const router = useRouter()
  const [leaderboard, setLeaderboard] = useState(initialLeaderboard)
  const [profileState, profileAction, profilePending] = useActionState(createLeaderboardProfile, null)
  const [battlePlayerTeam, setBattlePlayerTeam] = useState(() => cloneTeam(playerTeam))
  const [battleOpponentTeam, setBattleOpponentTeam] = useState(() => cloneTeam(opponentTeam))
  const [activePlayerIndex, setActivePlayerIndex] = useState<number | null>(null)
  const [activeOpponentIndex, setActiveOpponentIndex] = useState(0)
  const [opponentRevealed, setOpponentRevealed] = useState(false)
  const [faintingSide, setFaintingSide] = useState<'player' | 'opponent' | null>(null)
  const [logs, setLogs] = useState<BattleLogEntry[]>([])
  const [status, setStatus] = useState<BattleStatus>('setup')
  const [outcome, setOutcome] = useState<BattleOutcome>(null)
  const [turnSeconds, setTurnSeconds] = useState(TURN_LIMIT)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [selectMode, setSelectMode] = useState<SelectMode | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false)
  const [leaderboardCheckPending, setLeaderboardCheckPending] = useState(false)
  const [scoreAwarded, setScoreAwarded] = useState(false)
  const [savedScore, setSavedScore] = useState<number | null>(null)
  const [trainerName, setTrainerName] = useState('')
  const [trainerNameSubmitted, setTrainerNameSubmitted] = useState(false)
  const battleFinishedRef = useRef(false)

  const activePlayer = activePlayerIndex === null ? null : battlePlayerTeam[activePlayerIndex]
  const activeOpponent = opponentRevealed ? battleOpponentTeam[activeOpponentIndex] : null
  const trainerLabel = leaderboard?.username ?? 'Trainer'
  const canAct = Boolean(status === 'player-turn' && activePlayer && activeOpponent && !outcome && !faintingSide)
  const modalOpen = !leaderboard || Boolean(selectMode) || showForfeitConfirm || (status === 'finished' && Boolean(outcome))
  const battleInProgress = status === 'player-turn' || status === 'opponent-turn' || Boolean(selectMode === 'switch' || selectMode === 'forced')
  const trainerNameChecks = [
    {
      label: '3 to 18 characters',
      valid: trainerName.trim().length >= 3 && trainerName.trim().length <= 18,
    },
    {
      label: 'Letters, numbers, _ or - only',
      valid: trainerName.length > 0 && /^[a-zA-Z0-9_-]+$/.test(trainerName),
    },
    {
      label: 'No spaces',
      valid: trainerName.length > 0 && !/\s/.test(trainerName),
    },
  ]
  const trainerNameValid = trainerNameChecks.every((check) => check.valid)

  const openPokemonSelect = useCallback(async (nextMode: SelectMode) => {
    if (battleFinishedRef.current) return

    setLeaderboardCheckPending(true)

    try {
      const currentLeaderboard = await getCurrentLeaderboardEntry()

      if (battleFinishedRef.current) return

      if (!currentLeaderboard) {
        setLeaderboard(null)
        setSelectMode(null)
        setSelectedIndex(null)
        return
      }

      setLeaderboard(currentLeaderboard)
      setSelectMode(nextMode)
      setSelectedIndex(null)
    } finally {
      setLeaderboardCheckPending(false)
    }
  }, [])

  useEffect(() => {
    battleFinishedRef.current = status === 'finished' || Boolean(outcome)
  }, [outcome, status])

  useEffect(() => {
    if (initialLeaderboard) {
      window.setTimeout(() => {
        void openPokemonSelect('starter')
      }, 0)
    }
  }, [initialLeaderboard, openPokemonSelect])

  useEffect(() => {
    if (profileState?.data) {
      window.setTimeout(() => {
        void openPokemonSelect('starter')
      }, 0)
    }
  }, [openPokemonSelect, profileState])

  useEffect(() => {
    if (battleInProgress) {
      window.sessionStorage.setItem('pokarena:battle-active', '1')
      return
    }

    window.sessionStorage.removeItem('pokarena:battle-active')
  }, [battleInProgress])

  useEffect(() => {
    if (modalOpen || (status !== 'player-turn' && status !== 'opponent-turn')) return

    const timer = window.setInterval(() => {
      setTotalSeconds((value) => value + 1)
      setTurnSeconds((value) => Math.max(0, value - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [modalOpen, status])

  useEffect(() => {
    const cancelWithoutScore = () => {
      if (!battleInProgress) return
      window.sessionStorage.removeItem('pokarena:battle-active')
      setScoreAwarded(true)
      setOutcome('forfeit')
      setStatus('finished')
    }

    window.addEventListener('pagehide', cancelWithoutScore)
    window.addEventListener('popstate', cancelWithoutScore)

    return () => {
      window.removeEventListener('pagehide', cancelWithoutScore)
      window.removeEventListener('popstate', cancelWithoutScore)
    }
  }, [battleInProgress])

  useEffect(() => {
    if (outcome !== 'win' || scoreAwarded) return

    const points = scoreForWin(battlePlayerTeam, totalSeconds)
    window.setTimeout(() => {
      setScoreAwarded(true)
      setSavedScore(points)
      void addBattleScore(points)
    }, 0)
  }, [battlePlayerTeam, outcome, scoreAwarded, totalSeconds])

  const visibleLogs = useMemo(() => logs.slice(0, 8), [logs])

  function finishBattle(nextOutcome: BattleOutcome, nextLogs: BattleLogEntry[]) {
    battleFinishedRef.current = true
    setOutcome(nextOutcome)
    setStatus('finished')
    setLogs(nextLogs)
    setSelectMode(null)
    window.sessionStorage.removeItem('pokarena:battle-active')
  }

  function startBattle(index: number) {
    const opponentIndex = firstAliveIndex(battleOpponentTeam)

    battleFinishedRef.current = false
    setActivePlayerIndex(index)
    setActiveOpponentIndex(opponentIndex)
    setOpponentRevealed(false)
    setFaintingSide(null)
    setStatus('setup')
    setTurnSeconds(TURN_LIMIT)
    setSelectMode(null)
    setSelectedIndex(null)
    playPokemonCry(battlePlayerTeam[index])
    setLogs([
      addLog('system', `You sent out ${battlePlayerTeam[index].name}.`),
      addLog('system', 'Opponent is choosing its starter.'),
    ])

    window.setTimeout(() => {
      if (battleFinishedRef.current) return

      setOpponentRevealed(true)
      setStatus('player-turn')
      setTurnSeconds(TURN_LIMIT)
      playPokemonCry(battleOpponentTeam[opponentIndex])
      setLogs((current) => [
        addLog('system', `Opponent sent out ${battleOpponentTeam[opponentIndex].name}.`),
        addLog('system', 'Choose an attack before the turn timer runs out.'),
        ...current,
      ])
    }, STARTER_REVEAL_DELAY)
  }

  function applyAttack(
    source: BattlePokemon,
    targetTeam: BattlePokemon[],
    targetIndex: number,
    move: BattleMove,
    actorLabel: string
  ) {
    const target = targetTeam[targetIndex]
    const result = calculateDamage(source, target, move)
    const nextLogs: BattleLogEntry[] = []

    if (result.missed) {
      nextLogs.push(addLog('attack', `${actorLabel} ${source.name} used ${move.name}, but it missed.`))
      return { nextTeam: targetTeam, logs: nextLogs, fainted: false }
    }

    const nextHp = Math.max(0, target.hp - result.damage)
    const nextTeam = targetTeam.map((pokemon, index) =>
      index === targetIndex ? { ...pokemon, hp: nextHp } : pokemon
    )

    nextLogs.push(addLog('attack', `${actorLabel} ${source.name} used ${move.name}.${effectivenessText(result.multiplier)}`))
    nextLogs.push(addLog('damage', `${target.name} lost ${result.damage} HP. Remaining: ${nextHp}/${target.maxHp}.`))

    if (nextHp <= 0) {
      nextLogs.push(addLog('system', `${target.name} fainted.`))
    }

    return { nextTeam, logs: nextLogs, fainted: nextHp <= 0 }
  }

  function handlePlayerAttack(move: BattleMove) {
    if (!canAct || activePlayerIndex === null) return

    const player = battlePlayerTeam[activePlayerIndex]
    setStatus('opponent-turn')
    const playerAttack = applyAttack(player, battleOpponentTeam, activeOpponentIndex, move, 'Your')
    const nextLogs = [...playerAttack.logs, ...logs]

    setBattleOpponentTeam(playerAttack.nextTeam)

    if (playerAttack.fainted) {
      setFaintingSide('opponent')
      window.setTimeout(() => {
        if (battleFinishedRef.current) return

        setFaintingSide(null)

        if (aliveCount(playerAttack.nextTeam) === 0) {
          finishBattle('win', [
            addLog('system', 'Victory! The opposing team has no Pokémon left.'),
            ...nextLogs,
          ])
          return
        }

        const nextOpponent = firstAliveIndex(playerAttack.nextTeam)
        setActiveOpponentIndex(nextOpponent)
        setLogs([
          addLog('system', `Opponent sent out ${playerAttack.nextTeam[nextOpponent].name}.`),
          ...nextLogs,
        ])
        setTurnSeconds(TURN_LIMIT)
        setStatus('player-turn')
        playPokemonCry(playerAttack.nextTeam[nextOpponent])
      }, FAINT_ANIMATION_MS)
      return
    }

    setLogs(nextLogs)
    runOpponentTurn(playerAttack.nextTeam, battlePlayerTeam, activePlayerIndex, nextLogs)
  }

  function runOpponentTurn(
    opponentTeamOverride = battleOpponentTeam,
    playerTeamOverride = battlePlayerTeam,
    playerIndexOverride = activePlayerIndex,
    baseLogs = logs
  ) {
    if (playerIndexOverride === null) return

    const opponent = opponentTeamOverride[activeOpponentIndex]
    const player = playerTeamOverride[playerIndexOverride]

    if (!opponent || !player || opponent.hp <= 0) return

    setStatus('opponent-turn')
    setTurnSeconds(TURN_LIMIT)

    window.setTimeout(() => {
      if (battleFinishedRef.current) return

      const move = chooseOpponentMove(opponent, player)
      const opponentAttack = applyAttack(opponent, playerTeamOverride, playerIndexOverride, move, 'Opponent')
      const nextLogs = [...opponentAttack.logs, ...baseLogs]

      setBattlePlayerTeam(opponentAttack.nextTeam)

      if (opponentAttack.fainted) {
        setFaintingSide('player')
        window.setTimeout(() => {
          if (battleFinishedRef.current) return

          setFaintingSide(null)

          if (aliveCount(opponentAttack.nextTeam) === 0) {
            finishBattle('loss', [
              addLog('system', 'Defeat. Your team has no Pokémon left.'),
              ...nextLogs,
            ])
            return
          }

          setLogs([
            addLog('system', 'Choose your next Pokémon. This forced switch does not spend your turn.'),
            ...nextLogs,
          ])
          setStatus('setup')
          void openPokemonSelect('forced')
        }, FAINT_ANIMATION_MS)
        return
      }

      setLogs(nextLogs)
      setStatus('player-turn')
      setTurnSeconds(TURN_LIMIT)
    }, 650)
  }

  useEffect(() => {
    if (status === 'player-turn' && turnSeconds === 0) {
      window.setTimeout(() => {
        runOpponentTurn(
          battleOpponentTeam,
          battlePlayerTeam,
          activePlayerIndex,
          [addLog('system', 'Turn timer expired. Your Pokémon hesitated and lost the turn.'), ...logs]
        )
      }, 0)
    }
    // runOpponentTurn intentionally uses the latest render state for the active battle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, turnSeconds])

  function confirmSwitch(index: number) {
    if (selectMode === 'starter') {
      startBattle(index)
      return
    }

    setActivePlayerIndex(index)
    setSelectMode(null)
    setSelectedIndex(null)
    setFaintingSide(null)
    setTurnSeconds(TURN_LIMIT)
    playPokemonCry(battlePlayerTeam[index])

    if (selectMode === 'forced') {
      setLogs((current) => [
        addLog('system', `You sent out ${battlePlayerTeam[index].name}.`),
        ...current,
      ])
      setStatus('player-turn')
      return
    }

    const switchLogs = [
      addLog('system', `You switched to ${battlePlayerTeam[index].name}. Manual switching spends your turn.`),
      ...logs,
    ]

    setLogs(switchLogs)
    runOpponentTurn(undefined, battlePlayerTeam, index, switchLogs)
  }

  function requestForfeit() {
    setShowForfeitConfirm(true)
  }

  function confirmForfeit() {
    finishBattle('forfeit', [
      addLog('system', 'Battle ended by player. Score was not saved.'),
      ...logs,
    ])
    setShowForfeitConfirm(false)
  }

  function replay() {
    battleFinishedRef.current = false
    window.sessionStorage.removeItem('pokarena:battle-active')
    setBattlePlayerTeam(cloneTeam(playerTeam))
    setBattleOpponentTeam(cloneTeam(opponentTeam))
    setActivePlayerIndex(null)
    setActiveOpponentIndex(0)
    setOpponentRevealed(false)
    setFaintingSide(null)
    setLogs([])
    setStatus('setup')
    setOutcome(null)
    setTurnSeconds(TURN_LIMIT)
    setTotalSeconds(0)
    setScoreAwarded(false)
    setSavedScore(null)
    void openPokemonSelect('starter')
    setSelectedIndex(null)
    router.refresh()
  }

  return (
    <div className="battle-page">
      <header className="battle-header">
        <div className="battle-brand-row">
          <PokemonLogo size="md" />
        </div>

        <div className="battle-title-copy">
          <p className="battle-kicker">Battle Arena</p>
          <h1>Choose your move wisely</h1>
          <p className="battle-title-note">Manage your team, watch the timers, and win the 6 vs 6 match.</p>
        </div>

        <div className="battle-header-actions">
          <div className="battle-match-meta">
            <div className="battle-timer">
              <Trophy size={16} />
              <span>Score</span>
              <strong>{leaderboard?.score ?? 0}</strong>
            </div>
            <div className="battle-timer">
              <Clock size={16} />
              <span>Total</span>
              <strong>{formatTime(totalSeconds)}</strong>
            </div>
          </div>
          <button className="battle-danger-btn" type="button" onClick={requestForfeit} disabled={status === 'finished'}>
            <DoorOpen size={16} />
            End Battle
          </button>
        </div>
      </header>

      <section className="battle-arena" aria-label="Battle arena">
        <div className="battle-team-status" aria-label="Team status">
          <TeamStatus label={`${trainerLabel}'s Team`} tone="player" team={battlePlayerTeam} hidden={activePlayerIndex === null} hiddenText="Choose your starter" />
          <TeamStatus label="Opponent Team" tone="opponent" team={battleOpponentTeam} hidden={!opponentRevealed} />
        </div>
        <div className="battle-fighter-column player">
          <FighterCard label={trainerLabel} side="player" pokemon={activePlayer} isFainting={faintingSide === 'player'} />
        </div>
        <div className="battle-vs">
          <Swords size={28} />
          <span>VS</span>
        </div>
        <div className="battle-fighter-column opponent">
          <FighterCard label="Opponent" side="opponent" pokemon={activeOpponent} isFainting={faintingSide === 'opponent'} />
        </div>
      </section>

      <section className="battle-controls">
        <div className="battle-control-head">
          <div>
            <p>Choose your attack</p>
            <span>{status === 'player-turn' ? 'Your turn' : status === 'opponent-turn' ? 'Opponent is moving' : 'Waiting for your selection'}</span>
          </div>
          <div className="battle-control-actions">
            <div className="battle-timer turn">
              <Clock size={16} />
              <span>Turn</span>
              <strong>{turnSeconds}s</strong>
            </div>
            <button
              type="button"
              className="battle-switch-btn"
              onClick={() => {
                void openPokemonSelect('switch')
              }}
              disabled={status !== 'player-turn' || leaderboardCheckPending}
            >
              <Shuffle size={16} />
              {leaderboardCheckPending ? 'Checking...' : 'Switch Pokémon'}
            </button>
          </div>
        </div>

        <div className="attack-grid">
          {(activePlayer?.moves ?? []).map((move) => {
            const multiplier = activeOpponent ? typeMultiplier(move.type, activeOpponent.types) : 1

            return (
              <button
                key={move.id}
                className={`attack-btn type-${move.type}`}
                type="button"
                disabled={!canAct}
                onClick={() => handlePlayerAttack(move)}
              >
                <span>
                  {move.name}
                  <em>{move.type}</em>
                </span>
                <strong>
                  PWR {move.power}
                  <small>ACC {move.accuracy}</small>
                  <small>EFF x{multiplier}</small>
                </strong>
              </button>
            )
          })}
        </div>
      </section>

      <section className="battle-log">
        <div className="battle-log-title">Battle Log</div>
        <div className="battle-log-list">
          {visibleLogs.length === 0 ? (
            <p className="battle-empty-log">Start the battle to see every turn here.</p>
          ) : (
            visibleLogs.map((entry) => (
              <p key={entry.id} className={`battle-log-entry ${entry.kind}`}>
                {entry.text}
              </p>
            ))
          )}
        </div>
      </section>

      {!leaderboard && (
        <BattleModalPortal>
          <div className="battle-modal-backdrop" role="dialog" aria-modal="true" aria-label="Create leaderboard username">
            <form
              action={profileAction}
              className="battle-modal battle-profile-form battle-profile-modal"
              onSubmit={(event) => {
                setTrainerNameSubmitted(true)

                if (!trainerNameValid) {
                  event.preventDefault()
                }
              }}
            >
              <div className="battle-result-mark">
                <UserRound size={26} />
              </div>
              <h2>Set Your Trainer Name</h2>
              <input
                className="input-field"
                name="username"
                placeholder="Trainer name"
                autoComplete="off"
                value={trainerName}
                onChange={(event) => setTrainerName(event.target.value)}
              />
              <ul className="trainer-name-rules" aria-label="Trainer name requirements">
                {trainerNameChecks.map((check) => (
                  <li
                    key={check.label}
                    data-valid={check.valid}
                    data-active={trainerName.length > 0 || trainerNameSubmitted}
                  >
                    {check.label}
                  </li>
                ))}
              </ul>
              {trainerNameSubmitted && !trainerNameValid && (
                <p className="battle-form-error">Trainer name does not meet the requirements.</p>
              )}
              {profileState?.error && <p className="battle-form-error">{profileState.error}</p>}
              <button className="btn-primary w-full justify-center" type="submit" disabled={profilePending}>
                {profilePending ? 'Checking...' : 'Create Profile'}
              </button>
            </form>
          </div>
        </BattleModalPortal>
      )}

      {leaderboard && selectMode && (
        <BattleModalPortal>
          <PokemonSelectModal
            mode={selectMode}
            team={battlePlayerTeam}
            activeIndex={activePlayerIndex}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            onCancel={
              selectMode === 'starter'
                ? () => router.push('/roster')
                : selectMode === 'forced'
                  ? undefined
                  : () => setSelectMode(null)
            }
            onConfirm={() => selectedIndex !== null && confirmSwitch(selectedIndex)}
          />
        </BattleModalPortal>
      )}

      {showForfeitConfirm && (
        <BattleModalPortal>
          <div className="battle-modal-backdrop" role="dialog" aria-modal="true" aria-label="End battle warning">
            <div className="battle-modal battle-confirm-modal">
              <div className="battle-warning-icon">
                <AlertTriangle size={28} />
              </div>
              <h2>End this battle?</h2>
              <p>Your current score will not be saved if you leave before the battle ends.</p>
              <div className="battle-modal-actions">
                <button className="btn-secondary" type="button" onClick={() => setShowForfeitConfirm(false)}>
                  Keep Fighting
                </button>
                <button className="battle-danger-btn" type="button" onClick={confirmForfeit}>
                  End Battle
                </button>
              </div>
            </div>
          </div>
        </BattleModalPortal>
      )}

      {status === 'finished' && outcome && (
        <BattleModalPortal>
          <div className="battle-modal-backdrop" role="dialog" aria-modal="true" aria-label="Battle result">
            <div className="battle-modal battle-result-modal">
              <div className={`battle-result-mark ${outcome}`}>
                {outcome === 'win' ? <Swords size={28} /> : outcome === 'loss' ? <Shield size={28} /> : <DoorOpen size={28} />}
              </div>
              <h2>{outcome === 'win' ? 'Victory!' : outcome === 'loss' ? 'Defeat' : 'Battle Ended'}</h2>
              <p>
                {outcome === 'win'
                  ? `Score saved: +${savedScore ?? scoreForWin(battlePlayerTeam, totalSeconds)} points.`
                  : outcome === 'loss'
                    ? 'No score was added this time.'
                    : 'You ended the battle early, so no score was saved.'}
              </p>
              <div className="battle-modal-actions">
                <Link className="btn-secondary" href="/">
                  <Home size={16} />
                  Home
                </Link>
                <button className="btn-primary" type="button" onClick={replay}>
                  <RotateCcw size={16} />
                  Play Again
                </button>
              </div>
            </div>
          </div>
        </BattleModalPortal>
      )}
    </div>
  )
}

function TeamStatus({
  label,
  tone,
  team,
  hidden = false,
  hiddenText = 'Waiting for opponent',
}: {
  label: string
  tone: 'player' | 'opponent'
  team: BattlePokemon[]
  hidden?: boolean
  hiddenText?: string
}) {
  const standing = aliveCount(team)

  return (
    <article className={`battle-team-card ${tone}`}>
      <div>
        <span>{label}</span>
        <strong>{hidden ? hiddenText : `${standing} / 6 standing`}</strong>
      </div>
      <div className="battle-team-dots" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, index) => (
          <span
            key={`${tone}-slot-${index}`}
            className={hidden ? 'unknown' : index < standing ? 'alive' : 'fainted'}
            title={hidden ? `Opponent slot ${index + 1}` : index < standing ? 'Standing' : 'Fainted'}
          />
        ))}
      </div>
    </article>
  )
}

function FighterCard({
  label,
  side,
  pokemon,
  isFainting = false,
}: {
  label: string
  side: 'player' | 'opponent'
  pokemon: BattlePokemon | null | undefined
  isFainting?: boolean
}) {
  const percent = hpPercent(pokemon)
  const pendingFighter = !pokemon
  const hiddenOpponent = side === 'opponent' && pendingFighter
  const placeholderType = hiddenOpponent ? 'Pending' : 'Choose starter'
  const mainType = pokemon?.types[0] ?? 'pending'

  return (
    <article className={`fighter-card-shell ${side}`}>
      <div className={`fighter-card ${side} type-${mainType}`} data-fainting={isFainting} data-hidden={pendingFighter}>
        <div className="fighter-card-main">
          <div className="fighter-topline">
            <div className="fighter-label">{label}</div>
            {pokemon && (
              <span className="fighter-id">#{String(pokemon.pokemonId).padStart(3, '0')}</span>
            )}
          </div>
          <div className="fighter-image-wrap">
            {pokemon?.spriteUrl ? (
              <img key={pokemon.key} className="fighter-image" src={pokemon.spriteUrl} alt={pokemon.name} />
            ) : (
              <Shield size={54} />
            )}
          </div>
          <h2>{pokemon?.name ?? (hiddenOpponent ? 'Awaiting Opponent' : 'Select Pokémon')}</h2>
          <div className="fighter-types">
            {pokemon ? pokemon.types.map((type) => (
              <span key={type} className={`type-badge type-${type}`}>
                {type}
              </span>
            )) : (
              <span className="type-badge type-pending">
                {placeholderType}
              </span>
            )}
          </div>
          {pokemon && (
            <div className="fighter-stat-grid">
              <span>ATK <strong>{pokemon.attack}</strong></span>
              <span>DEF <strong>{pokemon.defense}</strong></span>
              <span>SPD <strong>{pokemon.speed}</strong></span>
            </div>
          )}
          {!pokemon && (
            <div className="fighter-stat-grid placeholder">
              <span>ATK <strong>?</strong></span>
              <span>DEF <strong>?</strong></span>
              <span>SPD <strong>?</strong></span>
            </div>
          )}
        </div>
        <div className="hp-bar-wrap">
          <span className="hp-title">HP</span>
          <div className="hp-track">
            <div className={`hp-fill ${hpColor(percent)}`} style={{ width: `${percent}%` }} />
          </div>
          <span className="hp-value">{pokemon ? `${pokemon.hp} / ${pokemon.maxHp}` : '— / —'}</span>
        </div>
      </div>
    </article>
  )
}

function PokemonSelectModal({
  mode,
  team,
  activeIndex,
  selectedIndex,
  onSelect,
  onCancel,
  onConfirm,
}: {
  mode: SelectMode
  team: BattlePokemon[]
  activeIndex: number | null
  selectedIndex: number | null
  onSelect: (index: number) => void
  onCancel?: () => void
  onConfirm: () => void
}) {
  const title = mode === 'starter' ? 'Choose your starter' : mode === 'forced' ? 'Choose your next Pokémon' : 'Switch Pokémon'
  const selectedPokemon = selectedIndex === null ? null : team[selectedIndex]

  return (
    <div className="battle-modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className="battle-modal wide">
        <h2>{title}</h2>
        <p>
          {mode === 'switch'
            ? 'Manual switching spends your turn. The opponent will attack after you confirm.'
            : 'Pick one available Pokémon to enter the arena.'}
        </p>
        <div className="battle-select-grid">
          {team.map((pokemon, index) => {
            const isFainted = pokemon.hp <= 0
            const isCurrent = activeIndex === index
            const disabled = isFainted || isCurrent
            const reason = isFainted ? 'Fainted' : isCurrent ? 'Currently active' : ''
            const mainType = pokemon.types[0] ?? 'normal'

            return (
              <button
                key={pokemon.key}
                type="button"
                className={`battle-select-card type-${mainType}`}
                data-selected={selectedIndex === index}
                data-reason={reason}
                disabled={disabled}
                onClick={() => onSelect(index)}
              >
                <span className="battle-select-card-content">
                  <span className="battle-select-topline">
                    <strong>{pokemon.name}</strong>
                    <span className="battle-select-id">#{String(pokemon.pokemonId).padStart(3, '0')}</span>
                  </span>
                  <span className="battle-select-art">
                    <img src={pokemon.spriteUrl} alt={pokemon.name} />
                  </span>
                  <span className="battle-select-types">
                    {pokemon.types.map((type) => (
                      <span key={type} className={`type-badge type-${type}`}>
                        {type}
                      </span>
                    ))}
                  </span>
                  <span className="battle-select-hp">
                    HP {pokemon.hp}/{pokemon.maxHp}
                  </span>
                  <span className="battle-select-stats">
                    <span>ATK {pokemon.attack}</span>
                    <span>DEF {pokemon.defense}</span>
                    <span>SPD {pokemon.speed}</span>
                  </span>
                </span>
              </button>
            )
          })}
        </div>
        {mode === 'switch' && (
          <p className="battle-rule-note">
            Switch rule: confirming a manual switch uses your turn, then the opponent immediately attacks.
          </p>
        )}
        <div className="battle-modal-actions">
          {onCancel && (
            <button className="btn-secondary" type="button" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button className="btn-primary" type="button" disabled={!selectedPokemon} onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
