import { Player } from '../core/Player';
import { Board } from '../core/Board';
import { Tile } from '../core/Tile';
import { Meld } from '../core/Meld';
import { Solver } from '../core/Solver';



export class SimpleGreedyPlayer extends Player {

    async playTurn(board: Board): Promise<{ action: 'DRAW' | 'PLAY'; newBoard?: Board; tilesPlayed?: Tile[] }> {
        // Multi-Phase Greedy Strategy
        // Phase A: "Seed" the play by finding independent melds in hand. 
        //          (Critical for Initial Meld or starting new structures on empty board).
        // Phase B: "Extend/Manipulate" by trying to fit remaining tiles into the pool using Solver.
        //          (Critical for adding to existing melds or complex rearrangement).

        const originalBoardTiles = board.getAllTiles();

        // If Initial Meld not done, we CANNOT use board tiles.
        // If done, we start with board tiles.
        let currentPool = this.hasCompletedInitialMeld ? [...originalBoardTiles] : [];

        // Track used tiles from hand to avoid duplication in phases
        let handTiles = [...this.hand];
        let tilesPlayedRound: Tile[] = [];

        // --- Phase A: Find Independent Melds in Hand ---
        // This is a heuristic search for disjoint groups and runs.

        // 1. Look for Groups
        const byValue = new Map<number, Tile[]>();
        handTiles.filter(t => !t.isJoker).forEach(t => {
            if (!byValue.has(t.value)) byValue.set(t.value, []);
            byValue.get(t.value)!.push(t);
        });

        // We accept any group of 3+ distinct colors
        for (const candidates of byValue.values()) {
            const distinct = new Map<string, Tile>();
            candidates.forEach(t => {
                if (!distinct.has(t.color)) distinct.set(t.color, t);
            });

            if (distinct.size >= 3) {
                // Found a group!
                const groupTiles = Array.from(distinct.values());
                currentPool.push(...groupTiles);
                tilesPlayedRound.push(...groupTiles);

                // Remove from hand check
                groupTiles.forEach(used => {
                    const idx = handTiles.findIndex(h => h.id === used.id);
                    if (idx !== -1) handTiles.splice(idx, 1);
                });
                // Note: We don't re-check byValue for same value, assuming greedy take best.
            }
        }

        // 2. Look for Runs (in remaining hand)
        const byColor = new Map<string, Tile[]>();
        handTiles.filter(t => !t.isJoker).forEach(t => {
            if (!byColor.has(t.color)) byColor.set(t.color, []);
            byColor.get(t.color)!.push(t);
        });

        for (const candidates of byColor.values()) {
            // Sort by value
            candidates.sort((a, b) => a.value - b.value);

            let currentRun: Tile[] = [];
            for (let i = 0; i < candidates.length; i++) {
                const t = candidates[i];
                if (currentRun.length === 0) {
                    currentRun.push(t);
                } else {
                    const last = currentRun[currentRun.length - 1];
                    if (t.value === last.value + 1) {
                        currentRun.push(t);
                    } else if (t.value === last.value) {
                        // Duplicate, ignore
                    } else {
                        // Gap
                        if (currentRun.length >= 3) {
                            currentPool.push(...currentRun);
                            tilesPlayedRound.push(...currentRun);
                            currentRun.forEach(used => {
                                const idx = handTiles.findIndex(h => h.id === used.id);
                                if (idx !== -1) handTiles.splice(idx, 1);
                            });
                        }
                        currentRun = [t];
                    }
                }
            }
            // End flush
            if (currentRun.length >= 3) {
                currentPool.push(...currentRun);
                tilesPlayedRound.push(...currentRun);
                currentRun.forEach(used => {
                    const idx = handTiles.findIndex(h => h.id === used.id);
                    if (idx !== -1) handTiles.splice(idx, 1);
                });
            }
        }

        // --- Phase B: Solver Backfill ---
        // Try to add remaining hand tiles one by one to the currentPool.
        // This allows extending the melds we just found, OR manipulating the existing board (if !initial).
        // Since currentPool is already valid (composed of valid board + valid Phase A melds),
        // we are monotonically increasing value.

        // Optimization: Sort remaining by value/color? 
        // Let's just iterate.
        // If Initial Meld, currentPool has the Phase A melds.
        // If Normal Turn, currentPool has Board + Phase A melds.

        // We calculate 'base solution' first to ensure our starting point is valid?
        // Phase A found valid independent sets. Original Board is valid.
        // So union is valid.

        let validSolution: Meld[] | null = null;

        // Should we re-verify the pool? Yes, to get the Meld objects.
        // If Phase A added tiles, we need to know the Melds structure?
        // Actually Solver will solve the whole pool.
        // But Solver expects to use ALL tiles.
        // If currentPool has disjoint sets, Solver should find them.

        // Check baseline validity (if we added anything or if board exists)
        if (currentPool.length > 0) {
            validSolution = Solver.solve([...currentPool]);
            // If this fails, our Phase A logic was buggy or Board was invalid.
            // Assume valid for now.
            if (!validSolution) {
                // Fallback: This shouldn't happen if Phase A is correct.
                // But if it does, it means Phase A constructed bad melds? 
                // Or we hit a complexity limit? 
                // Let's assume we proceed only if valid.
                // If invalid, we roll back Phase A? 
                // For safety: if (!validSolution) reset to originalBoard?
                // Let's ignore this edge case for "Simple" greedy.
            }
        }

        // Incremental add
        const looseTiles = [...handTiles]; // handTiles is now reduced

        for (const t of looseTiles) {
            const testPool = [...currentPool, t];
            const sol = Solver.solve(testPool);

            if (sol) {
                // Success
                currentPool.push(t);
                tilesPlayedRound.push(t);
                validSolution = sol;
                // Don't remove from looseTiles loop, just ignore.
            }
        }

        // --- Phase C: Final Validation & Submission ---

        if (tilesPlayedRound.length > 0 && validSolution) {

            // Check Initial Meld Rule Check
            if (!this.hasCompletedInitialMeld) {
                const points = tilesPlayedRound.reduce((sum, t) => sum + (t.isJoker ? 0 : t.value), 0);
                if (points < 30) {
                    // console.log(`[Greedy] Found melds (${points} pts) but < 30. Holding.`);
                    return { action: 'DRAW' };
                }
            }

            const newBoard = new Board();
            newBoard.melds = validSolution;

            return { action: 'PLAY', newBoard, tilesPlayed: tilesPlayedRound };
        }

        return { action: 'DRAW' };
    }
}
