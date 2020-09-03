import Match from './schema';

export const find = (input) => {
  let query;
  if (input.constructor === Array) {
    query = Match.find(...input);
  } else {
    query = Match.find(input);
  }

  return query
    .lean()
    .exec()
    .then((matches) => matches.map(({ _id: matchid, ...match }) => ({ matchid, ...match })));
};

/**
 * @param {string} position FEN position
 * @param {object} constraints eg: username, white, black, etc.
 */
export const findPosition = (position, constraints = {}) => find({
  ...constraints,
  'moves.fen': position,
});

/**
 * @param {string} user username
 * @param {string} color white or black
 */
export const getRepertoire = (user, color) => find({
  user,
  repertoire: color,
});

export const noAnnotations = (version, annotator) => find({
  'moves.annotations.version': {
    $ne: {
      version,
      annotator,
    },
  },
})
  .then((matches) => matches.filter((match) => {
    const moves = match.moves
      .filter((move) => {
        for (const annotation of move.annotations) {
          if (annotation.version === version && annotation.annotator === annotator) {
            return true;
          }
        }
        return false;
      });

    return moves.length === 0;
  }));
