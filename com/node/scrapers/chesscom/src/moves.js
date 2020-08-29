import { Chess } from 'chess.js';

const stripFen = (fen) => fen.split(/\s/g).slice(0, 2).join(' ');

/**
 * @description returns Match moves schema
 * @param {Chess} chess chess.js object
 */
const getMoves = (moves) => {
  const data = [];

  const chess = new Chess();
  for (const { comments = [], move: nextMove } of moves) {
    const fen = stripFen(chess.fen());
    data.push({
      fen,
      nextMove,
      metadata: [
        { key: 'comments', value: comments },
      ],
    });

    chess.move(nextMove);
  }

  return data;
};

export default getMoves;
