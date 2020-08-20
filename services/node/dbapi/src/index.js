import mongoose from 'mongoose';
import log from 'chess_jslog';
import { consumer } from 'chess_jsrabbitmq';
import version from './models/version';

// models
import Match from './models/match';
// import User from './models/user';

/**
 * @typedef Message
 * @param {string} model the model to perform the operation (eg: player)
 * @param {string} method the method to use. eg: findOne
 * @param {any[]|any} methodData data to be passed into the method
 * @description special case for method will be save.
 */

const inputChecks = (message) => {
  const {
    model,
    method,
    methodData,
  } = message;

  if (
    typeof model !== 'string'
    || typeof method !== 'string'
  ) {
    return false;
  }

  if (typeof methodData === 'undefined' || methodData === null) return false;

  return true;
};

/**
 * @param {Message} msg
 * @param {Channel} ch
 */
const consumeMessage = (msg, ch, input) => {
  if (!inputChecks(input)) {
    log('[ERROR] invalid inputs', input);
    return Promise.reject(new Error('invalid inputs'));
  }
  log('received message', input);

  let job;
  switch (input.model) {
    case 'match':
      job = Match(input);
      break;
    // case 'user':
    //  job = User(input);
    //  break;
    default:
      job = Promise.reject(new Error('invalid model'));
  }

  return job;
};

mongoose.connect(process.env.MONGODB, {
  useNewUrlParser: true,
  autoIndex: false,
})
  .catch((err) => {
    log('[ERROR] connecting to database', err.message || err);
    process.exit();
  });

export const queueName = 'dbapi';
const app = () => version()
  .then(() => consumer(queueName, consumeMessage));

if (require.main === module) {
  app();
}

export default app;
