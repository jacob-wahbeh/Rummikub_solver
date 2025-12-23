import { Board } from './Board';
import { Player } from './Player';
import { Tile } from './Tile';
import { TileColor } from './types.ts';

export class Game {
    public players: Player[];
    public board: Board;
    public deck: Tile[];
    public currentPlayerIndex: number;
    public isGameOver: boolean;
    public winner: Player | null;

    constructor(players: Player[]) {
        this.players = players;
        this.board = new Board();
        this.deck = this.initializeDeck();
        this.currentPlayerIndex = 0;
        this.isGameOver = false;
        this.winner = null;
    }

    private initializeDeck(): Tile[] {
        const deck: Tile[] = [];
        const colors = [TileColor.BLACK, TileColor.RED, TileColor.BLUE, TileColor.ORANGE];

        // 2 sets of 1-13 for each color
        for (const color of colors) {
            for (let i = 1; i <= 13; i++) {
                deck.push(new Tile(color, i));
                deck.push(new Tile(color, i));
            }
        }

        // 2 Jokers
        deck.push(new Tile(TileColor.BLACK, 0, true)); // Color doesn't matter for Joker usually, but we need one
        deck.push(new Tile(TileColor.RED, 0, true));   // Visual distinction maybe?

        return this.shuffle(deck);
    }

    private shuffle(deck: Tile[]): Tile[] {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    public start(): void {
        // Deal 14 tiles to each player
        for (const player of this.players) {
            const hand = this.drawTiles(14);
            player.addTiles(hand);
        }
        this.currentPlayerIndex = 0;
        this.isGameOver = false;
    }

    private drawTiles(count: number): Tile[] {
        const drawn: Tile[] = [];
        for (let i = 0; i < count; i++) {
            if (this.deck.length > 0) {
                drawn.push(this.deck.pop()!);
            }
        }
        return drawn;
    }

    public async playNextTurn(): Promise<void> {
        if (this.isGameOver) return;

        const player = this.players[this.currentPlayerIndex];

        // Ask player for their move
        // We clone the board so they can't mutate the real game state directly without return
        const boardSnapshot = this.board.clone();

        const result = await player.playTurn(boardSnapshot);

        if (result.action === 'DRAW') {
            const drawn = this.drawTiles(1);
            player.addTiles(drawn);
            // console.log(`${player.name} drew a tile.`);
        } else if (result.action === 'PLAY' && result.newBoard) {
            // Validate the move
            if (this.validateMove(player, this.board, result.newBoard, result.tilesPlayed || [])) {
                // Commit changes
                this.board = result.newBoard;

                // Remove played tiles from player hand
                // (We assume result.tilesPlayed gives us the specific IDs to remove)
                if (result.tilesPlayed) {
                    for (const t of result.tilesPlayed) {
                        player.removeTile(t.id);
                    }
                }

                // Check Win Condition
                if (player.hand.length === 0) {
                    this.isGameOver = true;
                    this.winner = player;
                    // console.log(`${player.name} wins!`);
                }

            } else {
                // Invalid move penalty? usually draw 3 tiles.
                // For simulation, we might force a draw or disqualify.
                // Let's force a draw for now.
                // console.log(`${player.name} made an invalid move. Penalty: Draw 3.`);
                // In strict rules, if you manipulate board and can't finish, you take back tiles + penalty.
                // Here we assume strategy handles it or we revert.
                // Revert is implicit because we didn't assign `this.board = result.newBoard` yet.

                const penalty = this.drawTiles(3);
                player.addTiles(penalty);
            }
        }

        if (!this.isGameOver) {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        }
    }

    private validateMove(player: Player, _oldBoard: Board, newBoard: Board, tilesPlayed: Tile[]): boolean {
        // 1. Check if newBoard is valid
        if (!newBoard.isValid()) {
            // console.log(`[Validation] Board is invalid.`);
            return false;
        }

        // 2. Check if tilesPlayed are actually from player's hand
        // (This prevents using tiles that don't exist)
        for (const t of tilesPlayed) {
            if (!player.hand.some(h => h.id === t.id)) {
                // console.log(`[Validation] Played tile not in hand: ${t.id}`);
                return false; // Played a tile not in hand
            }
        }

        // 3. Initial Meld Rule
        if (!player.hasCompletedInitialMeld) {
            // Must calculate the value of the NEW melds or added tiles.
            // This is complex because they might manipulate existing melds.
            // Strict rule: "The first meld... must have a value of at least 30... tiles must come from your hand."
            // So we sum the value of `tilesPlayed` that ended up on the board? 
            // Or the value of the melds purely created?
            // Usually it's strictly the sum of values of the TILES FROM HAND used in the melds.

            // let initialMeldValue = 0;
            // for (const t of tilesPlayed) {
            //      initialMeldValue += t.value; 
            // }
            // Let's implement strict check later. For now, assume face value sum >= 30.
            // Or if we trust the `isValid()` of board, we just check point diff?

            // Actually, let's defer strict "Initial 30pt" logic to a TODO or simplified version.
            // Simplification: Check if the sum of values of tiles played >= 30.
            // Jokers count as 0 in this bad check.

            const playedValue = tilesPlayed.reduce((sum, t) => sum + (t.isJoker ? 0 : t.value), 0);
            if (playedValue < 30) {
                console.log(`[Validation] Initial meld value too low: ${playedValue} < 30`);
                return false;
            }

            // If successful, mark as completed
            player.hasCompletedInitialMeld = true;
        }

        // 4. Must have played at least one tile?
        // Actually, can you just rearrange? No, you must play from hand to end turn without drawing.
        if (tilesPlayed.length === 0) {
            console.log('Validation failed: No tiles played.');
            return false;
        }

        return true;
    }
}
