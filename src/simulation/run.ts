import { Game } from '../core/Game';
import { SimpleGreedyPlayer } from '../strategies/SimpleGreedyPlayer';

async function runSimulation() {
    console.log('Starting Rummikub Simulation...');

    // Create Players
    const p1 = new SimpleGreedyPlayer('p1', 'Alice');
    const p2 = new SimpleGreedyPlayer('p2', 'Bob');

    // Create Game
    const game = new Game([p1, p2]);

    console.log('Game initialized.');
    game.start();
    console.log('Game started.');

    let turn = 0;
    const MAX_TURNS = 100; // Safety limit for now

    while (!game.isGameOver && turn < MAX_TURNS) {
        if (turn % 10 === 0) console.log(`Turn ${turn}: P1(${p1.hand.length}) P2(${p2.hand.length}) Deck(${game.deck.length})`);

        await game.playNextTurn();
        turn++;
    }

    if (game.isGameOver) {
        console.log(`Game Over! Winner: ${game.winner?.name}`);
    } else {
        console.log('Game Terminated (Max Turns reached).');
        console.log(`Final State: P1(${p1.hand.length}) P2(${p2.hand.length}) Deck(${game.deck.length})`);
    }
}

runSimulation().catch(console.error);
