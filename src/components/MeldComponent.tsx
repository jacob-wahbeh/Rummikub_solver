import React from 'react';
import { Meld } from '../core/Meld';
import { TileComponent } from './TileComponent';

interface MeldProps {
    meld: Meld;
}

export const MeldComponent: React.FC<MeldProps> = ({ meld }) => {
    return (
        <div className="meld">
            {meld.getTiles().map((tile) => (
                <TileComponent key={tile.id} tile={tile} />
            ))}
        </div>
    );
};
