import { Tile } from './Tile';
import { TileColor } from './types.ts';

export type MeldType = 'Group' | 'Run' | 'Invalid';
export const MeldType = {
    GROUP: 'Group' as MeldType,
    RUN: 'Run' as MeldType,
    INVALID: 'Invalid' as MeldType
};

export class Meld {
    private tiles: Tile[];

    constructor(tiles: Tile[] = []) {
        this.tiles = [...tiles];
    }

    getTiles(): Tile[] {
        return [...this.tiles];
    }

    addTile(tile: Tile): void {
        this.tiles.push(tile);
        // Sort runs automatically? Maybe not, usually board state is ordered by user or auto-sort.
        // For validation, we should sort internally.
    }

    removeTile(tileId: string): Tile | undefined {
        const index = this.tiles.findIndex(t => t.id === tileId);
        if (index !== -1) {
            return this.tiles.splice(index, 1)[0];
        }
        return undefined;
    }

    validate(): boolean {
        if (this.tiles.length < 3) return false;

        // Check if it's a valid Group
        if (this.isValidGroup()) return true;

        // Check if it's a valid Run
        if (this.isValidRun()) return true;

        return false;
    }

    determineType(): MeldType {
        if (this.tiles.length < 3) return MeldType.INVALID;
        if (this.isValidGroup()) return MeldType.GROUP;
        if (this.isValidRun()) return MeldType.RUN;
        return MeldType.INVALID;
    }

    private isValidGroup(): boolean {
        if (this.tiles.length > 4) return false;

        const nonJokers = this.tiles.filter(t => !t.isJoker);
        if (nonJokers.length === 0) return true; // 3 or 4 Jokers is valid (technically a group or run)

        const baseValue = nonJokers[0].value;
        const colors = new Set<TileColor>();

        for (const tile of nonJokers) {
            if (tile.value !== baseValue) return false;
            if (colors.has(tile.color)) return false; // Duplicate colors in group not allowed
            colors.add(tile.color);
        }

        return true;
    }

    private isValidRun(): boolean {
        // 1. Check colors (must be same for all non-jokers)
        const nonJokers = this.tiles.filter(t => !t.isJoker);
        if (nonJokers.length === 0) return true; // All jokers is a valid run

        const runColor = nonJokers[0].color;
        for (const tile of nonJokers) {
            if (tile.color !== runColor) return false;
        }

        // 2. Sort current tiles by value to check sequence
        // Note: This naive sort puts Jokers at the end or beginning depending on value.
        // We need to structurally check if Jokers can fill the gaps.
        // Easier approach: Sort non-jokers. Calculate needed gaps. Check if we have enough jokers.

        // Sort non-jokers ascending
        const sortedNonJokers = [...nonJokers].sort((a, b) => a.value - b.value);

        let jokersAvailable = this.tiles.filter(t => t.isJoker).length;

        // Check gaps between non-jokers
        for (let i = 0; i < sortedNonJokers.length - 1; i++) {
            const current = sortedNonJokers[i];
            const next = sortedNonJokers[i + 1];

            const gap = next.value - current.value - 1;

            if (gap < 0) return false; // Should not happen if sorted and distinct? actually duplicates are impossible in a valid run
            if (gap === -1) return false; // Duplicate number in run

            if (gap > 0) {
                if (jokersAvailable >= gap) {
                    jokersAvailable -= gap;
                } else {
                    return false; // Not enough jokers to bridge the gap
                }
            }
        }

        // Remaining jokers can go at start or end.
        // But we must check if the run exceeds bounds (1-13).
        // The sequence spans from (FirstVal - JokersBefore) to (LastVal + JokersAfter).
        // Min possible start is 1, Max possible end is 13.
        // The range covered by non-jokers is [minVal, maxVal].
        // Count of tiles = (maxVal - minVal + 1) + (jokers used for gaps) + (jokers remaining).
        // Actually, simple size check:
        // Virtual Run Length = maxVal - minVal + 1 + (gaps filled by jokers? No, gaps are part of usage).
        // Users provided tiles. We physically have N tiles.
        // If we formed a contiguous sequence, it covers a range of size N.
        // Is there a valid start point such that start >= 1 AND start + N - 1 <= 13?

        // Let's re-evaluate.
        // We have verified the *internal* structure is consistent (gaps filled).
        // Now we essentially have a block of verified relative positions.
        // e.g. [4] [J] [6] -> capable of being 4,5,6.
        // We have `jokersAvailable` left over.
        // Can we append/prepend them without breaking limits?

        const minVal = sortedNonJokers[0].value;
        const maxVal = sortedNonJokers[sortedNonJokers.length - 1].value;

        // Current "skeleton" spans from minVal to maxVal.
        // Required specific count of numbers in that range is (maxVal - minVal + 1).
        // We have sortedNonJokers.length.
        // Jokers used inside = (maxVal - minVal + 1) - sortedNonJokers.length.
        // This matches the loop logic above.

        // So we have a valid contiguous block from minVal to maxVal.
        // We have `jokersAvailable` remaining to extend left or right.

        // Max extention left = minVal - 1.
        // Max extention right = 13 - maxVal.

        // If jokersAvailable <= (minVal - 1) + (13 - maxVal), then it's valid.
        // Because we can distribute them.

        if (jokersAvailable <= (minVal - 1) + (13 - maxVal)) {
            return true;
        }

        return false;
    }
}
