/* eslint-disable no-await-in-loop */
import log from 'chess_jslog';
import { get } from 'axios';
import addGame from './game';

const promiseLoop = (tasks, results = []) => {
  if (tasks.length === 0) return results;

  const job = tasks.shift();
  return job.then((r) => {
    results.push(r);
    return promiseLoop(tasks, results);
  });
};

// TODO: grab this from database on USERS model
export const users = ['aarange', 'abdullahs484', 'MuhammadE', 'grandashak'];

const getGames = async (user) => {
  const allGames = [];
  const { data: { archives: urls } } = await get(`https://api.chess.com/pub/player/${user}/games/archives`);

  log(`found ${urls.length} urls for ${user}`);
  for (const url of urls) {
    const { data: { games } } = await get(url);
    log(`found ${games.length} games at url ${url} for ${user}`);

    for (const game of games) {
      allGames.push(await addGame(user, game));
    }
  }

  log(`downloaded ${allGames.length} games for ${user}`);
  return allGames;
};

export const processUser = (user) => {
  log(`Starting to scrape user: ${user}`);

  return getGames(user)
    .then((results) => {
      const added = results.filter((r) => r === true);
      log(`Added ${added.length} games of ${results.length} for ${user}`);
    });
};

if (require.main === module) {
  log('starting to scrape users', users);
  promiseLoop(users.map((u) => processUser(u)))
    .catch((e) => log('[error] scraping chess.com', e))
    .then(() => process.exit());
}
