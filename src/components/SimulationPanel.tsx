import React, { useState } from 'react';
import { Game } from '../core/Game';
import { SimpleGreedyPlayer } from '../strategies/SimpleGreedyPlayer';
import { HoardingPlayer } from '../strategies/HoardingPlayer';

export const SimulationPanel: React.FC = () => {
    const [simulating, setSimulating] = useState(false);
    const [results, setResults] = useState<{
        gamesPlayed: number;
        p1Wins: number;
        p2Wins: number;
        draws: number;
        avgTurns: number;
    } | null>(null);

    const runBatch = async () => {
        setSimulating(true);
        // Yield to let UI update
        await new Promise(r => setTimeout(r, 10));

        let p1Wins = 0;
        let p2Wins = 0;
        let draws = 0;
        let totalTurns = 0;
        const GAMES = 1000;

        for (let i = 0; i < GAMES; i++) {
            const p1 = new SimpleGreedyPlayer('p1', 'Greedy');
            const p2 = new HoardingPlayer('p2', 'Hoarder', 20);
            const game = new Game([p1, p2]);
            game.start();

            let turns = 0;
            const MAX_TURNS = 200; // Cap to prevent stuck games affecting stats too much

            while (!game.isGameOver && turns < MAX_TURNS) {
                await game.playNextTurn();
                turns++;
            }

            totalTurns += turns;
            if (game.winner?.id === 'p1') p1Wins++;
            else if (game.winner?.id === 'p2') p2Wins++;
            else draws++;
        }

        setResults({
            gamesPlayed: GAMES,
            p1Wins,
            p2Wins,
            draws,
            avgTurns: totalTurns / GAMES
        });
        setSimulating(false);
    };

    return (
        <div style={{ padding: '20px', background: 'rgba(0,0,0,0.3)', marginTop: '20px', borderRadius: '8px' }}>
            <h3>Strategy Analyzer (1000 Games)</h3>
            <p>P1: SimpleGreedy vs P2: Hoarder(20)</p>

            <button onClick={runBatch} disabled={simulating}>
                {simulating ? 'Simulating...' : 'Run Simulation'}
            </button>

            {results && (
                <div style={{ marginTop: '10px' }}>
                    <p><strong>Results:</strong></p>
                    <ul>
                        <li>Games: {results.gamesPlayed}</li>
                        <li>Greedy Wins: {results.p1Wins} ({(results.p1Wins / results.gamesPlayed * 100).toFixed(1)}%)</li>
                        <li>Hoarder Wins: {results.p2Wins} ({(results.p2Wins / results.gamesPlayed * 100).toFixed(1)}%)</li>
                        <li>Draws/Timeout: {results.draws}</li>
                        <li>Avg Turns: {results.avgTurns.toFixed(1)}</li>
                    </ul>
                </div>
            )}
        </div>
    );
};
