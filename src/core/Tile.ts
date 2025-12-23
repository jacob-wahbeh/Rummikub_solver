import { type ITile, TileColor, TileType } from './types.ts';
import { v4 as uuidv4 } from 'uuid';

export class Tile implements ITile {
    public readonly id: string;
    public readonly type: TileType;
    public readonly color: TileColor;
    public readonly value: number;

    constructor(color: TileColor, value: number, isJoker: boolean = false) {
        this.id = uuidv4();
        this.color = color;
        this.value = value;
        this.type = isJoker ? TileType.JOKER : TileType.NUMBER;
    }

    get isJoker(): boolean {
        return this.type === TileType.JOKER;
    }

    // Helper to visually represent the tile
    toString(): string {
        if (this.isJoker) return 'Joker';
        return `${this.color} ${this.value}`;
    }

    clone(): Tile {
        const newTile = new Tile(this.color, this.value, this.isJoker);
        // Determine if we need to preserve ID or new ID.
        // For simulation logic (state copying), we might want to keep ID strict or track it.
        // But usually clones in AI search might imply deep copies of state.
        // Let's keep a new ID for now to avoid React duplicate key issues if both exist,
        // unless we are specifically creating a snapshot of the same tile.
        return newTile;
    }

    // Method to check equality (value wise)
    equals(other: Tile): boolean {
        if (this.isJoker && other.isJoker) return true;
        return this.color === other.color && this.value === other.value;
    }
}
