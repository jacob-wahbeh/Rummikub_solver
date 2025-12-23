import { Player } from './Player';
import { Board } from './Board';
import { Tile } from './Tile';
import { SimpleGreedyPlayer } from '../strategies/SimpleGreedyPlayer';

export type HumanAction =
    | { type: 'DRAW' }
    | { type: 'PLAY', newBoard: Board, tilesPlayed: Tile[] };

export class HumanPlayer extends Player {
    private resolveTurn: ((result: { action: 'DRAW' | 'PLAY', newBoard?: Board, tilesPlayed?: Tile[] }) => void) | null = null;

    constructor(id: string, name: string) {
        super(id, name);
    }

    public get isWaiting(): boolean {
        return this.resolveTurn !== null;
    }

    // The Game loop calls this. We return a promise that hangs until the UI calls one of our resolve methods.
    async playTurn(_board: Board): Promise<{
        action: 'DRAW' | 'PLAY';
        newBoard?: Board;
        tilesPlayed?: Tile[];
    }> {
        // eslint-disable-next-line
        console.log(`[HumanPlayer] It is ${this.name}'s turn. Waiting for UI input...`);

        return new Promise((resolve) => {
            this.resolveTurn = resolve;
        });
    }

    // UI calls this when user clicks "Draw"
    public performDraw() {
        if (this.resolveTurn) {
            this.resolveTurn({ action: 'DRAW' });
            this.resolveTurn = null;
        } else {
            console.warn("Attempted to performDraw but it's not my turn!");
        }
    }

    // UI calls this when user makes a move on the board
    public performPlay(newBoard: Board, tilesPlayed: Tile[]) {
        if (this.resolveTurn) {
            this.resolveTurn({ action: 'PLAY', newBoard, tilesPlayed });
            this.resolveTurn = null;
        } else {
            console.warn("Attempted to performPlay but it's not my turn!");
        }
    }

    // Helper: Auto-play using simple greedy strategy just for this turn
    // Useful for "Help me" button
    public async autoPlay(board: Board) {
        if (!this.resolveTurn) return;

        // Delegate to a temporary AI to find a move
        const bot = new SimpleGreedyPlayer(this.id, "BotHelper");
        bot.hand = [...this.hand];
        bot.hasCompletedInitialMeld = this.hasCompletedInitialMeld;

        const result = await bot.playTurn(board);

        if (this.resolveTurn) {
            this.resolveTurn(result);
            this.resolveTurn = null;
        }
    }
}
