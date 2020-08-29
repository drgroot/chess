import express from 'express';
import nodeMQ from 'chess_jsrabbitmq';
import pgnParser from 'pgn-parser';
import { Chess } from 'chess.js';

const deleteRepertoire = (user, database, repertoire) => nodeMQ.publishMessage(
  'dbapi',
  { model: 'match', method: 'find', methodData: { user, database, repertoire } },
).then(({ results: matches }) => Promise.all(
  matches.map(({ matchid }) => nodeMQ.publishMessage(
    'dbapi',
    { model: 'match', method: 'delete', methodData: matchid },
  )),
));

const getVariations = (pgn) => nodeMQ.publishMessage('pgnextract', pgn)
  .then(({ results }) => results);

const stripFen = (fen) => fen.split(/\s/g).slice(0, 2).join(' ');

const saveVariation = (user, database, repertoire, pgnraw, i) => {
  let fullPGN = null;
  try {
    [fullPGN] = pgnParser.parse(pgnraw);
  } catch (e) {
    [fullPGN] = pgnParser.parse(`${pgnraw} 1-0`);
  }

  const header = fullPGN.headers.reduce((s, h) => ({ ...s, [h.name]: h.value }), {});
  const match = {
    user,
    date: new Date(),
    whiteName: `${database} ${header.White}`,
    blackName: `${header.White}${i}`,
    database,
    repertoire,
    result: 0.5,
    pgnraw,
    moves: [],
  };

  const chess = new Chess();
  for (const { move: nextMove } of fullPGN.moves) {
    const fen = stripFen(chess.fen());
    match.moves.push({
      fen,
      nextMove,
    });
    chess.move(nextMove);
  }

  return nodeMQ.publishMessage('dbapi', { model: 'match', method: 'add', methodData: match })
    .then(({ isSuccess, error }) => {
      if (!isSuccess) {
        throw new Error(error);
      }

      return true;
    });
};

const router = express.Router();
router
  .get('/:color', (req, res) => {
    const { color } = req.params;
    return nodeMQ.publishMessage(
      'dbapi',
      {
        model: 'match',
        method: 'getRepertoire',
        methodData: {
          color,
          user: 'arangefruit',
        },
      },
    )
      .then(({ results }) => res.send(results));
  })
  .post('/', (req, res) => {
    const {
      user = 'arangefruit',
      color,
      database,
      pgnBig,
    } = req.body;

    // delete games
    return deleteRepertoire(user, database, color)
      // split pgn into smaller ones
      .then(() => getVariations(pgnBig)
        .then((variations) => Promise.all(
          // save each variation
          variations.map((v, i) => saveVariation(user, database, color, v, i)),
        )))
      .then(() => res.send(true));
  });

export default router;
