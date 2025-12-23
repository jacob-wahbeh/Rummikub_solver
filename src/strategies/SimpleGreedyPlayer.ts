import { Player } from '../core/Player';
import { Board } from '../core/Board';
import { Tile } from '../core/Tile';
import { Meld } from '../core/Meld';


export class SimpleGreedyPlayer extends Player {

    async playTurn(board: Board): Promise<{ action: 'DRAW' | 'PLAY'; newBoard?: Board; tilesPlayed?: Tile[] }> {
        // 1. Try to find melds strictly within hand
        // Note: A real solver would be recursive backtracking to maximize tiles played.
        // Here we do a simple pass: Find groups, then runs.

        // Clone tiles to track what is used
        let remainingHand = [...this.hand];
        const meldsToPlay: Meld[] = [];

        // A. Find Groups (Same Value, Diff Color)
        // Group by value
        const byValue = new Map<number, Tile[]>();
        // Collect Jokers separate (unused for now in simple strategy)
        // const jokers = remainingHand.filter(t => t.isJoker);
        const nonJokers = remainingHand.filter(t => !t.isJoker);

        for (const t of nonJokers) {
            if (!byValue.has(t.value)) byValue.set(t.value, []);
            byValue.get(t.value)!.push(t);
        }

        // Attempt to make groups of 3 or 4
        for (const tiles of byValue.values()) {
            // Distinct colors?
            // Naive: just take one of each color found
            const distinctColorTiles: Tile[] = [];
            const seenColors = new Set<string>();
            for (const t of tiles) {
                if (!seenColors.has(t.color)) {
                    seenColors.add(t.color);
                    distinctColorTiles.push(t);
                }
            }

            if (distinctColorTiles.length >= 3) {
                // Found a group!
                const newMeld = new Meld(distinctColorTiles);
                if (newMeld.validate()) {
                    meldsToPlay.push(newMeld);
                    // Remove from remaining
                    for (const used of distinctColorTiles) {
                        const idx = remainingHand.findIndex(h => h.id === used.id);
                        if (idx !== -1) remainingHand.splice(idx, 1);
                    }
                    // Update indices in map? No, we are iterating values once.
                    // But if we use tile in Group, we can't use it in Run potentially.
                    // This is greedy, so it's fine.
                }
            }
        }

        // B. Find Runs (Same Color, Consecutive)
        // Regroup remaining
        const byColor = new Map<string, Tile[]>();
        const remainingNonJokers = remainingHand.filter(t => !t.isJoker);

        for (const t of remainingNonJokers) {
            if (!byColor.has(t.color)) byColor.set(t.color, []);
            byColor.get(t.color)!.push(t);
        }

        for (const tiles of byColor.values()) {
            // Sort
            tiles.sort((a, b) => a.value - b.value);

            // Find consecutive sequences of 3+
            let currentRun: Tile[] = [];
            for (let i = 0; i < tiles.length; i++) {
                const t = tiles[i];
                if (currentRun.length === 0) {
                    currentRun.push(t);
                } else {
                    const prev = currentRun[currentRun.length - 1];
                    if (t.value === prev.value + 1) {
                        currentRun.push(t);
                    } else if (t.value === prev.value) {
                        // Duplicate, ignore
                    } else {
                        // Gap, check if valid run
                        if (currentRun.length >= 3) {
                            meldsToPlay.push(new Meld([...currentRun]));
                            // Remove from remaining
                            for (const used of currentRun) {
                                const idx = remainingHand.findIndex(h => h.id === used.id);
                                if (idx !== -1) remainingHand.splice(idx, 1);
                            }
                        }
                        currentRun = [t];
                    }
                }
            }
            // End of list check
            if (currentRun.length >= 3) {
                meldsToPlay.push(new Meld([...currentRun]));
                for (const used of currentRun) {
                    const idx = remainingHand.findIndex(h => h.id === used.id);
                    if (idx !== -1) remainingHand.splice(idx, 1);
                }
            }
        }

        // TODO: Use Jokers? 
        // For now we ignored them in specific logic (except filtering them out).
        // Adding joker logic increases complexity significantly (where to put it?).
        // A simple greedy player might just hold jokers or use them to complete 2-tile pairs.

        if (meldsToPlay.length > 0) {
            // Construct new board
            const newBoard = board.clone();
            meldsToPlay.forEach(m => newBoard.addMeld(m));

            // Collect tiles played for verification
            const tilesPlayed: Tile[] = [];
            meldsToPlay.forEach(m => tilesPlayed.push(...m.getTiles()));

            // console.log(`[Strategy] Found ${meldsToPlay.length} melds to play. Total tiles: ${tilesPlayed.length}`);
            return { action: 'PLAY', newBoard, tilesPlayed };
        } else {
            // console.log('[Strategy] No melds found.');
        }

        return { action: 'DRAW' };
    }
}
