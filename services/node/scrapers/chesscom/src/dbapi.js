import nodemq from 'chess_jsrabbitmq';
import log from 'chess_jslog';

/**
 * Task Parameters
 * @typedef {Object} TaskParam
 * @property {string} username chess.com username to scrape
 * @property {string} [alias] string to replace username with when games are being processed.
 */

/**
 * Scraping Task
 * @typedef {Object} Task
 * @property {string} name this should be chesscom for this microservice
 * @property {string} user the username that is requesting this task
 * @property {TaskParam} params task parameters
 */

const send = (model, method, methodData) => nodemq.publishMessage('dbapi', { model, method, methodData })
  .then(({ isSuccess, results, error }) => {
    if (!isSuccess) {
      log(`[ERROR] with method ${method} to model ${model}`, error);
    }
    return results;
  });

/**
 * @description returns a list of users to be scraped from chess.com. each entry is a "Task"
 * @returns [Task]
 */
export const getTasks = () => send('user', 'getScrapeTasks', { username: 't', scrapename: 'chesscom' })
  .then((users) => users
    .flatMap(
      ({ username: user, scrapeTasks }) => scrapeTasks
        .filter((t) => t.name === 'chesscom')
        .map(({ _id, ...t }) => ({ ...t, user })),
    ));

/**
 * @description returns the date of the most recent game in the database belonging to the
 *  given chess.com user
 * @param {string} user
 * @param {string} chessComUser name of chess.com username
 */
export const getLastEntry = (user, chessComUser) => send(
  'match',
  'find',
  [
    {
      user,
      pgnraw: { $regex: `.*${chessComUser}.*` },
    },
    {},
    {
      limit: 1,
      sort: { date: -1 },
    },
  ],
)
  .then((game) => {
    if (game.length > 0) return new Date(game[0].date);
    return false;
  });
