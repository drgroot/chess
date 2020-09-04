import { get } from 'axios';
import log from 'chess_jslog';

export const getArchives = (username) => get(`https://api.chess.com/pub/player/${username}/games/archives`)
  .then(({ data: { archives: urls } }) => urls.map((url) => {
    const [month, year] = url.split('/').reverse();
    return {
      url,
      date: new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1),
    };
  }));

export const getGames = async (archives) => {
  const allGames = [];

  for (const url of archives) {
    // eslint-disable-next-line no-await-in-loop
    const { data: { games } } = await get(url);
    log(`found ${games.length} games at url ${url}`);

    for (const game of games) {
      allGames.push(game);
    }
  }
  return allGames;
};
