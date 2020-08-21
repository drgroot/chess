import User from './schema';
import { findByUsername } from './authentication';

const checks = ({ name, params } = {}) => new Promise((resolve, reject) => {
  if (typeof name !== 'string') {
    return reject(new Error('scrape task name parameter needs to be string'));
  }

  if (typeof params !== 'object') {
    return reject(new Error('scrape task params need to be an object'));
  }

  return resolve(true);
});

export const addTask = (username, scrapeTask) => checks(scrapeTask)
  .then(() => findByUsername(username))
  .then((user) => {
    user.scrapeTasks.push(scrapeTask);
    return user.save();
  });

export const getTasks = (name) => checks({ name, params: {} })
  .then(() => User
    .find({
      scrapeTasks: {
        $elemMatch: {
          name,
        },
      },
    })
    .lean()
    .exec());
