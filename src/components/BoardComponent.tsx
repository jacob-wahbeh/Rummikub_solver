import React from 'react';
import { Board } from '../core/Board';
import { MeldComponent } from './MeldComponent';

interface BoardProps {
    board: Board;
}

export const BoardComponent: React.FC<BoardProps> = ({ board }) => {
    return (
        <div className="board-area">
            <h3>Table</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {board.melds.map((meld, index) => (
                    // Using index as key is risky if reordering happens, but melds usually stable-ish in this view
                    <MeldComponent key={index} meld={meld} />
                ))}
            </div>
            {board.melds.length === 0 && <div style={{ color: '#95a5a6' }}>Empty Table</div>}
        </div>
    );
};
