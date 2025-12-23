import React from 'react';
import { Board } from '../core/Board';
import { MeldComponent } from './MeldComponent';
import { Tile } from '../core/Tile';

interface BoardProps {
    board: Board;
    selectedTileIds?: Set<string>;
    onTileClick?: (tile: Tile) => void;
    interactable?: boolean;
}

export const BoardComponent: React.FC<BoardProps> = ({ board, selectedTileIds, onTileClick, interactable }) => {
    return (
        <div className="board-area">
            <h3>Table</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {board.melds.map((meld, index) => (
                    <MeldComponent
                        key={index}
                        meld={meld}
                        selectedTileIds={selectedTileIds}
                        onTileClick={onTileClick}
                        interactable={interactable}
                    />
                ))}
            </div>
            {board.melds.length === 0 && <div style={{ color: '#95a5a6' }}>Empty Table</div>}
        </div>
    );
};
