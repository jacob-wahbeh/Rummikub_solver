import React from 'react';
import { Player } from '../core/Player';
import { TileComponent } from './TileComponent';
import { Tile } from '../core/Tile';
import { TileColor } from '../core/types';

interface HandProps {
    player: Player;
    isActive: boolean;
    selectedTileIds?: Set<string>;
    onTileClick?: (tile: Tile) => void;
    interactable?: boolean;
    newTileIds?: Set<string>;
}

// Color order for grid display
const COLOR_ORDER: TileColor[] = [TileColor.BLACK, TileColor.RED, TileColor.ORANGE, TileColor.BLUE];
const COLOR_LABELS: Record<TileColor, string> = {
    [TileColor.BLACK]: 'Black',
    [TileColor.RED]: 'Red',
    [TileColor.ORANGE]: 'Orange',
    [TileColor.BLUE]: 'Blue',
    [TileColor.JOKER]: 'Joker',
};

export const HandComponent: React.FC<HandProps> = ({ player, isActive, selectedTileIds, onTileClick, interactable, newTileIds }) => {
    // Group tiles by color
    const tilesByColor: Record<TileColor, Tile[]> = {
        [TileColor.BLACK]: [],
        [TileColor.RED]: [],
        [TileColor.ORANGE]: [],
        [TileColor.BLUE]: [],
        [TileColor.JOKER]: [],
    };

    // Separate jokers
    const jokers: Tile[] = [];

    for (const tile of player.hand) {
        if (tile.isJoker) {
            jokers.push(tile);
        } else {
            tilesByColor[tile.color].push(tile);
        }
    }

    // Sort each color group by value
    for (const color of COLOR_ORDER) {
        tilesByColor[color].sort((a, b) => a.value - b.value);
    }

    return (
        <div className="player-area" style={{ border: isActive ? '3px solid #e74c3c' : '3px solid transparent' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>
                {player.name} {isActive ? '(Current Turn)' : ''}
                <span style={{ fontSize: '0.8em', fontWeight: 'normal', marginLeft: '10px' }}>
                    Tiles: {player.hand.length} | Initial Meld: {player.hasCompletedInitialMeld ? '✓' : '✗'}
                </span>
            </h4>

            <div className="hand-grid">
                {COLOR_ORDER.map(color => {
                    const tiles = tilesByColor[color];
                    if (tiles.length === 0) return null;

                    return (
                        <div key={color} className="hand-row">
                            <div className={`row-label color-${color}`}>{COLOR_LABELS[color]}</div>
                            <div className="row-tiles">
                                {tiles.map((tile) => (
                                    <TileComponent
                                        key={tile.id}
                                        tile={tile}
                                        selected={selectedTileIds?.has(tile.id)}
                                        onClick={interactable ? onTileClick : undefined}
                                        isNew={newTileIds?.has(tile.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}

                {/* Jokers row */}
                {jokers.length > 0 && (
                    <div className="hand-row">
                        <div className="row-label" style={{ color: '#9b59b6' }}>Jokers</div>
                        <div className="row-tiles">
                            {jokers.map((tile) => (
                                <TileComponent
                                    key={tile.id}
                                    tile={tile}
                                    selected={selectedTileIds?.has(tile.id)}
                                    onClick={interactable ? onTileClick : undefined}
                                    isNew={newTileIds?.has(tile.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
