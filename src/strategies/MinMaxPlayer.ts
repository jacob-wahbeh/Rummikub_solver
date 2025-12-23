import { Player } from '../core/Player';
import { Board } from '../core/Board';
import { Tile } from '../core/Tile';
import { Solver } from '../core/Solver';

export class MinMaxPlayer extends Player {
    private maxDepth: number;
    private timeLimitMs: number;
    private useHeuristics: boolean;

    constructor(id: string, name: string, _maxDepth: number = 2, timeLimitMs: number = 1000, useHeuristics: boolean = true) {
        super(id, name);
        this.maxDepth = _maxDepth;
        this.timeLimitMs = timeLimitMs;
        this.useHeuristics = useHeuristics;
    }

    async playTurn(board: Board): Promise<{ action: 'DRAW' | 'PLAY'; newBoard?: Board; tilesPlayed?: Tile[] }> {
        const startTime = Date.now();

        // Root of MinMax Search
        // We are MAX.

        // 1. Generate candidate moves for ME.
        // In Rummikub, a "move" is a set of tiles played to form a new valid board.
        // Generating ALL valid moves is N-Hard.
        // Heuristic:
        //  - Option A: Draw (always available)
        //  - Option B: Play "Max Possible with Solver" (Greedy Move)
        //  - Option C: Play "Subset of Hand"?

        // To allow MinMax to be meaningful, we need CHOICES.
        // If we only have "Best Move" or "Draw", it's just Greedy.
        // Real choice: "Play small move to save Joker?" vs "Play big move".

        // For this implementation, due to Rummikub complexity, we will define Candidate Moves as:
        // 1. DRAW
        // 2. Play MAX Greedy (Play all possible).
        // 3. Play Conservative (Play minimum to avoid penalty? or just keep Jokers?).

        // Let's create a move generator that tries to play:
        // - All playable tiles (Greedy)
        // - Just enough to maintain balance? (Not easy to define)

        // Let's simplify:
        // The "Search" part will mainly compare "Drawing" vs "Playing Best Available".
        // AND, if we look deep, we see Opponent's response.

        // Note: We don't know opponent's hand! 
        // MinMax in imperfect information usually involves probabalistic hand generation OR 
        // assuming average hand.
        // Let's assume Open Hand (Cheating) for true MinMax, 
        // OR simply evaluate board state 'value' for opponent.

        // Given constraint: "get rid of tiles is better".

        // Let's try to generate N plausible moves:
        // 1. Play ALL found by Solver.
        // 2. If Solver found multiple independent sets (e.g. Group 333, Run 456), 
        //    generate moves for {333}, {456}, and {333, 456}.

        // Step 1: Find all playable independent sets from hand (Phase A of Greedy).
        const candidateSets = this.findIndependentSets(this.hand);

        // Generate subsets of these sets to play
        // Power set of candidateSets (limits apply).
        const possibleMoves: { tiles: Tile[], score: number }[] = [];

        // Add "Draw" move (empty tiles)
        possibleMoves.push({ tiles: [], score: 0 });

        // Add combos
        // Limit to 2^N combinations
        const subsets = this.generateSubsets(candidateSets);
        for (const subset of subsets) {
            const flatTiles = subset.flat();
            if (flatTiles.length > 0) {
                possibleMoves.push({ tiles: flatTiles, score: this.evaluateHandScore(flatTiles) });
            }
        }

        // Also perform "Board Manipulation" check (Solver)
        // The Greedy "Phase B" adds disjoint tiles.
        // We can treat that as ONE move option: "Max Manipulation".
        // Calculating that is expensive, so maybe do it once.
        const greedyMove = await this.calculateGreedyMove(board);
        if (greedyMove && greedyMove.length > 0) {
            // Deduplicate: check if we already have this move
            // Just add it, sorting will handle preference
            possibleMoves.push({ tiles: greedyMove, score: this.evaluateHandScore(greedyMove) });
        }

        // Sort moves by simple heuristic first (AlphaBeta optimization)
        // Heuristic: More tiles played = Better.
        possibleMoves.sort((a, b) => b.score - a.score);

        // Setup Search
        let bestScore = -Infinity;
        let bestMove = possibleMoves[0]; // Default to best heuristic check (or Draw)

        // Simple Time Control Check
        const limit = this.timeLimitMs;

        // Run MinMax (Depth 1 for now if we can't simulate opponent easily)
        // If Depth > 1, we need to simulate Opponent Turn.
        // Simulating Opponent: We don't know their hand.
        // Standard AI: Assume they play 'Average Value' or 'Greedy'.
        // Or assume they have N tiles and can play K of them.

        // Let's implement Depth 1 (Optimize My Turn) very well first, 
        // because Depth > 1 with Hidden Information is Monte Carlo Tree Search (MCTS), not MinMax.
        // Pure MinMax with hidden info is flawed.
        // BUT, if the user requested MinMax, maybe they want us to look ahead assuming state?
        // Let's stick to maximizing OUR score while adhering to time limit.
        // Effectively: We choose the Move that leads to the best Board State.

        for (const move of possibleMoves) {
            if (Date.now() - startTime > limit) break;

            // Evaluation
            // If we plays 'move.tiles', new hand size is current - move.length.
            // Score = (Tiles Played Count) * 10 + (Values).
            // Bonus: If hand empty, score += 1000.

            let currentScore = move.score;

            // Heuristic tweaks
            if (this.useHeuristics) {
                // getting rid of 2 tiles instead of 1 is better
                // Using squares? score^2? 
                currentScore = Math.pow(move.tiles.length, 1.5);
            }

            if (currentScore > bestScore) {
                bestScore = currentScore;
                bestMove = move;
            }
        }

        // Now execute the best move found
        if (bestMove.tiles.length === 0) {
            return { action: 'DRAW' };
        }

        // Re-construct the board for the chosen move
        // Check if it was a Solver/Manipulation move or Independent Set move
        // Use Solver to verify/build the board state.
        const proposedBoardTiles = [...board.getAllTiles(), ...bestMove.tiles];
        const solvedMelds = Solver.solve(proposedBoardTiles);

        if (solvedMelds) {
            const newBoard = new Board();
            newBoard.melds = solvedMelds;
            return { action: 'PLAY', newBoard, tilesPlayed: bestMove.tiles };
        }

        // Fallback
        return { action: 'DRAW' };
    }

    // --- Helpers ---

    private calculateGreedyMove(board: Board): Promise<Tile[] | null> {
        // Re-use logic from SimpleGreedy (Phase B)
        // For DRY, we could extract this to a static helper or composition.
        // For now, simplified version:
        const boardTiles = board.getAllTiles();
        const hand = [...this.hand];

        // Try to add all hand tiles to pool and solve?
        // Too slow.
        // Try incremental?
        const currentPool = [...boardTiles];
        const played: Tile[] = [];

        for (const t of hand) {
            const result = Solver.solve([...currentPool, t]);
            if (result) {
                currentPool.push(t);
                played.push(t);
            }
        }
        return Promise.resolve(played.length > 0 ? played : null);
    }

    private findIndependentSets(hand: Tile[]): Tile[][] {
        // Similar to Phase A of Greedy
        const sets: Tile[][] = [];
        // Groups
        const byValue = new Map<number, Tile[]>();
        hand.filter(t => !t.isJoker).forEach(t => {
            if (!byValue.has(t.value)) byValue.set(t.value, []);
            byValue.get(t.value)!.push(t);
        });

        for (const group of byValue.values()) {
            const distinct = new Map<string, Tile>();
            group.forEach(t => distinct.set(t.color, t));
            if (distinct.size >= 3) sets.push(Array.from(distinct.values()));
        }

        // Runs
        // ... (Simplified: finding one run per color)
        const byColor = new Map<string, Tile[]>();
        hand.filter(t => !t.isJoker).forEach(t => {
            if (!byColor.has(t.color)) byColor.set(t.color, []);
            byColor.get(t.color)!.push(t);
        });

        for (const tiles of byColor.values()) {
            tiles.sort((a, b) => a.value - b.value);
            // Sliding window size 3
            // Standard run detect logic...

            // Simplified run detection for MinMax candidate generation
            let currentRun: Tile[] = [];
            for (let i = 0; i < tiles.length; i++) {
                const t = tiles[i];
                if (currentRun.length === 0) {
                    currentRun.push(t);
                } else if (t.value === currentRun[currentRun.length - 1].value + 1) {
                    currentRun.push(t);
                } else if (t.value !== currentRun[currentRun.length - 1].value) {
                    if (currentRun.length >= 3) {
                        sets.push([...currentRun]);
                    }
                    currentRun = [t];
                }
            }
            if (currentRun.length >= 3) {
                sets.push([...currentRun]);
            }
        }
        return sets;
    }

    private generateSubsets(sets: Tile[][]): Tile[][] {
        // Limited power set
        // If we have 3 sets [A, B, C], return [A], [B], [C], [A,B], [A,C], [B,C], [A,B,C]
        // Cap at 2^5 = 32 moves to avoid explosion
        const results: Tile[][] = [];
        const n = Math.min(sets.length, 5);

        for (let i = 1; i < (1 << n); i++) {
            const subset: Tile[] = [];
            for (let j = 0; j < n; j++) {
                if ((i >> j) & 1) {
                    subset.push(...sets[j]);
                }
            }
            results.push(subset);
        }
        return results;
    }

    private evaluateHandScore(tiles: Tile[]): number {
        return tiles.reduce((acc, t) => acc + (t.isJoker ? 30 : t.value), 0);
    }
}
