import pgnParser from 'pgn-parser';
import getMoves from './moves';
import nodeMQ from './rabbitmq';
import log from './log';

const alias = { aarange: 'Yusuf Ali', groot_tree: 'Yusuf Ali' };

const result = {
  '0-1': -1,
  '1-0': 1,
};

/**
 * converts input time to ms
 * @param {string} input form: h:mm:s
 */
const getMS = (input) => {
  let ms = 0;
  const [h, m, s] = input.split(/:/g);

  ms += 1000.0 * parseFloat(s, 10);
  ms += 1000.0 * 60 * parseInt(m, 10);
  ms += 1000.0 * 60 * 60 * parseInt(h, 10);
  return ms;
};

const addGame = (user, {
  pgn, white, black, rules, time_class: time,
}) => {
  const [fullPGN] = pgnParser.parse(pgn);

  if (fullPGN.moves.length === 0 || rules !== 'chess') {
    log('[error] skipping match', { rules, pgn });
    return false;
  }

  const header = fullPGN.headers.reduce((s, h) => ({
    ...s,
    [h.name]: h.value,
  }), {});

  const match = {
    user: 'aarange', // TODO: get from db
    date: new Date(header.Date.replace(/\./, '-')),
    whiteName: (alias[white.username])
      ? alias[white.username] : white.username,
    blackName: (alias[black.username])
      ? alias[black.username] : black.username,
    whiteElo: white.rating,
    blackElo: black.rating,
    database: 'All Games',
    result: result[header.Result] ? result[header.Result] : 0.5,
    pgnraw: pgn,
    moves: getMoves(fullPGN.moves),
    metadata: [
      { key: 'Game Class', value: time },
      { key: 'Location', value: 'Online' },
      { key: 'Site', value: 'chess.com' },
      { key: 'ECO', value: header.ECO },
      { key: 'Termination', value: header.Termination },
      { key: 'Time Control', value: header.TimeControl },
    ],
  };

  // clean up comments. calculate duration using increment in ms
  const increment = (header.TimeControl.indexOf('+') === -1)
    ? 0
    : parseInt(header.TimeControl.replace(/^\d+\+/, '0'), 10) * 1000;
  const clocks = [];
  match.moves.forEach((move, i) => {
    const comments = move.metadata.find((m) => m.key === 'comments');
    if (comments && comments.value.length > 0) {
      const { values: [clock] } = comments.value
        .find((p) => p.commands.length > 0 && p.commands.find((c) => c.key === 'clk'))
        .commands
        .find((c) => c.key === 'clk');

      const ms = getMS(clock);
      clocks.push(ms);

      const duration = (clocks.length <= 2)
        ? 0
        : ((clocks[i - 2] - (ms - increment)) / 1000.0);

      move.metadata.push({
        key: 'duration',
        value: duration,
      });
    }
  });

  // add match do database
  return nodeMQ.publishMessage('dbapi', {
    model: 'match',
    method: 'add',
    methodData: match,
  })
    .then(({ isSuccess, error }) => {
      if (error && error.indexOf('duplicate key') === -1) {
        log(`[error] adding game for user ${user}`, { error, pgn });
      }

      return isSuccess;
    });
};

export default addGame;
