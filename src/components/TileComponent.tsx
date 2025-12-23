import React from 'react';
import { Tile } from '../core/Tile';

interface TileProps {
    tile: Tile;
    selected?: boolean;
    onClick?: (tile: Tile) => void;
    disabled?: boolean;
    isNew?: boolean;
}

export const TileComponent: React.FC<TileProps> = ({ tile, selected, onClick, disabled, isNew }) => {
    const handleClick = () => {
        if (!disabled && onClick) {
            onClick(tile);
        }
    };

    const classNames = [
        'tile',
        `color-${tile.color}`,
        tile.isJoker ? 'joker' : '',
        selected ? 'selected' : '',
        onClick && !disabled ? 'clickable' : '',
        isNew ? 'new-tile' : ''
    ].filter(Boolean).join(' ');

    return (
        <div
            className={classNames}
            onClick={handleClick}
        >
            {tile.isJoker ? '☺' : tile.value}
            <div style={{ fontSize: '10px', marginTop: '-5px' }}>{tile.isJoker ? 'Joker' : ''}</div>
        </div>
    );
};
