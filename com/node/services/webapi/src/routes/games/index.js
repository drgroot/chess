import express from 'express';
import log from 'chess_jslog';
import nodeMQ from 'chess_jsrabbitmq';

const router = express.Router();
router
  .get('/', (req, res) => {
    const { skip, chunkSize = 500 } = req.query;

    return nodeMQ.publishMessage(
      'dbapi',
      {
        method: 'find',
        model: 'match',
        methodData: [
          { repertoire: null },
          { pgnraw: 0 },
          {
            sort: { date: -1 },
            limit: parseInt(chunkSize, 10),
            skip: parseInt(skip, 10),
          },
        ],
      },
    )
      .then(({ isSuccess, results: games, error }) => {
        if (!isSuccess) {
          log('[ERROR] getting games', error);
          return { games: [], finished: true };
        }

        return { games, finished: games.length < chunkSize };
      })
      .then((data) => res.send(data))
      .catch((e) => {
        log('[ERROR] handling request', e);
        res.status(300).send('Internal Server Error');
      });
  });

export default router;
