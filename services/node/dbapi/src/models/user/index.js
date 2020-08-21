import { rejectFun } from '../match';
import {
  findOrCreate,
  addAuthentication,
  removeAuthentication,
} from './authentication';
import { addTask, getTasks } from './scrape';

const reject = (method, args, msg) => rejectFun(method, args, msg, 'user');

const handle = ({ method, methodData } = {}) => {
  let op;
  const { username } = methodData;

  if (!username || typeof username !== 'string') {
    return reject(method, username, 'username incorrect type or unspecified');
  }

  const authCheck = () => ((
    !methodData.name
    || !methodData.token
    || typeof methodData.name !== 'string'
    || typeof methodData.token !== 'string'
  )
    ? reject(method, methodData, 'missing authentication name and token')
    : Promise.resolve(true));

  switch (method) {
    case 'removeAuthentication':
      op = authCheck()
        .then(() => removeAuthentication(methodData.name, methodData.token, username));
      break;
    case 'addAuthentication':
      op = authCheck()
        .then(() => addAuthentication(methodData.name, methodData.token, username));
      break;
    case 'login':
      op = authCheck()
        .then(() => findOrCreate(methodData.name, methodData.token, username));
      break;
    case 'addScrapeTask':
      op = addTask(username, methodData.scrapeTask);
      break;
    case 'getScrapeTasks':
      op = getTasks(methodData.scrapename);
      break;
    default:
      return Promise.reject(new Error(`[user]invalid method, ${method}`));
  }

  return op;
};

export default handle;
