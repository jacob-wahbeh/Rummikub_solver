import React from 'react';
import { Tile } from '../core/Tile';

interface TileProps {
    tile: Tile;
}

export const TileComponent: React.FC<TileProps> = ({ tile }) => {
    return (
        <div className={`tile color-${tile.color} ${tile.isJoker ? 'joker' : ''}`}>
            {tile.isJoker ? '☺' : tile.value}
            <div style={{ fontSize: '10px', marginTop: '-5px' }}>{tile.isJoker ? 'Joker' : ''}</div>
        </div>
    );
};
