import React, { useState, useEffect, useRef } from 'react';
import { Game } from '../core/Game';
import { SimpleGreedyPlayer } from '../strategies/SimpleGreedyPlayer';
import { MinMaxPlayer } from '../strategies/MinMaxPlayer';
import { HoardingPlayer } from '../strategies/HoardingPlayer';
import { HumanPlayer } from '../core/HumanPlayer';
import { BoardComponent } from './BoardComponent';
import { HandComponent } from './HandComponent';
import { SimulationPanel } from './SimulationPanel';
import { Tile } from '../core/Tile';
import { Meld } from '../core/Meld';
import { Board } from '../core/Board';
import { TileComponent } from './TileComponent';


export const GameView: React.FC = () => {
    // We store the game instance in a Ref because it's mutable and not a React state itself.
    // We force re-renders using a tick state.
    const gameRef = useRef<Game | null>(null);
    const processingRef = useRef(false);
    const [tick, setTick] = useState(0);
    const [autoPlay, setAutoPlay] = useState(false);
    const [speed, setSpeed] = useState(500);
    const [gameStatus, setGameStatus] = useState<'SETUP' | 'IDLE' | 'RUNNING' | 'FINISHED'>('SETUP');
    const [winnerName, setWinnerName] = useState<string | null>(null);

    // Setup State
    const [p1Type, setP1Type] = useState('Human');
    const [p2Type, setP2Type] = useState('SimpleGreedy');

    // ===== HUMAN PLAYER TILE SELECTION STATE =====
    const [selectedHandTileIds, setSelectedHandTileIds] = useState<Set<string>>(new Set());
    const [selectedBoardTileIds, setSelectedBoardTileIds] = useState<Set<string>>(new Set());
    const [stagedMelds, setStagedMelds] = useState<Tile[][]>([]); // Array of melds being built

    // Initialize Game
    const initGame = () => {
        setGameStatus('SETUP');
        setAutoPlay(false);
        clearSelection();
    };

    const clearSelection = () => {
        setSelectedHandTileIds(new Set());
        setSelectedBoardTileIds(new Set());
        setStagedMelds([]);
    };

    const startGame = () => {
        let p1, p2;

        const createPlayer = (type: string, id: string, name: string) => {
            switch (type) {
                case 'Human': return new HumanPlayer(id, name);
                case 'SimpleGreedy': return new SimpleGreedyPlayer(id, name);
                case 'MinMax': return new MinMaxPlayer(id, name, 1, 1000, true);
                case 'Hoarder': return new HoardingPlayer(id, name, 15);
                default: return new SimpleGreedyPlayer(id, name);
            }
        };

        p1 = createPlayer(p1Type, 'p1', 'Player 1');
        p2 = createPlayer(p2Type, 'p2', 'Player 2');

        const newGame = new Game([p1, p2]);
        newGame.start();
        gameRef.current = newGame;
        setGameStatus('RUNNING');
        setWinnerName(null);
        clearSelection();
        setTick(t => t + 1);
    };

    const handleNextTurn = async () => {
        if (!gameRef.current || gameRef.current.isGameOver || processingRef.current) return;
        processingRef.current = true;

        const game = gameRef.current;
        const currentPlayer = game.players[game.currentPlayerIndex];
        const isHuman = currentPlayer instanceof HumanPlayer;

        // Force update to show "Thinking..." or similar if needed
        setTick(t => t + 1);

        // Allow UI to update before blocking
        await new Promise(r => setTimeout(r, 0));

        // For human players, we need to trigger a re-render AFTER the Promise is set up
        // but BEFORE the await hangs waiting for player input
        if (isHuman) {
            // Schedule a re-render to happen after playTurn sets up the Promise
            setTimeout(() => setTick(t => t + 1), 50);
        }

        await gameRef.current.playNextTurn();

        if (gameRef.current.isGameOver) {
            setGameStatus('FINISHED');
            setWinnerName(gameRef.current.winner?.name || 'Draw');
            setAutoPlay(false);
        }
        processingRef.current = false;
        clearSelection();
        setTick(t => t + 1);
    };

    // Human Interactions
    const handleHumanDraw = () => {
        const game = gameRef.current;
        if (!game) return;
        const player = game.players[game.currentPlayerIndex];
        if (player instanceof HumanPlayer) {
            player.performDraw();
            clearSelection();
        }
    };

    const handleHumanAutoPlay = () => {
        const game = gameRef.current;
        if (!game) return;
        const player = game.players[game.currentPlayerIndex];
        if (player instanceof HumanPlayer) {
            player.autoPlay(game.board);
            clearSelection();
        }
    };

    // ===== TILE SELECTION HANDLERS =====
    const handleHandTileClick = (tile: Tile) => {
        setSelectedHandTileIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(tile.id)) {
                newSet.delete(tile.id);
            } else {
                newSet.add(tile.id);
            }
            return newSet;
        });
    };

    const handleBoardTileClick = (tile: Tile) => {
        setSelectedBoardTileIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(tile.id)) {
                newSet.delete(tile.id);
            } else {
                newSet.add(tile.id);
            }
            return newSet;
        });
    };

    // Create a new meld from selected tiles (adds to staged melds)
    const handleCreateMeld = () => {
        const game = gameRef.current;
        if (!game) return;

        const player = game.players[game.currentPlayerIndex];
        if (!(player instanceof HumanPlayer)) return;

        // Gather selected tiles from hand
        const handTiles = player.hand.filter(t => selectedHandTileIds.has(t.id));

        // Gather selected tiles from board
        const boardTiles = game.board.getAllTiles().filter(t => selectedBoardTileIds.has(t.id));

        const allSelected = [...handTiles, ...boardTiles];

        if (allSelected.length >= 3) {
            setStagedMelds(prev => [...prev, allSelected]);
            setSelectedHandTileIds(new Set());
            setSelectedBoardTileIds(new Set());
        }
    };

    // Remove a staged meld
    const handleRemoveStagedMeld = (index: number) => {
        setStagedMelds(prev => prev.filter((_, i) => i !== index));
    };

    // Submit all staged melds as the play
    const handleSubmitPlay = () => {
        const game = gameRef.current;
        if (!game) return;

        const player = game.players[game.currentPlayerIndex];
        if (!(player instanceof HumanPlayer)) return;

        // Build the new board state
        const tilesPlayedFromHand: Tile[] = [];
        const allStagedTileIds = new Set(stagedMelds.flat().map(t => t.id));

        // Track which tiles from hand were used
        for (const meld of stagedMelds) {
            for (const tile of meld) {
                if (player.hand.some(h => h.id === tile.id)) {
                    tilesPlayedFromHand.push(tile);
                }
            }
        }

        // Create new board:
        // 1. Keep existing melds that weren't touched (no tiles removed)
        // 2. Remove melds that had tiles picked from them
        // 3. Add remaining tiles from partially-picked melds back as individual melds (they need to be re-formed)
        // 4. Add all staged melds

        const newMelds: Meld[] = [];

        // Process existing melds
        for (const existingMeld of game.board.melds) {
            const existingTiles = existingMeld.getTiles();
            const remainingTiles = existingTiles.filter(t => !allStagedTileIds.has(t.id));

            if (remainingTiles.length === existingTiles.length) {
                // Meld wasn't touched, keep it
                newMelds.push(new Meld(existingTiles));
            } else if (remainingTiles.length >= 3) {
                // Some tiles were taken but enough remain for a valid meld
                newMelds.push(new Meld(remainingTiles));
            } else if (remainingTiles.length > 0) {
                // Not enough tiles left - these orphaned tiles need to go somewhere
                // For now, they become invalid - user must handle them
                newMelds.push(new Meld(remainingTiles));
            }
            // If no tiles remain, the meld is removed entirely
        }

        // Add staged melds
        for (const stagedMeld of stagedMelds) {
            newMelds.push(new Meld(stagedMeld));
        }

        const newBoard = new Board(newMelds);

        // Validate before submitting
        if (!newBoard.isValid()) {
            alert('Invalid board state! All melds must be valid (3+ tiles, valid run or group).');
            return;
        }

        // Check initial meld requirement (30+ points)
        if (!player.hasCompletedInitialMeld) {
            const pointsPlayed = tilesPlayedFromHand.reduce((sum, t) => sum + (t.isJoker ? 0 : t.value), 0);
            if (pointsPlayed < 30) {
                alert(`Initial meld must be worth at least 30 points. You played ${pointsPlayed} points.`);
                return;
            }
        }

        // Submit the play
        player.performPlay(newBoard, tilesPlayedFromHand);
        clearSelection();
    };

    // Auto Logic & Human Trigger
    useEffect(() => {
        if (gameStatus !== 'RUNNING' || !gameRef.current) return;

        const game = gameRef.current;
        const currentPlayer = game.players[game.currentPlayerIndex];
        const isHuman = currentPlayer instanceof HumanPlayer;

        if (isHuman) {
            // If it's human turn, we should ensure the turn processing started (so it can wait)
            // If we are already processing (waiting), processingRef is true.
            // BUT processingRef is true only while `playNextTurn` is on the stack.
            // When `HumanPlayer` awaits, `playNextTurn` is still running (awaited).
            // So processingRef should be true.

            // If processingRef is false, it means we haven't started the turn yet.
            if (!processingRef.current) {
                handleNextTurn();
            }
        } else {
            // AI Player
            if (autoPlay) {
                if (!processingRef.current) {
                    const timer = setTimeout(handleNextTurn, speed);
                    return () => clearTimeout(timer);
                }
            }
        }
    }, [autoPlay, gameStatus, tick, speed]);

    if (gameStatus === 'SETUP') {
        return (
            <div className="game-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <h1>Rummikub Simulator</h1>
                <div style={{ background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '10px' }}>
                    <h3>New Game</h3>
                    <div style={{ marginBottom: '10px' }}>
                        <label style={{ marginRight: '10px' }}>Player 1:</label>
                        <select value={p1Type} onChange={e => setP1Type(e.target.value)}>
                            <option value="Human">Human</option>
                            <option value="SimpleGreedy">Simple Bot</option>
                            <option value="MinMax">Smart Bot (MinMax)</option>
                            <option value="Hoarder">Hoarder Bot</option>
                        </select>
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ marginRight: '10px' }}>Player 2:</label>
                        <select value={p2Type} onChange={e => setP2Type(e.target.value)}>
                            <option value="Human">Human</option>
                            <option value="SimpleGreedy">Simple Bot</option>
                            <option value="MinMax">Smart Bot (MinMax)</option>
                            <option value="Hoarder">Hoarder Bot</option>
                        </select>
                    </div>
                    <button onClick={startGame} style={{ fontSize: '18px', padding: '10px 20px', cursor: 'pointer' }}>Start Game</button>
                </div>
                <div style={{ marginTop: '50px' }}>
                    <SimulationPanel />
                </div>
            </div>
        );
    }

    if (!gameRef.current) return null;

    const game = gameRef.current;
    const currentPlayer = game.players[game.currentPlayerIndex];
    const isHumanTurn = currentPlayer instanceof HumanPlayer;
    // We are waiting if it is human turn AND the human player object says it is waiting.
    const isWaitingForHuman = isHumanTurn && (currentPlayer as HumanPlayer).isWaiting;

    const totalSelected = selectedHandTileIds.size + selectedBoardTileIds.size;

    return (
        <div className="game-container">
            <div className="controls">
                <button onClick={initGame}>Restart</button>
                <button onClick={() => setAutoPlay(!autoPlay)}>
                    {autoPlay ? 'Pause' : 'Auto Play'}
                </button>
                <button onClick={handleNextTurn} disabled={autoPlay || isWaitingForHuman || gameStatus === 'FINISHED' || processingRef.current}>
                    {isHumanTurn ? 'Processing Human Turn...' : 'Next Turn'}
                </button>

                {isWaitingForHuman && gameStatus === 'RUNNING' && (
                    <div style={{ display: 'inline-flex', gap: '10px', marginLeft: '10px', background: '#e67e22', padding: '5px', borderRadius: '5px' }}>
                        <strong>Your Turn:</strong>
                        <button onClick={handleHumanDraw}>Draw Tile</button>
                        <button onClick={handleHumanAutoPlay}>Auto Move (Help)</button>
                    </div>
                )}

                <label style={{ marginLeft: 'auto' }}>Speed: </label>
                <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                    <option value={1000}>Slow (1s)</option>
                    <option value={500}>Normal (0.5s)</option>
                    <option value={100}>Fast (0.1s)</option>
                    <option value={10}>Hyper (10ms)</option>
                </select>
            </div>

            <div className="stats-panel">
                <strong>Turn:</strong> {tick} |
                <strong> Status:</strong> {gameStatus}
                {winnerName && <strong> | Winner: {winnerName}</strong>} |
                <strong> Deck:</strong> {game.deck.length} tiles
            </div>

            <BoardComponent
                board={game.board}
                selectedTileIds={selectedBoardTileIds}
                onTileClick={handleBoardTileClick}
                interactable={isWaitingForHuman}
            />

            {/* Meld Builder UI - Only visible during human turn */}
            {isWaitingForHuman && (
                <div style={{
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    border: '2px solid #e67e22'
                }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#e67e22' }}>🎯 Meld Builder</h4>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                        <span>Selected: {totalSelected} tiles</span>
                        <button
                            onClick={handleCreateMeld}
                            disabled={totalSelected < 3}
                            style={{ background: totalSelected >= 3 ? '#27ae60' : '#666' }}
                        >
                            Create Meld ({totalSelected} tiles)
                        </button>
                        <button onClick={clearSelection} style={{ background: '#c0392b' }}>
                            Clear Selection
                        </button>
                    </div>

                    {/* Staged Melds Display */}
                    {stagedMelds.length > 0 && (
                        <div style={{ marginTop: '10px' }}>
                            <strong>Staged Melds:</strong>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '5px' }}>
                                {stagedMelds.map((meld, idx) => {
                                    const tempMeld = new Meld(meld);
                                    const isValid = tempMeld.validate();
                                    return (
                                        <div
                                            key={idx}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                background: isValid ? 'rgba(39, 174, 96, 0.3)' : 'rgba(231, 76, 60, 0.3)',
                                                padding: '5px',
                                                borderRadius: '4px',
                                                border: `2px solid ${isValid ? '#27ae60' : '#e74c3c'}`
                                            }}
                                        >
                                            {meld.map(tile => (
                                                <TileComponent key={tile.id} tile={tile} />
                                            ))}
                                            <button
                                                onClick={() => handleRemoveStagedMeld(idx)}
                                                style={{ marginLeft: '5px', background: '#c0392b', padding: '5px 8px' }}
                                            >
                                                ✕
                                            </button>
                                            <span style={{ marginLeft: '5px', fontSize: '12px' }}>
                                                {isValid ? '✓' : '✗'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    {stagedMelds.length > 0 && (
                        <button
                            onClick={handleSubmitPlay}
                            style={{
                                marginTop: '10px',
                                background: '#8e44ad',
                                fontSize: '16px',
                                padding: '10px 20px'
                            }}
                        >
                            ✓ Submit Play
                        </button>
                    )}
                </div>
            )}

            <div style={{ display: 'flex', gap: '20px', flexShrink: 0, overflow: 'auto', minHeight: 0 }}>
                {game.players.map(p => {
                    const isCurrentHuman = p === currentPlayer && p instanceof HumanPlayer;
                    // Get the drawn tile IDs for this specific player
                    const drawnIds = game.drawnTileIdsByPlayer.get(p.id) || [];
                    const playerNewTileIds = new Set<string>(drawnIds);
                    return (
                        <div style={{ flex: 1, minWidth: '400px' }} key={p.id}>
                            <HandComponent
                                player={p}
                                isActive={p === currentPlayer}
                                selectedTileIds={isCurrentHuman ? selectedHandTileIds : undefined}
                                onTileClick={handleHandTileClick}
                                interactable={isCurrentHuman && isWaitingForHuman}
                                newTileIds={playerNewTileIds.size > 0 ? playerNewTileIds : undefined}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
