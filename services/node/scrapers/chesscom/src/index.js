import log from 'chess_jslog';
import { getTasks, getLastEntry } from './dbapi';
import { getArchives, getGames } from './chesscom';
import addGame from './game';

export const filterArchives = (username, lowerDate) => getArchives(username)
  .then((archives) => {
    const urls = archives.filter(({ date }) => date.getTime() > lowerDate).map(({ url }) => url);
    log(`found ${archives.length} archives for ${username}. Taking ${urls.length} for scraping.`, urls);
    return urls;
  });

export const processTask = ({ user, params: { username, alias } }) => getLastEntry(user, username)
  .then((latestGame) => {
    if (latestGame) {
      log(`latest game for ${username} is found to be ${latestGame}`);
      return latestGame.getTime();
    }
    return -Infinity;
  })
  .then((lowerDate) => filterArchives(username, lowerDate))
  .then((urls) => getGames(urls))
  .then(async (games) => {
    const input = (typeof alias !== 'undefined') ? { username: alias } : {};
    const jobs = [];

    for (const game of games) {
      // eslint-disable-next-line no-await-in-loop
      jobs.push(await addGame(user, input, game));
    }

    return jobs;
  });

if (require.main === module) {
  getTasks()
    .then(async (tasks) => {
      for (const task of tasks) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await processTask(task);
        } catch (e) {
          log(`[ERROR] processing task: ${JSON.stringify(task)}`, e);
        }
      }
    })
    .then(() => process.exit());
}
