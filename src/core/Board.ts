import { Meld } from './Meld';


export class Board {
    public melds: Meld[];

    constructor(melds: Meld[] = []) {
        this.melds = melds.map(m => new Meld(m.getTiles())); // Deepish copy
    }

    // Snapshot for restoring state if turn is invalid
    clone(): Board {
        return new Board(this.melds);
    }

    addMeld(meld: Meld): void {
        this.melds.push(meld);
    }

    // Returns true if all melds on the board are valid
    isValid(): boolean {
        return this.melds.every(m => m.validate());
    }

    // Helper to get all tiles
    getAllTiles(): import('./Tile').Tile[] {
        return this.melds.flatMap(m => m.getTiles());
    }

    // Get total point value of tiles on board (not usually needed for gameplay, but maybe for stats)
    getTotalValue(): number {
        return 0; // TODO if needed
    }
}
