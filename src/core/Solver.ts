import { Tile } from './Tile';
import { Meld } from './Meld';


export class Solver {
    /**
     * Tries to find a solution (list of valid Melds) that uses ALL provided tiles.
     * Returns null if no such partition exists.
     */
    public static solve(tiles: Tile[]): Meld[] | null {
        // Optimization: Quick checks
        if (tiles.length === 0) return [];
        if (tiles.length < 3) return null; // Minimum meld size is 3

        // Sort tiles to make backtracking deterministic and efficient
        // Sort by Value then Color
        const sortedTiles = [...tiles].sort((a, b) => {
            if (a.value !== b.value) return a.value - b.value;
            // Place Jokers at the end/start? 
            // Actually, keep Jokers separate or treat them special?
            // Let's sort normally. Jokers have value? 
            // In Tile.ts value is number. Joker is usually high or 0?
            // Need to handle Joker placement logic carefully.
            // For now, let's assume standard sorting.
            if (a.isJoker) return 1;
            if (b.isJoker) return -1;
            return a.color.localeCompare(b.color);
        });

        return this.backtrack(sortedTiles);
    }

    private static backtrack(remainingTiles: Tile[]): Meld[] | null {
        if (remainingTiles.length === 0) {
            return []; // Solution found: 0 tiles left = empty list of melds
        }

        // Try to form a meld using the first tile
        const firstTile = remainingTiles[0];

        // 1. Try to form a Group (Same Value)
        // Groups can be length 3 or 4.
        const potentialGroups = this.findPotentialGroups(firstTile, remainingTiles);
        for (const group of potentialGroups) {
            if (group.validate()) {
                const solution = this.recurse(remainingTiles, group.getTiles());
                if (solution) return [group, ...solution];
            }
        }

        // 2. Try to form a Run (Same Color, Consecutive)
        // Runs can be length 3 to 13.
        const potentialRuns = this.findPotentialRuns(firstTile, remainingTiles);
        for (const run of potentialRuns) {
            if (run.validate()) {
                const solution = this.recurse(remainingTiles, run.getTiles());
                if (solution) return [run, ...solution];
            }
        }

        return null;
    }

    private static recurse(allTiles: Tile[], usedTiles: Tile[]): Meld[] | null {
        // Remove usedTiles from allTiles
        const remaining = [...allTiles];
        for (const used of usedTiles) {
            const idx = remaining.findIndex(t => t.id === used.id);
            if (idx === -1) {
                // Should not happen
                return null;
            }
            remaining.splice(idx, 1);
        }
        return this.backtrack(remaining);
    }

    private static findPotentialGroups(startTile: Tile, pool: Tile[]): Meld[] {
        // Find other tiles with same value
        // Note: Jokers can be anything.
        // A group needs 3 or 4 tiles. 
        // Different colors.

        const candidates = pool.filter(t => t.id !== startTile.id && (t.isJoker || t.value === startTile.value));
        const melds: Meld[] = [];

        // Combinations of 2 or 3 candidates + startTile
        // Simple approach: Since max group size is 4, we can iterate subsets locally.

        // This is simplified. We need strictly different colors (unless joker).

        // Let's try to assemble valid groups greedily or exhaustively for just this small set.
        // Actually, "candidates" might be large if we have many decks. standard is 2 decks (2 of each color-value).
        // But Rummikub rules say group must be DISTINCT colors.
        // So max group size is 4 (Red, Blue, Black, Orange).
        // We have startTile (e.g. Red 5).
        // We need 2 or 3 others from {Blue 5, Black 5, Orange 5, Joker}.

        // Helper to generate combinations
        const combinations = (arr: Tile[], k: number): Tile[][] => {
            if (k === 0) return [[]];
            if (arr.length === 0) return [];
            const [first, ...rest] = arr;
            const withFirst = combinations(rest, k - 1).map((c: Tile[]) => [first, ...c]);
            const withoutFirst = combinations(rest, k);
            return [...withFirst, ...withoutFirst];
        };

        // Try size 3 (start + 2 others)
        const size2 = combinations(candidates, 2);
        for (const combo of size2) {
            const m = new Meld([startTile, ...combo]);
            if (m.validate()) melds.push(m);
        }

        // Try size 4 (start + 3 others)
        const size3 = combinations(candidates, 3);
        for (const combo of size3) {
            const m = new Meld([startTile, ...combo]);
            if (m.validate()) melds.push(m);
        }

        return melds;
    }

    private static findPotentialRuns(startTile: Tile, pool: Tile[]): Meld[] {
        // Run: Same color, consecutive values.
        // StartTile is our seed.
        // Try to build runs starting at startTile, or where startTile is in the middle?
        // Backtracking optimization: We sorted tiles. 
        // If we always pick the first available tile, we usually pick the "lowest" value of a potential run.
        // So we mostly look for extensions (startTile + 1, + 2...).
        // BUT, what if startTile is '4', and we successfully skipped '3' earlier? 
        // If we strictly follow "pick first available", we are guaranteed that '3' was handled (either used or impossible).
        // So '4' must be the start of a run (4,5,6) or independent group.
        // Wait, startTile could be a Joker? 
        // If startTile is Joker, it could start a run? Joker is wild. 
        // Joker at start of sorted list? 
        // If we handled sorting correctly, Non-Jokers come first? Or Jokers first?
        // If Jokers come first, we might assign it to be "1".
        // Let's assume we handle Non-Jokers first if possible to reduce branching.

        const melds: Meld[] = [];
        const isJoker = startTile.isJoker;

        // If it's a joker, it can be theoretically anything. This explodes complexity.
        // Optimization: Don't start backtrack with Joker if possible?
        // Sort: Non-Jokers first. Jokers at end.
        // If we are forced to pick Joker as 'firstTile', it means ONLY Jokers are left.
        // If only Jokers left, and >= 3, valid run/group.

        if (isJoker) {
            // If we are here, likely only Jokers are left or we sorted vaguely.
            // If we have >=3 tiles and start is Joker, maybe check if they are ALL jokers?
            // Or try to attach joker to next non-joker?
            // Simplification: Try to find ANY 2 other tiles to make a set?
            // Realistically, if we sort Jokers LAST, we won't hit this until the end.
            return [];
        }

        // Standard Run Search (Ascending)
        // Since we process in order, we only look for startTile, startTile+1, startTile+2...
        // We need at least 2 more tiles.

        // Find candidates recursively?
        // Let's just iterate to find consecutive sequence.
        // This is greedy-ish but we iterate all valid lengths.

        // Candidates for next positions:
        // Value = startTile.value + 1, Color = same.
        // OR Joker.

        // Finding all valid runs starting with 'startTile'

        // Simplified approach for Runs in Backtracking:
        // 1. Filter pool for same color and Jokers.
        // 2. Try to build sequences 3..13.

        const sameColorOrJoker = pool.filter(t => t.id !== startTile.id && (t.isJoker || t.color === startTile.color));

        this.generateRunCombinations(startTile, sameColorOrJoker, [], melds);

        return melds;
    }

    // Recursive helper to build runs
    private static generateRunCombinations(currentTile: Tile, pool: Tile[], currentSequence: Tile[], results: Meld[], expectedNextVal: number = -1) {
        const seq = [...currentSequence, currentTile];

        // Calculate next expected value
        let currentVirtualValue = currentTile.isJoker ? expectedNextVal : currentTile.value;
        if (currentVirtualValue === -1) {
            // First tile is Joker? Assume it's start of run... value? 
            // Could be anything. We shouldn't start with Joker if possible. 
            // If we do, we might block this path or iterate all values.
            // Let's Ignore "Start with Joker" for now as per sort optimization.
            return;
        }

        // Validity check
        if (seq.length >= 3) {
            const m = new Meld([...seq]);
            // Re-validate strictly just in case
            if (m.validate()) results.push(m);
        }

        if (seq.length >= 13) return;

        const nextVal = currentVirtualValue + 1;
        if (nextVal > 13) return; // Rummikub max 13

        // Find candidates for nextVal
        const candidates = pool.filter(t => t.isJoker || t.value === nextVal);

        // We must select ONE candidate to continue the sequence.
        // We must try EACH candidate because ID matters for the remaining pool.

        // Optimization: If multiple candidates are identical (same value, same color, non-unique ID logic?), 
        // strictly speaking distinct IDs matter if they are needed elsewhere?
        // In Rummikub, two Red 5s are identical function-wise.
        // However, one might be "locked" if we were doing board manipulation of existing structures.
        // But here `pool` is just a pile of tiles.
        // So picking Red 5 (ID A) vs Red 5 (ID B) is isomorphic.
        // We can optimize: Group candidates by (isJoker, value). Pick one representative of each type.

        const seenTypes = new Set<string>();

        for (const cand of candidates) {
            const key = cand.isJoker ? 'J' : `${cand.value}`;
            if (seenTypes.has(key)) continue;
            seenTypes.add(key);

            // Recurse / Extend
            // Remove cand from pool
            const nextPool = pool.filter(p => p.id !== cand.id);
            this.generateRunCombinations(cand, nextPool, seq, results, nextVal);
        }
    }
}
