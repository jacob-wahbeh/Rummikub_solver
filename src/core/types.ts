export type TileColor = 'Black' | 'Red' | 'Blue' | 'Orange' | 'Joker';
export const TileColor = {
    BLACK: 'Black' as TileColor,
    RED: 'Red' as TileColor,
    BLUE: 'Blue' as TileColor,
    ORANGE: 'Orange' as TileColor,
    JOKER: 'Joker' as TileColor
};

export type TileType = 'Number' | 'Joker';
export const TileType = {
    NUMBER: 'Number' as TileType,
    JOKER: 'Joker' as TileType
};

export interface ITile {
    id: string; // Unique identifier for React keys
    type: TileType;
    color: TileColor;
    value: number; // 1-13 for numbers, maybe 0, 25 or 99 for Joker
    isJoker: boolean;
}
