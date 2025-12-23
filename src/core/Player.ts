import { Tile } from './Tile';
import { Board } from './Board';

// Let's use an interface for gamestate/context to avoid tight coupling if possible,
// or just pass necessary data.

export interface GameStateView {
    board: Board;
    playersExcludingMe: number; // Count of other players, maybe public info about their hand size
}

export abstract class Player {
    public id: string;
    public name: string;
    public hand: Tile[];
    public hasCompletedInitialMeld: boolean;

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
        this.hand = [];
        this.hasCompletedInitialMeld = false;
    }

    addTiles(tiles: Tile[]): void {
        this.hand.push(...tiles);
    }

    removeTile(tileId: string): Tile | undefined {
        const index = this.hand.findIndex(t => t.id === tileId);
        if (index !== -1) {
            return this.hand.splice(index, 1)[0];
        }
        return undefined;
    }

    // Calculate sum of values of a set of tiles (for initial meld check)
    calculateMoveValue(tilesPlayedFromHand: Tile[]): number {
        // Note: This logic is tricky. In Rummikub, the point value of the initial meld
        // depends on the *result* on the board.
        // e.g. Joker takes value of replaced tile.

        // For the initial meld requirement (30 points), the points come from the specific TILES
        // played into NEW melds? or derived from the melds they create?
        // Rule: "The first meld made by each player... must have a value of at least 30 points."
        // It implies the value of the melds *placed*.

        let total = 0;
        for (const t of tilesPlayedFromHand) {
            // if Joker, it counts as the value of the tile it represents.
            // This calculation usually happens AFTER the move is validated on the board.
            // So the Game engine likely handles "Check if this move fulfilled initial meld".

            // For simple heuristic, we sum face value? No, joker is tricky. 
            // We'll leave exact logic to the Game engine or a helper.
            total += t.value;
        }
        return total;
    }

    // The core method strategies must implement.
    // It should probably return a "Action" object.
    // Action could be: Draw, or { modifiedBoard: Board, tilesUsedFromHand: Tile[] }
    // Since Rummikub turns can be complex manipulations, returning a completely new valid Board state
    // (plus evidence of tiles used) might be the easiest way to model "Make a Move".

    // Actually, to simulate step-by-step or "live", we might want granular actions.
    // But for "Determine Strategy", the AI usually computes the "Best Final State" for their turn.

    abstract playTurn(board: Board): Promise<{
        action: 'DRAW' | 'PLAY';
        newBoard?: Board; // If PLAY
        tilesPlayed?: Tile[]; // If PLAY, to verify they came from hand
    }>;
}
