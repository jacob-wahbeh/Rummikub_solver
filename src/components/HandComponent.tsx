import React from 'react';
import { Player } from '../core/Player';
import { TileComponent } from './TileComponent';

interface HandProps {
    player: Player;
    isActive: boolean;
}

export const HandComponent: React.FC<HandProps> = ({ player, isActive }) => {
    // Sort hand for better visibility: By Color then Value
    // Note: This sorts purely for display, doesn't affect internal logic
    const sortedHand = [...player.hand].sort((a, b) => {
        if (a.color !== b.color) return a.color.localeCompare(b.color);
        return a.value - b.value;
    });

    return (
        <div className="player-area" style={{ border: isActive ? '2px solid #e74c3c' : '2px solid transparent' }}>
            <h4>
                {player.name} {isActive ? '(Current Turn)' : ''}
                <span style={{ fontSize: '0.8em', fontWeight: 'normal', marginLeft: '10px' }}>
                    Tiles: {player.hand.length} | Initial Meld: {player.hasCompletedInitialMeld ? '✓' : '✗'}
                </span>
            </h4>
            <div className="player-hand">
                {sortedHand.map((tile) => (
                    <TileComponent key={tile.id} tile={tile} />
                ))}
            </div>
        </div>
    );
};
