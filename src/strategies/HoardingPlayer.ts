import { Board } from '../core/Board';
import { Tile } from '../core/Tile';
import { SimpleGreedyPlayer } from './SimpleGreedyPlayer';

export class HoardingPlayer extends SimpleGreedyPlayer {
    private threshold: number;

    constructor(id: string, name: string, threshold: number = 20) {
        super(id, name);
        this.threshold = threshold;
    }

    async playTurn(board: Board): Promise<{ action: 'DRAW' | 'PLAY'; newBoard?: Board; tilesPlayed?: Tile[] }> {
        // 1. Check if we can win immediately (Greedy check returns empty hand roughly?)
        //    Actually SimpleGreedy doesn't optimize for win, it just plays available.
        //    We can run the greedy logic to see what it Would play.

        const greedyMove = await super.playTurn(board);

        if (greedyMove.action === 'DRAW') {
            return { action: 'DRAW' };
        }

        if (greedyMove.action === 'PLAY' && greedyMove.tilesPlayed) {
            // Check if this move wins the game
            if (this.hand.length === greedyMove.tilesPlayed.length) {
                return greedyMove;
            }

            // Check if we haven't done initial meld
            if (!this.hasCompletedInitialMeld) {
                // We must play if we can to get started, or maybe hoard even longer?
                // Unlocking is good. Let's play if we can unlock.
                // But wait, if we unlock, we might lose tiles we wanted to hoard?
                // Let's stick to: Always unlock if possible.
                return greedyMove;
            }

            // Hoarding Logic:
            // If we have fewer tiles than threshold, prefer to DRAW instead of playing partial melds.
            if (this.hand.length < this.threshold) {
                return { action: 'DRAW' };
            }

            // Otherwise play regularly
            return greedyMove;
        }

        return { action: 'DRAW' };
    }
}
