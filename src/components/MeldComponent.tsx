import React from 'react';
import { Meld } from '../core/Meld';
import { TileComponent } from './TileComponent';
import { Tile } from '../core/Tile';

interface MeldProps {
    meld: Meld;
    selectedTileIds?: Set<string>;
    onTileClick?: (tile: Tile) => void;
    interactable?: boolean;
}

export const MeldComponent: React.FC<MeldProps> = ({ meld, selectedTileIds, onTileClick, interactable }) => {
    return (
        <div className="meld">
            {meld.getTiles().map((tile) => (
                <TileComponent
                    key={tile.id}
                    tile={tile}
                    selected={selectedTileIds?.has(tile.id)}
                    onClick={interactable ? onTileClick : undefined}
                />
            ))}
        </div>
    );
};
