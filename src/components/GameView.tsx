import React, { useState, useEffect, useRef } from 'react';
import { Game } from '../core/Game';
import { SimpleGreedyPlayer } from '../strategies/SimpleGreedyPlayer';
import { BoardComponent } from './BoardComponent';
import { HandComponent } from './HandComponent';
import { SimulationPanel } from './SimulationPanel';


export const GameView: React.FC = () => {
    // We store the game instance in a Ref because it's mutable and not a React state itself.
    // We force re-renders using a tick state.
    const gameRef = useRef<Game | null>(null);
    const [tick, setTick] = useState(0);
    const [autoPlay, setAutoPlay] = useState(false);
    const [speed, setSpeed] = useState(500);
    const [gameStatus, setGameStatus] = useState<'IDLE' | 'RUNNING' | 'FINISHED'>('IDLE');
    const [winnerName, setWinnerName] = useState<string | null>(null);

    // Initialize Game
    const initGame = () => {
        const p1 = new SimpleGreedyPlayer('p1', 'Alice');
        const p2 = new SimpleGreedyPlayer('p2', 'Bob');
        // p3/p4 if we want

        const newGame = new Game([p1, p2]);
        newGame.start();
        gameRef.current = newGame;
        setGameStatus('RUNNING');
        setWinnerName(null);
        setTick(t => t + 1);
    };

    const handleNextTurn = async () => {
        if (!gameRef.current || gameRef.current.isGameOver) return;

        await gameRef.current.playNextTurn();

        if (gameRef.current.isGameOver) {
            setGameStatus('FINISHED');
            setWinnerName(gameRef.current.winner?.name || 'Draw');
            setAutoPlay(false);
        }
        setTick(t => t + 1);
    };

    // Auto Logic
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (autoPlay && gameStatus === 'RUNNING') {
            interval = setInterval(() => {
                handleNextTurn();
            }, speed);
        }
        return () => clearInterval(interval);
    }, [autoPlay, gameStatus, speed]);

    if (!gameRef.current) {
        return (
            <div className="game-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <h1>Rummikub Simulator</h1>
                <button onClick={initGame} style={{ fontSize: '20px', padding: '15px 30px' }}>Start New Game</button>
            </div>
        );
    }

    const game = gameRef.current;
    const currentPlayer = game.players[game.currentPlayerIndex];

    return (
        <div className="game-container">
            <div className="controls">
                <button onClick={initGame}>Restart</button>
                <button onClick={() => setAutoPlay(!autoPlay)}>
                    {autoPlay ? 'Pause' : 'Auto Play'}
                </button>
                <button onClick={handleNextTurn} disabled={autoPlay || gameStatus === 'FINISHED'}>
                    Next Turn
                </button>

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

            <BoardComponent board={game.board} />

            <div style={{ display: 'flex', gap: '20px', overflowX: 'auto' }}>
                {game.players.map(p => (
                    <div style={{ flex: 1 }} key={p.id}>
                        <HandComponent player={p} isActive={p === currentPlayer} />
                    </div>
                ))}
            </div>

            <SimulationPanel />
        </div>
    );
};

