import React, { useState } from 'react';
import { Game } from '../core/Game';
import { SimpleGreedyPlayer } from '../strategies/SimpleGreedyPlayer';
import { HoardingPlayer } from '../strategies/HoardingPlayer';
import { MinMaxPlayer } from '../strategies/MinMaxPlayer';
import { type AdvancedSettings, AdvancedSettingsPanel } from './AdvancedSettingsPanel';
// Default Settings
export const SimulationPanel: React.FC = () => {
    const [aiSettings, setAiSettings] = useState<AdvancedSettings>({
        timeLimitMs: 1000,
        maxDepth: 1, // Depth 1 is just optimizing current turn. Depth 2 is MinMax.
        useHeuristics: true
    });

    const [simulating, setSimulating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [numGamesToRun, setNumGamesToRun] = useState(100); // Default to 100 for speed
    const [results, setResults] = useState<{
        gamesPlayed: number;
        p1Wins: number;
        p2Wins: number;
        draws: number;
        avgTurns: number;
    } | null>(null);

    const runBatch = async () => {
        setSimulating(true);
        setResults(null);
        setProgress(0);

        // Stats accumulators
        let p1Wins = 0;
        let p2Wins = 0;
        let draws = 0;
        let totalTurns = 0;

        const GAMES = numGamesToRun;
        const BATCH_SIZE = 10; // Yield every 10 games to update UI

        for (let i = 0; i < GAMES; i++) {
            const p1 = new MinMaxPlayer('p1', 'MinMax', aiSettings.maxDepth, aiSettings.timeLimitMs, aiSettings.useHeuristics);
            const p2 = new HoardingPlayer('p2', 'Hoarder', 20);
            const game = new Game([p1, p2]);
            game.start();

            let turns = 0;
            const MAX_TURNS = 200;

            while (!game.isGameOver && turns < MAX_TURNS) {
                await game.playNextTurn();
                turns++;
            }

            totalTurns += turns;
            if (game.winner?.id === 'p1') p1Wins++;
            else if (game.winner?.id === 'p2') p2Wins++;
            else draws++;

            // Update progress occasionally
            if (i % BATCH_SIZE === 0 || i === GAMES - 1) {
                setProgress(Math.floor(((i + 1) / GAMES) * 100));
                // Optional: Show intermediate results?
                setResults({
                    gamesPlayed: i + 1,
                    p1Wins,
                    p2Wins,
                    draws,
                    avgTurns: totalTurns / (i + 1)
                });
                // Yield to event loop
                await new Promise(r => setTimeout(r, 0));
            }
        }

        // Final set
        setResults({
            gamesPlayed: GAMES,
            p1Wins,
            p2Wins,
            draws,
            avgTurns: totalTurns / GAMES
        });
        setSimulating(false);
        setProgress(100);
    };

    return (
        <div style={{ padding: '20px', background: 'rgba(0,0,0,0.3)', marginTop: '20px', borderRadius: '8px', color: 'white' }}>
            <h3>Strategy Analyzer</h3>
            <div style={{ marginBottom: '10px' }}>
                <label style={{ marginRight: '10px' }}>Games:</label>
                <input
                    type="number"
                    value={numGamesToRun}
                    onChange={e => setNumGamesToRun(Number(e.target.value))}
                    disabled={simulating}
                    style={{ padding: '5px', borderRadius: '4px', border: 'none' }}
                />
            </div>

            <AdvancedSettingsPanel settings={aiSettings} onUpdate={setAiSettings} />

            <p>P1: SimpleGreedy vs P2: Hoarder(20)</p>

            <button
                onClick={runBatch}
                disabled={simulating}
                style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: 'none',
                    background: simulating ? '#666' : '#4CAF50',
                    color: 'white',
                    cursor: simulating ? 'not-allowed' : 'pointer'
                }}
            >
                {simulating ? `Simulating... ${progress}%` : 'Run Simulation'}
            </button>

            {/* Progress Bar */}
            {simulating && (
                <div style={{ width: '100%', height: '10px', background: '#444', marginTop: '10px', borderRadius: '5px' }}>
                    <div style={{
                        width: `${progress}%`,
                        height: '100%',
                        background: '#4CAF50',
                        borderRadius: '5px',
                        transition: 'width 0.2s'
                    }} />
                </div>
            )}

            {results && (
                <div style={{ marginTop: '10px' }}>
                    <p><strong>Results ({results.gamesPlayed} games):</strong></p>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        <li>🏆 Greedy Wins: {results.p1Wins} ({(results.p1Wins / results.gamesPlayed * 100).toFixed(1)}%)</li>
                        <li>🏆 Hoarder Wins: {results.p2Wins} ({(results.p2Wins / results.gamesPlayed * 100).toFixed(1)}%)</li>
                        <li>➖ Draws/Timeout: {results.draws} ({(results.draws / results.gamesPlayed * 100).toFixed(1)}%)</li>
                        <li>⏱ Avg Turns: {results.avgTurns.toFixed(1)}</li>
                    </ul>
                </div>
            )}
        </div>
    );
};
